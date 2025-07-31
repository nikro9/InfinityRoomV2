# test_logic.py
import os
import sys
import json
import pandas as pd
from dotenv import load_dotenv
import google.generativeai as genai
from groq import Groq
import ccxt
from datetime import datetime, timedelta
import pandas_ta as ta

# --- PASO 1: CONFIGURACIÓN Y PARÁMETROS ---
print("--- [PASO 1] Cargando configuración... ---")

# Parámetros clave (normalmente en src/config.py)
SYMBOL = 'BTC/USDT'
TIMEFRAME_OPERATIVA = '5m'
TIMEFRAME_SML = '200min'
EMA_FAST_PERIOD = 12
EMA_TREND_PERIOD = 200
RSI_PERIOD = 14
SML_ANCHOR_TIME = "13:20:00"

# --- PASO 2: FUNCIONES DE UTILIDAD (normalmente en otros archivos) ---
print("--- [PASO 2] Definiendo funciones de utilidad... ---")

def get_historical_data(symbol=SYMBOL, timeframe=TIMEFRAME_OPERATIVA, days=15):
    print(f"Obteniendo {days} días de datos históricos para {symbol}...")
    exchange = ccxt.binance()
    since = exchange.parse8601(str(datetime.utcnow() - timedelta(days=days)))
    all_ohlcv = []
    try:
        while True:
            ohlcv = exchange.fetch_ohlcv(symbol, timeframe, since, limit=1000)
            if not ohlcv: break
            since = ohlcv[-1][0] + 1
            all_ohlcv.extend(ohlcv)
            if len(ohlcv) < 1000: break
    except Exception as e:
        print(f"❌ Error al obtener datos históricos: {e}")
        return None
    return all_ohlcv

def calculate_ema(close_prices: pd.Series, period: int) -> pd.Series:
    return ta.ema(close_prices, length=period)

def calculate_rsi(close_prices: pd.Series, period: int) -> pd.Series:
    return ta.rsi(close_prices, length=period)

def calculate_sml_channel(df: pd.DataFrame) -> pd.DataFrame:
    df['sml_high'] = df['high']
    df['sml_low'] = df['low']
    return df

# --- PASO 3: LÓGICA DE LA IA (normalmente en src/ai_model.py) ---
print("--- [PASO 3] Configurando el cerebro de la IA... ---")

load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

genai.configure(api_key=GOOGLE_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')
groq_client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """
Actúa como un trader de scalping de élite para BTC/USDT (5min). Tu misión es gestionar un estado de trading (`IDLE`, `WATCHING_LONG`, `WATCHING_SHORT`, `IN_LONG`, `IN_SHORT`) y generar propuestas de trade basadas en una estrategia de reversión en el SML Channel.

**ESTADO ACTUAL:**
Te proporcionaré el estado actual del bot. Tu respuesta debe tener en cuenta este estado para decidir el siguiente.

**MANUAL DE OPERACIONES ESTRICTO:**

**Lógica para una operación LONG:**
1.  **Si el estado es `IDLE`:**
    -   **Condición:** El precio (`low`) toca o perfora el `sml_low`.
    -   **Acción:** Devuelve un nuevo estado `WATCHING_LONG`, almacenando el `low` como `rejection_level`.
    -   **Razonamiento:** "Precio tocó soporte SML. Vigilando confirmación."

2.  **Si el estado es `WATCHING_LONG`:**
    -   **Condición 1 (Confirmación de Pivote):** El `sml_low` actual es MÁS ALTO que el `sml_low` de la vela anterior.
    -   **Condición 2 (Divergencia):** Busca una divergencia alcista clara.
    -   **Condición 3 (Gatillo):** El precio (`close`) cierra por encima de la `ema_12`.
    -   **Acción:** Si se cumplen las 3 condiciones, genera una propuesta `LONG` y cambia el estado a `IN_LONG`.
    -   **Invalidación:** Si el precio rompe el `rejection_level`, vuelve a `IDLE`.

**Lógica para una operación SHORT:** (Análoga a la de LONG pero con `sml_high`)

**GESTIÓN DE TRADE ACTIVO:**
- **Si el estado es `IN_LONG` o `IN_SHORT`:** No busques nuevas entradas. Tu única tarea es vigilar si el precio toca el Stop Loss o el Take Profit de la operación activa. Si lo hace, vuelve al estado `IDLE` con el razonamiento "Trade [LONG/SHORT] cerrado en [SL/TP]". De lo contrario, mantén el estado.

**CÁLCULO DE PARÁMETROS DEL TRADE (FÓRMULA ESTRICTA):**
-   **Para un LONG:**
    1. `entry_price` = Precio de cierre de la vela de entrada.
    2. `stop_loss` = Precio del `sml_low` confirmado * (1 - 0.0001).
    3. `risk_per_unit` = `entry_price` - `stop_loss`.
    4. `take_profit` = `entry_price` + (`risk_per_unit` * 1.7).
-   **Para un SHORT:**
    1. `entry_price` = Precio de cierre de la vela de entrada.
    2. `stop_loss` = Precio del `sml_high` confirmado * (1 + 0.0001).
    3. `risk_per_unit` = `stop_loss` - `entry_price`.
    4. `take_profit` = `entry_price` - (`risk_per_unit` * 1.7).

**FORMATO DE RESPUESTA OBLIGATORIO (solo JSON):**
Tu respuesta debe ser un único objeto JSON que contenga el nuevo estado completo del bot.
```json
{
  "new_state": {
    "status": "IDLE" | "WATCHING_LONG" | "WATCHING_SHORT" | "IN_LONG" | "IN_SHORT",
    "reasoning": "Explicación detallada y precisa.",
    "rejection_level": null | float,
    "active_trade": null | { "type": "BUY" | "SELL", "entry_price": float, "stop_loss": float, "take_profit": float }
  },
  "trade_proposal": null | { "type": "BUY" | "SELL", "entry_price": float, "stop_loss": float, "take_profit": float }
}
