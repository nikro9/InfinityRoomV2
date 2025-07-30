# src/config.py
import os

# -- CONFIGURACIÓN DEL MERCADO Y ACTIVO --
SYMBOL = 'BTC/USDT'
EXCHANGE = 'binance'
TIMEFrame_OPERATIVA = '5m'
# AJUSTADO: 200 minutos para un SML más reactivo, ideal para scalping.
TIMEFRAME_SML = '200min' 

# -- CONFIGURACIÓN DE LA ESTRATEGIA --
EMA_FAST_PERIOD = 12
EMA_TREND_PERIOD = 200 # Aunque no se use como filtro, lo mantenemos por si se necesita para otros cálculos.
RSI_PERIOD = 14
RSI_DIVERGENCE_LOOKBACK = 40

# Lógica de Trading
RISK_REWARD_RATIO = 1.7
# Este % se usará para calcular el SL a partir del pivote SML
STOP_LOSS_OFFSET_PERCENTAGE = 0.01 

# -- CONFIGURACIÓN DEL BACKTESTER --
INITIAL_CAPITAL = 10000
RISK_PER_TRADE_PERCENTAGE = 1

# -- RUTAS Y URLS --
WEBSOCKET_SPOT_URL = f"wss://stream.binance.com:9443/ws/{SYMBOL.lower().replace('/', '')}@trade"
DATA_DIR = "data"
STATUS_FILE = os.path.join(DATA_DIR, "status.json")
CHART_DATA_FILE = os.path.join(DATA_DIR, "chart_data.json")
STATE_FILE = os.path.join(DATA_DIR, "trade_state.json")

# -- CONFIGURACIÓN DE LA INTERFAZ --
REFRESH_INTERVAL = 5