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
from src.ai_model import get_infinity_room_decision
from src.notifications import send_telegram_message

# --- CONFIGURACIÓN ESPECÍFICA ---
STRATEGY_CONFIG = config.STRATEGIES["ALTCOIN_PIVOTS"]

# --- CONEXIÓN A REDIS ---
redis_url = os.getenv('REDIS_URL')
if redis_url: r = redis.from_url(redis_url, decode_responses=True)
else: r = redis.Redis(host='localhost', port=6379, decode_responses=True)
try: r.ping()
except redis.exceptions.ConnectionError as e: sys.exit(f"❌ Altcoin Worker: Error de conexión con Redis: {e}")

# --- FUNCIÓN PRINCIPAL DE ANÁLISIS ---
def analyze_and_decide(df_5m, asset_symbol):
    redis_prefix = f"{STRATEGY_CONFIG['redis_prefix']}:{asset_symbol.replace('/', '')}"
    
    required_candles = config.EMA_TREND_PERIOD + 5
    if len(df_5m) < required_candles: return
    df_5m['ema_12'] = calculate_ema(df_5m['close'], period=config.EMA_FAST_PERIOD)
    df_5m['rsi_14'] = calculate_rsi(df_5m['close'], period=config.RSI_PERIOD)
    df_5m.dropna(inplace=True)
    df_sml = df_5m.resample(STRATEGY_CONFIG['sml_timeframe'], origin=STRATEGY_CONFIG['sml_anchor_time']).agg({'open': 'first', 'high': 'max', 'low': 'min', 'close': 'last'}).dropna()
    df_sml = calculate_sml_channel(df_sml)
    df_merged = pd.merge_asof(df_5m.sort_index(), df_sml[['sml_high', 'sml_low']], left_index=True, right_index=True, direction='backward')
    df_merged.dropna(inplace=True)
    if len(df_merged) < 40: return

    mock_order_flow = {"buy_volume": 0, "sell_volume": 0, "delta": 0, "trade_count": 0}
    
    # --- DEBATE DE IAS ---
    timestamp_utc = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    proposal, reasoning, full_analysis = get_infinity_room_decision(df_merged, mock_order_flow)
    
    # --- PUBLICAR EN REDIS ---
    status_update = {"status": "PROPOSAL" if proposal else "IDLE", "reasoning": reasoning, "proposal": proposal}
    r.set(f"{redis_prefix}:status", json.dumps(status_update))
    
    log_entry = f"[{timestamp_utc}] - {reasoning}"
    r.lpush(f"{redis_prefix}:log", log_entry)
    r.ltrim(f"{redis_prefix}:log", 0, 99)
    
    chat_entry = f"**Análisis de {asset_symbol} a las {timestamp_utc}:**\n\n"
    for analyst, analysis in full_analysis.items():
        chat_entry += f"**Analista ({analyst}):**\n"
        chat_entry += f"```json\n{json.dumps(analysis, indent=2)}\n```\n"
    if proposal:
        chat_entry += f"\n**DECISIÓN FINAL:**\nTrade APROBADO. {reasoning}"
    else:
        chat_entry += f"\n**DECISIÓN FINAL:**\n{reasoning}"

    r.lpush(f"{redis_prefix}:chat_log", chat_entry)
    r.ltrim(f"{redis_prefix}:chat_log", 0, 49)
    
    df_chart_data = df_merged.tail(200).reset_index().rename(columns={'ema_12': 'ema_fast', 'rsi_14': 'rsi'})
    chart_json_output = json.loads(df_chart_data.to_json(orient='split'))
    r.set(f"{redis_prefix}:chart_data", json.dumps(chart_json_output))

    # --- ENVIAR NOTIFICACIÓN POR TELEGRAM ---
    if proposal:
        try:
            msg = (
                f"🚨 *SEÑAL DE TRADING - {asset_symbol}*\n\n"
                f"📌 Tipo: *{proposal.get('type', 'N/A')}*\n"
                f"💰 Entry: `{proposal.get('entry_price', 'N/A')}`\n"
                f"🛑 Stop Loss: `{proposal.get('stop_loss', 'N/A')}`\n"
                f"🎯 Take Profit: `{proposal.get('take_profit', 'N/A')}`\n\n"
                f"📝 {reasoning}"
            )
            send_telegram_message(msg)
        except Exception as e:
            print(f"Error enviando Telegram para {asset_symbol}: {e}")

    print(f"-> Ciclo para {asset_symbol} finalizado. Razon: {reasoning}")

# --- BUCLE PRINCIPAL ---
if __name__ == "__main__":
    print(f"▶️  Iniciando Altcoin Worker para los activos: {STRATEGY_CONFIG['asset_list']}")
    try:
        while True:
            for asset in STRATEGY_CONFIG["asset_list"]:
                print(f"--- Procesando {asset} ---")
                data = get_historical_data(symbol=asset, timeframe=STRATEGY_CONFIG["timeframe_operativa"], days=15)
                if data:
                    df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                    df.set_index('timestamp', inplace=True)
                    analyze_and_decide(df.copy(), asset)
                time.sleep(10)
            
            print(f"[{time.strftime('%H:%M:%S')}] Todos los activos analizados. Próxima actualización en 5 minutos...")
            time.sleep(300)
    except KeyboardInterrupt:
        print(f"\n🛑 Altcoin Worker detenido.")
    except Exception as e:
        print(f"❌ Error catastrófico en Altcoin Worker: {e}")
        import traceback
        traceback.print_exc()
