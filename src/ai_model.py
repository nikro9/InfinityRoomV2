# archivo src/ai_model.py
import os
import pandas as pd
import json
from dotenv import load_dotenv
import google.generativeai as genai
from groq import Groq

# --- CONFIGURACIÓN DE LAS APIS ---
load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')
groq_client = Groq(api_key=GROQ_API_KEY)

# --- PROMPT v3: LÓGICA DE ESTADO PERSISTENTE Y CÁLCULOS EXPLÍCITOS ---
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
```
Analiza el estado actual y los datos de mercado, y devuelve el JSON con el `new_state` y la `trade_proposal` si corresponde.
"""

def format_data_for_prompt(df: pd.DataFrame, current_state: dict, order_flow: dict) -> str:
    recent_df = df.tail(15)
    order_flow_str = f"Delta: {order_flow['delta']:.2f}"
    data_string = (
        f"Estado Actual del Bot: {json.dumps(current_state)}\n"
        f"Análisis de Flujo de Órdenes (últimos 5 min): {order_flow_str}\n\n"
        f"Datos de las últimas 15 velas (formato ISO UTC):\n"
    )
    cols_to_show = {'open': 'O', 'high': 'H', 'low': 'L', 'close': 'C', 'rsi_14': 'RSI', 'ema_12': 'EMA12', 'sml_high': 'SML_H', 'sml_low': 'SML_L'}
    existing_cols = {k: v for k, v in cols_to_show.items() if k in recent_df.columns}
    recent_df.index = recent_df.index.strftime('%Y-%m-%d %H:%M:%S')
    data_string += recent_df[existing_cols.keys()].rename(columns=existing_cols).to_string(float_format="%.2f")
    return data_string

def _call_gemini(full_prompt: str):
    print("🧠 Consultando a Gemini...")
    request_options = {"timeout": 60}
    response = gemini_model.generate_content(full_prompt, request_options=request_options)
    return response.text

def _call_groq(full_prompt: str):
    print("⚡️ Consultando a Groq (Llama 3)...")
    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": full_prompt}],
        model="llama3-8b-8192",
    )
    return chat_completion.choices[0].message.content

def get_ai_signal(df: pd.DataFrame, current_state: dict, order_flow: dict):
    market_data_str = format_data_for_prompt(df, current_state, order_flow)
    full_prompt = SYSTEM_PROMPT + "\n\n" + market_data_str
    
    analysts = [{"name": "Gemini", "function": _call_gemini}, {"name": "Groq", "function": _call_groq}]
    raw_response = ""
    for analyst in analysts:
        try:
            raw_response = analyst["function"](full_prompt)
            if raw_response:
                print(f"🤖 Respuesta recibida de {analyst['name']}.")
                break
        except Exception as e:
            print(f"⚠️ Error al consultar a {analyst['name']}: {e}. Intentando con el siguiente analista.")
            continue

    if not raw_response:
        return current_state, None, raw_response

    try:
        json_start = raw_response.find('{')
        json_end = raw_response.rfind('}') + 1
        if json_start != -1 and json_end != -1:
            json_str = raw_response[json_start:json_end]
            ai_decision = json.loads(json_str)
            
            new_state = ai_decision.get("new_state", current_state)
            proposal = ai_decision.get("trade_proposal")
            
            return new_state, proposal, raw_response
        else:
            raise ValueError("No se encontró un objeto JSON en la respuesta.")
    except Exception as e:
        print(f"❌ Error al procesar la respuesta de la IA: {e}")
        return current_state, None, raw_response
