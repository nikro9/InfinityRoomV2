# src/config.py
import os

# --- PARÁMETROS GENERALES COMPARTIDOS POR TODAS LAS ESTRATEGIAS ---
EMA_FAST_PERIOD = 12
EMA_TREND_PERIOD = 200
RSI_PERIOD = 14
RSI_DIVERGENCE_LOOKBACK = 40
RISK_REWARD_RATIO = 1.7
STOP_LOSS_OFFSET_PERCENTAGE = 0.01

# --- CONFIGURACIÓN DE LA INTERFAZ ---
REFRESH_INTERVAL = 5

# --- ESTRUCTURA DE ESTRATEGIAS INDIVIDUALES ---
STRATEGIES = {
    "BITCOIN_PIVOTS": {
        "enabled": True,
        "symbol": "BTC/USDT",
        "timeframe_operativa": "5m",
        "sml_timeframe": "200min",
        "sml_anchor_time": "13:20:00",
        "redis_prefix": "infinity_room:btc_pivots"
    },
    "ALTCOIN_PIVOTS": {
        "enabled": True,
        # --- LISTA DE ACTIVOS ACTUALIZADA ---
        "asset_list": [
            "ETH/USDT", 
            "XRP/USDT", 
            "BNB/USDT", 
            "SOL/USDT", 
            "DOGE/USDT", 
            "TRX/USDT", 
            "ADA/USDT", 
            "LTC/USDT", 
            "BCH/USDT", 
            "LINK/USDT"
        ],
        "timeframe_operativa": "5m",
        "sml_timeframe": "400min",
        "sml_anchor_time": "13:20:00",
        "redis_prefix": "infinity_room:alt_pivots" # Prefijo base
    }
}