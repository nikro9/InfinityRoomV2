# src/market_data.py
import ccxt
import pandas as pd
from datetime import datetime, timedelta
import asyncio
import websockets
import json

# --- FUNCIÓN PARA DATOS HISTÓRICOS (EXISTENTE) ---
def get_historical_data(symbol='BTC/USDT', timeframe='5m', days=3):
    """
    Obtiene datos históricos (OHLCV) de Binance usando ccxt,
    manejando la paginación automáticamente.
    """
    exchange = ccxt.binanceus()
    since = exchange.parse8601(str(datetime.utcnow() - timedelta(days=days)))
    all_ohlcv = []
    limit = 1000

    try:
        while True:
            ohlcv = exchange.fetch_ohlcv(symbol, timeframe, since, limit=limit)
            if not ohlcv: break
            since = ohlcv[-1][0] + 1
            all_ohlcv.extend(ohlcv)
            if len(ohlcv) < limit: break
    except Exception as e:
        print(f"❌ Error al obtener datos históricos: {e}")
        return None
    return all_ohlcv

# --- NUEVAS FUNCIONES PARA DATOS DE TRADE EN TIEMPO REAL ---

# Esta lista global almacenará los trades recibidos del WebSocket
live_trades = []

async def listen_to_trades_websocket(symbol: str):
    """
    Se conecta al WebSocket de Binance y escucha los trades en tiempo real.
    """
    # Formatear el símbolo para la URL del WebSocket (ej. 'BTC/USDT' -> 'btcusdt')
    stream_symbol = symbol.lower().replace('/', '')
    url = f"wss://stream.binance.com:9443/ws/{stream_symbol}@trade"
    
    print(f"📡 Conectando al WebSocket de trades en: {url}")
    
    try:
        async with websockets.connect(url) as websocket:
            print("✅ Conexión a WebSocket establecida.")
            while True:
                try:
                    message = await websocket.recv()
                    trade_data = json.loads(message)
                    
                    # Extraemos la información relevante del trade
                    trade = {
                        'timestamp': trade_data['T'],
                        'price': float(trade_data['p']),
                        'quantity': float(trade_data['q']),
                        'is_buyer_maker': trade_data['m']
                    }
                    live_trades.append(trade)
                    
                    # Para evitar que la lista crezca indefinidamente, la mantenemos con un tamaño máximo
                    if len(live_trades) > 2000:
                        del live_trades[0]

                except websockets.ConnectionClosed:
                    print("⚠️ Conexión WebSocket cerrada. Reconectando...")
                    break # Sale del bucle interno para que el bucle externo reconecte
                except Exception as e:
                    print(f"❌ Error procesando mensaje de WebSocket: {e}")

    except Exception as e:
        print(f"❌ Error crítico en la conexión WebSocket: {e}")

async def run_websocket_listener(symbol: str):
    """
    Mantiene la conexión del WebSocket corriendo y reconectando si es necesario.
    """
    while True:
        await listen_to_trades_websocket(symbol)
        print("Reintentando conexión a WebSocket en 5 segundos...")
        await asyncio.sleep(5)

def get_live_trades_and_clear_buffer() -> list:
    """
    Función que el worker llamará para obtener los trades acumulados
    y limpiar la lista para el siguiente ciclo.
    """
    global live_trades
    trades_to_process = list(live_trades)
    live_trades.clear()
    return trades_to_process