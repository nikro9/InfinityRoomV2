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

# --- CONFIGURACIÓN ESPECÍFICA DE ESTE WORKER ---
STRATEGY_CONFIG = config.STRATEGIES["BITCOIN_PIVOTS"]
REDIS_PREFIX = STRATEGY_CONFIG["redis_prefix"]
SYMBOL_TO_TRADE = STRATEGY_CONFIG["symbol"]

# --- CONEXIÓN A REDIS ---
redis_url = os.getenv('REDIS_URL')
if redis_url: r = redis.from_url(redis_url, decode_responses=True)
else: r = redis.Redis(host='localhost', port=6379, decode_responses=True)

try:
    r.ping()
    print("✅ Bitcoin Worker: Conectado a Redis.")
except redis.exceptions.ConnectionError as e:
    sys.exit(f"❌ Bitcoin Worker: Error de conexión con Redis: {e}")

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
    # La lógica interna de esta función es idéntica a la del altcoin worker
    # Solo cambian las variables de configuración que lee desde arriba
    pass # Reemplazar con la lógica completa de 'analyze_and_decide'

# --- BUCLE PRINCIPAL ---
if __name__ == "__main__":
    print(f"▶️  Iniciando Bitcoin Worker para {SYMBOL_TO_TRADE} (Modo Debate de IAs)...")
    ws_thread = threading.Thread(target=websocket_thread_target, daemon=True)
    ws_thread.start()
    time.sleep(5)
    
    r.delete(f"{REDIS_PREFIX}:status", f"{REDIS_PREFIX}:state", f"{REDIS_PREFIX}:chart_data")

    try:
        while True:
            print(f"[{time.strftime('%H:%M:%S')}] Obteniendo datos para {SYMBOL_TO_TRADE}...")
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
        print(f"\n🛑 Worker de Bitcoin detenido.")
    except Exception as e:
        print(f"❌ Error catastrófico en Worker de Bitcoin: {e}")