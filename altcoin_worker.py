# altcoin_worker.py
import time
import json
import os
import pandas as pd
import sys
from datetime import datetime
import redis
import asyncio
import threading

# --- CONFIGURACIÓN E IMPORTACIONES ---
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "src")))
from src import config
from src.market_data import get_historical_data
from src.indicators import calculate_ema, calculate_rsi, calculate_sml_channel
from src.ai_model import get_technical_analysis, get_risk_analysis

# --- CONFIGURACIÓN ESPECÍFICA DE ESTE WORKER ---
STRATEGY_CONFIG = config.STRATEGIES["ALTCOIN_PIVOTS"]

# --- CONEXIÓN A REDIS ---
redis_url = os.getenv('REDIS_URL')
if redis_url:
    r = redis.from_url(redis_url, decode_responses=True)
else:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)

try:
    r.ping()
    print("✅ Altcoin Worker: Conectado a Redis.")
except redis.exceptions.ConnectionError as e:
    sys.exit(f"❌ Altcoin Worker: Error de conexión con Redis: {e}")

# --- FUNCIÓN PRINCIPAL DE ANÁLISIS PARA UN ACTIVO ---
def analyze_and_decide(df_5m, asset_symbol):
    
    redis_prefix = f"{STRATEGY_CONFIG['redis_prefix']}:{asset_symbol.replace('/', '')}"
    print(f"[{time.strftime('%H:%M:%S')}] Analizando {len(df_5m)} velas para {asset_symbol}...")

    # 1. PREPARACIÓN DE INDICADORES
    required_candles = config.EMA_TREND_PERIOD + 5
    if len(df_5m) < required_candles: return

    df_5m['ema_12'] = calculate_ema(df_5m['close'], period=config.EMA_FAST_PERIOD)
    df_5m['ema_200'] = calculate_ema(df_5m['close'], period=config.EMA_TREND_PERIOD)
    df_5m['rsi_14'] = calculate_rsi(df_5m['close'], period=config.RSI_PERIOD)
    df_5m.dropna(inplace=True)

    df_sml = df_5m.resample(STRATEGY_CONFIG['sml_timeframe'], origin=STRATEGY_CONFIG['sml_anchor_time']).agg(
        {'open': 'first', 'high': 'max', 'low': 'min', 'close': 'last'}
    ).dropna()
    df_sml = calculate_sml_channel(df_sml)
    
    df_merged = pd.merge_asof(df_5m.sort_index(), df_sml[['sml_high', 'sml_low']], left_index=True, right_index=True, direction='backward')
    df_merged.dropna(inplace=True)
    if len(df_merged) < 2: return

    # Simulamos el order flow ya que no tenemos un websocket por cada altcoin
    mock_order_flow = {"buy_volume": 0, "sell_volume": 0, "delta": 0, "trade_count": 0}
    
    # --- DEBATE DE IAS ---
    timestamp_utc = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    current_state = json.loads(r.get(f"{redis_prefix}:state") or '{"status": "IDLE"}')
    
    new_state, proposal, analyst_raw_response = get_technical_analysis(df_merged, current_state, mock_order_flow)
    
    r.lpush(f"{redis_prefix}:chat_log", analyst_raw_response)
    r.ltrim(f"{redis_prefix}:chat_log", 0, 49)

    if proposal:
        risk_decision, risk_raw_response = get_risk_analysis(proposal, mock_order_flow)
        r.lpush(f"{redis_prefix}:chat_log", risk_raw_response)
        r.ltrim(f"{redis_prefix}:chat_log", 0, 49)

        if risk_decision.get("decision") == "APPROVE":
            new_state['active_trade'] = proposal
            trade_log_entry = {**proposal, "timestamp": timestamp_utc}
            r.lpush(f"{redis_prefix}:trades", json.dumps(trade_log_entry))
            r.ltrim(f"{redis_prefix}:trades", 0, 19)
        else:
            new_state['status'] = 'IDLE'
            new_state['reasoning'] = f"Propuesta rechazada por Riesgos: {risk_decision.get('reasoning')}"

    # --- PUBLICAR EN REDIS ---
    reasoning = new_state.get('reasoning', '...')
    status_update = {"status": new_state.get('status'), "reasoning": reasoning, "proposal": new_state.get('active_trade')}
    
    r.set(f"{redis_prefix}:state", json.dumps(new_state))
    r.set(f"{redis_prefix}:status", json.dumps(status_update))
    
    log_entry = f"[{timestamp_utc}] - {reasoning}"
    r.lpush(f"{redis_prefix}:log", log_entry)
    r.ltrim(f"{redis_prefix}:log", 0, 99)
    
    df_chart_data = df_merged.tail(200).reset_index().rename(columns={'ema_12': 'ema_fast', 'rsi_14': 'rsi', 'ema_200': 'ema_trend'})
    chart_json_output = json.loads(df_chart_data.to_json(orient='split'))
    r.set(f"{redis_prefix}:chart_data", json.dumps(chart_json_output))

    print(f"-> ✅ Ciclo para {asset_symbol} finalizado. Nuevo Estado: {new_state.get('status')}.")


# --- BUCLE PRINCIPAL ---
if __name__ == "__main__":
    print(f"▶️  Iniciando Altcoin Worker para los activos: {STRATEGY_CONFIG['asset_list']}")
    
    try:
        while True:
            # Iteramos sobre cada activo en la lista de configuración
            for asset in STRATEGY_CONFIG["asset_list"]:
                print(f"--- Procesando {asset} ---")
                data = get_historical_data(symbol=asset, timeframe=STRATEGY_CONFIG["timeframe_operativa"], days=15)
                
                if data:
                    df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                    df.set_index('timestamp', inplace=True)
                    analyze_and_decide(df.copy(), asset)
                
                # Pequeña pausa entre cada activo para no saturar las APIs
                time.sleep(10)
            
            print(f"[{time.strftime('%H:%M:%S')}] Todos los activos analizados. Próxima actualización en 5 minutos...")
            time.sleep(300)
            
    except KeyboardInterrupt:
        print(f"\n🛑 Altcoin Worker detenido.")
    except Exception as e:
        print(f"❌ Error catastrófico en Altcoin Worker: {e}")
        import traceback
        traceback.print_exc()