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
from src.ai_model import get_infinity_room_decision
from src.notifications import send_telegram_message

# --- CONFIGURACIÓN ESPECÍFICA ---
STRATEGY_CONFIG = config.STRATEGIES["BITCOIN_PIVOTS"]
REDIS_PREFIX = STRATEGY_CONFIG["redis_prefix"]
SYMBOL_TO_TRADE = STRATEGY_CONFIG["symbol"]

# --- CONEXIÓN A REDIS ---
redis_url = os.getenv('REDIS_URL')
if redis_url: r = redis.from_url(redis_url, decode_responses=True)
else: r = redis.Redis(host='localhost', port=6379, decode_responses=True)
try: r.ping()
except redis.exceptions.ConnectionError as e: sys.exit(f"❌ Bitcoin Worker: Error de conexión con Redis: {e}")

# --- LÓGICA DEL WEBSOCKET Y ORDER FLOW ---
def websocket_thread_target():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run_websocket_listener(SYMBOL_TO_TRADE))

def calculate_order_flow_metrics(trades: list) -> dict:
    if not trades: return {"buy_volume": 0, "sell_volume": 0, "delta": 0, "trade_count": 0}
    df_trades = pd.DataFrame(trades)
    buy_volume = df_trades[~df_trades['is_buyer_maker']]['quantity'].sum()
    sell_volume = df_trades[df_trades['is_buyer_maker']]['quantity'].sum()
    return {"buy_volume": buy_volume, "sell_volume": sell_volume, "delta": buy_volume - sell_volume, "trade_count": len(trades)}

# --- FUNCIÓN PRINCIPAL DE ANÁLISIS ---
def analyze_and_decide(df_5m):
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

    live_trades = get_live_trades_and_clear_buffer()
    order_flow_metrics = calculate_order_flow_metrics(live_trades)
    print(f"📊 Flujo de Órdenes: {order_flow_metrics['trade_count']} trades, Delta={order_flow_metrics['delta']:.2f} BTC")

    # --- DEBATE DE IAS ---
    timestamp_utc = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    proposal, reasoning, full_analysis = get_infinity_room_decision(df_merged, order_flow_metrics)
    
    # --- PUBLICAR EN REDIS ---
    status_update = {"status": "PROPOSAL" if proposal else "IDLE", "reasoning": reasoning, "proposal": proposal}
    r.set(f"{REDIS_PREFIX}:status", json.dumps(status_update))
    
    log_entry = f"[{timestamp_utc}] - {reasoning}"
    r.lpush(f"{REDIS_PREFIX}:log", log_entry)
    r.ltrim(f"{REDIS_PREFIX}:log", 0, 99)
    
    # Guardamos el debate completo en el chat
    chat_entry = f"**Análisis de las {timestamp_utc}:**\n\n"
    for analyst, analysis in full_analysis.items():
        chat_entry += f"**Analista ({analyst}):**\n"
        chat_entry += f"```json\n{json.dumps(analysis, indent=2)}\n```\n"
    if proposal:
        chat_entry += f"\n**DECISIÓN FINAL:**\nTrade APROBADO. {reasoning}"
    else:
        chat_entry += f"\n**DECISIÓN FINAL:**\n{reasoning}"

    r.lpush(f"{REDIS_PREFIX}:chat_log", chat_entry)
    r.ltrim(f"{REDIS_PREFIX}:chat_log", 0, 49)
    
    df_chart_data = df_merged.tail(200).reset_index().rename(columns={'ema_12': 'ema_fast', 'rsi_14': 'rsi'})
    chart_json_output = json.loads(df_chart_data.to_json(orient='split'))
    r.set(f"{REDIS_PREFIX}:chart_data", json.dumps(chart_json_output))

    # --- ENVIAR NOTIFICACIÓN POR TELEGRAM ---
    if proposal:
        try:
            msg = (
                f"🚨 *SEÑAL DE TRADING - {SYMBOL_TO_TRADE}*\n\n"
                f"📌 Tipo: *{proposal.get('type', 'N/A')}*\n"
                f"💰 Entry: `{proposal.get('entry_price', 'N/A')}`\n"
                f"🛑 Stop Loss: `{proposal.get('stop_loss', 'N/A')}`\n"
                f"🎯 Take Profit: `{proposal.get('take_profit', 'N/A')}`\n\n"
                f"📝 {reasoning}"
            )
            send_telegram_message(msg)
        except Exception as e:
            print(f"Error enviando Telegram: {e}")

    print(f"-> Ciclo finalizado. Razon: {reasoning}")

# --- BUCLE PRINCIPAL ---
if __name__ == "__main__":
    print(f"▶️  Iniciando {SYMBOL_TO_TRADE} Worker (Modo Consejo de IAs)...")
    ws_thread = threading.Thread(target=websocket_thread_target, daemon=True)
    ws_thread.start()
    time.sleep(5)
    r.delete(f"{REDIS_PREFIX}:status", f"{REDIS_PREFIX}:state", f"{REDIS_PREFIX}:chart_data")
    try:
        while True:
            data = get_historical_data(symbol=SYMBOL_TO_TRADE, timeframe=STRATEGY_CONFIG["timeframe_operativa"], days=15)
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
        print(f"\n🛑 Worker de {SYMBOL_TO_TRADE} detenido.")
    except Exception as e:
        print(f"❌ Error catastrófico en Worker: {e}")
        import traceback
        traceback.print_exc()
