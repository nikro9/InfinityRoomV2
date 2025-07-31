# infinity_worker.py
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
from src.market_data import get_historical_data, run_websocket_listener, get_live_trades_and_clear_buffer
from src.indicators import calculate_ema, calculate_rsi, calculate_sml_channel
from src.ai_model import get_technical_analysis, get_risk_analysis

# ==============================================================================
# --- INICIO DE LA CORRECCIÓN: CONEXIÓN DINÁMICA A REDIS ---
# ==============================================================================
redis_url = os.getenv('REDIS_URL')
if redis_url:
    print("Conectando a Redis en la nube...")
    r = redis.from_url(redis_url, decode_responses=True)
else:
    print("Conectando a Redis local...")
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)

try:
    r.ping()
    print("✅ Conectado a Redis.")
except redis.exceptions.ConnectionError as e:
    sys.exit(f"❌ Error de conexión con Redis: {e}")
# ==============================================================================
# --- FIN DE LA CORRECCIÓN ---
# ==============================================================================

# --- LÓGICA DEL WEBSOCKET Y ORDER FLOW ---
def websocket_thread_target():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run_websocket_listener(config.SYMBOL))

def calculate_order_flow_metrics(trades: list) -> dict:
    if not trades: return {"buy_volume": 0, "sell_volume": 0, "delta": 0, "trade_count": 0}
    df_trades = pd.DataFrame(trades)
    buy_volume = df_trades[~df_trades['is_buyer_maker']]['quantity'].sum()
    sell_volume = df_trades[df_trades['is_buyer_maker']]['quantity'].sum()
    return {"buy_volume": buy_volume, "sell_volume": sell_volume, "delta": buy_volume - sell_volume, "trade_count": len(trades)}

# --- FUNCIÓN PRINCIPAL DE ANÁLISIS ---
def analyze_and_decide(df_5m):
    print(f"[{time.strftime('%H:%M:%S')}] Analizando {len(df_5m)} velas...")
    
    required_candles = config.EMA_TREND_PERIOD + 5
    if len(df_5m) < required_candles: return
    df_5m['ema_12'] = calculate_ema(df_5m['close'], period=config.EMA_FAST_PERIOD)
    df_5m['ema_200'] = calculate_ema(df_5m['close'], period=config.EMA_TREND_PERIOD)
    df_5m['rsi_14'] = calculate_rsi(df_5m['close'], period=config.RSI_PERIOD)
    df_5m.dropna(inplace=True)
    df_sml = df_5m.resample(config.TIMEFRAME_SML, origin="13:20:00").agg({'open': 'first', 'high': 'max', 'low': 'min', 'close': 'last'}).dropna()
    df_sml = calculate_sml_channel(df_sml)
    df_merged = pd.merge_asof(df_5m.sort_index(), df_sml[['sml_high', 'sml_low']], left_index=True, right_index=True, direction='backward')
    df_merged.dropna(inplace=True)
    if len(df_merged) < 2: return

    live_trades = get_live_trades_and_clear_buffer()
    order_flow_metrics = calculate_order_flow_metrics(live_trades)
    print(f"📊 Flujo de Órdenes: {order_flow_metrics['trade_count']} trades, Delta={order_flow_metrics['delta']:.2f} BTC")

    timestamp_utc = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    current_state = json.loads(r.get("infinity_room:state") or '{"status": "IDLE", "reasoning": "Iniciando..."}')
    
    new_state, proposal, analyst_raw_response = get_technical_analysis(df_merged, current_state, order_flow_metrics)
    r.lpush("infinity_room:chat_log", analyst_raw_response)
    r.ltrim("infinity_room:chat_log", 0, 49)

    if proposal:
        print("⚖️ Propuesta generada. Enviando al Gestor de Riesgos...")
        risk_decision, risk_raw_response = get_risk_analysis(proposal, order_flow_metrics)
        r.lpush("infinity_room:chat_log", risk_raw_response)
        r.ltrim("infinity_room:chat_log", 0, 49)

        if risk_decision.get("decision") == "APPROVE":
            print("✅ ¡Propuesta APROBADA por el Gestor de Riesgos!")
            new_state['active_trade'] = proposal
            trade_log_entry = {**proposal, "timestamp": timestamp_utc}
            r.lpush("infinity_room:trades", json.dumps(trade_log_entry))
            r.ltrim("infinity_room:trades", 0, 19)
        else:
            print(f"❌ Propuesta RECHAZADA. Razón: {risk_decision.get('reasoning')}")
            new_state['status'] = 'IDLE'
            new_state['reasoning'] = f"Propuesta rechazada por Riesgos: {risk_decision.get('reasoning')}"

    reasoning = new_state.get('reasoning', '...')
    status_update = {"status": new_state.get('status'), "reasoning": reasoning, "proposal": new_state.get('active_trade')}
    
    r.set("infinity_room:state", json.dumps(new_state))
    r.set("infinity_room:status", json.dumps(status_update))
    
    log_entry = f"[{timestamp_utc}] - {reasoning}"
    r.lpush("infinity_room:log", log_entry)
    r.ltrim("infinity_room:log", 0, 99)
    
    df_chart_data = df_merged.tail(200).reset_index().rename(columns={'ema_12': 'ema_fast', 'rsi_14': 'rsi', 'ema_200': 'ema_trend'})
    chart_json_output = json.loads(df_chart_data.to_json(orient='split'))
    r.set("infinity_room:chart_data", json.dumps(chart_json_output))

    print(f"-> ✅ Ciclo finalizado. Nuevo Estado: {new_state.get('status')}. Razón: {reasoning}")

# --- BUCLE PRINCIPAL ---
if __name__ == "__main__":
    print("▶️  Iniciando Infinity Room (Modo Debate de IAs)...")
    ws_thread = threading.Thread(target=websocket_thread_target, daemon=True)
    ws_thread.start()
    time.sleep(5)
    
    r.delete("infinity_room:status", "infinity_room:state", "infinity_room:chart_data", "infinity_room:log", "infinity_room:chat_log", "infinity_room:trades")

    try:
        while True:
            print(f"[{time.strftime('%H:%M:%S')}] Obteniendo datos de mercado (OHLCV)...")
            data = get_historical_data(symbol=config.SYMBOL, timeframe=config.TIMEFrame_OPERATIVA, days=15)
            if data:
                df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                df.set_index('timestamp', inplace=True)
                analyze_and_decide(df.copy())
            
            now = datetime.utcnow()
            minutes_to_next_candle = 5 - (now.minute % 5)
            seconds_to_wait = (minutes_to_next_candle - 1) * 60 + (60 - now.second)
            print(f"[{time.strftime('%H:%M:%S')}] Próxima actualización en {seconds_to_wait} segundos...")
            time.sleep(max(1, seconds_to_wait))
            
    except KeyboardInterrupt:
        print("\n🛑 Worker detenido por el usuario.")
    except Exception as e:
        print(f"❌ Error catastrófico en el worker: {e}")
        import traceback
        traceback.print_exc()