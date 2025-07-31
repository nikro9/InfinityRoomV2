# src/ai_model.py
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

# Configuración de Google Gemini
genai.configure(api_key=GOOGLE_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# Configuración de Groq
groq_client = Groq(api_key=GROQ_API_KEY)

# ==============================================================================
# --- AGENTE 1: ANALISTA TÉCNICO DE SCALPING ---
# ==============================================================================
TECHNICAL_ANALYST_PROMPT = """
Actúa como un trader de scalping de élite para BTC/USDT (5min). Tu misión es gestionar un estado de trading (`IDLE`, `WATCHING_LONG`, `WATCHING_SHORT`, `IN_LONG`, `IN_SHORT`) y generar propuestas de trade basadas en una estrategia de reversión en el SML Channel.

**ESTADO ACTUAL:**
Te proporcionaré el estado actual del bot. Tu respuesta debe tener en cuenta este estado.

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
    -   **Acción:** Si se cumplen las 3 condiciones, genera una propuesta `LONG` y cambia el estado a `PROPOSAL_PENDING_APPROVAL`.
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
-   **Para un SHORT:** (Análoga)

**FORMATO DE RESPUESTA OBLIGATORIO (solo JSON):**
```json
{
  "new_state": {
    "status": "IDLE" | "WATCHING_LONG" | "WATCHING_SHORT" | "PROPOSAL_PENDING_APPROVAL" | "IN_LONG" | "IN_SHORT",
    "reasoning": "Explicación detallada y precisa.",
    "rejection_level": null | float,
    "active_trade": null | { "type": "BUY" | "SELL", "entry_price": float, "stop_loss": float, "take_profit": float }
  },
  "trade_proposal": null | { "type": "BUY" | "SELL", "entry_price": float, "stop_loss": float, "take_profit": float }
}
```
Analiza el estado actual y los datos de mercado, y devuelve el JSON.
"""

# ==============================================================================
# --- AGENTE 2: GESTOR DE RIESGOS ---
# ==============================================================================
RISK_MANAGER_PROMPT = """
Actúa como un Gestor de Riesgos extremadamente conservador de un fondo de cobertura. Tu única función es aprobar o rechazar propuestas de trade generadas por otro analista. Eres escéptico por naturaleza.

**TU PROCESO DE DECISIÓN:**
1.  **Analiza la Propuesta:** Revisa los parámetros del trade (entrada, SL, TP).
2.  **Analiza el Contexto:** Revisa los datos de Flujo de Órdenes. Un `delta` de volumen que contradiga la dirección del trade es una señal de alerta máxima.
3.  **Evalúa el Razonamiento:** Comprueba si el razonamiento del analista es sólido.
4.  **Toma una Decisión:** Responde **únicamente** con un objeto JSON.

**FORMATO DE RESPUESTA OBLIGATORIO (solo JSON):**
```json
{
  "decision": "APPROVE" | "REJECT",
  "reasoning": "Tu justificación concisa y profesional para la decisión."
}
```
Aquí está la propuesta y el contexto. Proporciona tu veredicto.
"""

# --- FUNCIONES DE COMUNICACIÓN CON LAS APIs ---
def _call_llm(full_prompt: str):
    """Intenta llamar a Gemini, y si falla, llama a Groq."""
    analysts = [
        {"name": "Gemini", "function": lambda p: gemini_model.generate_content(p, request_options={"timeout": 60}).text},
        {"name": "Groq", "function": lambda p: groq_client.chat.completions.create(messages=[{"role": "user", "content": p}], model="llama3-8b-8192").choices[0].message.content}
    ]
    
    raw_response = ""
    for analyst in analysts:
        try:
            print(f"🧠 Consultando a {analyst['name']}...")
            raw_response = analyst["function"](full_prompt)
            if raw_response:
                print(f"🤖 Respuesta recibida de {analyst['name']}.")
                return raw_response, analyst['name']
        except Exception as e:
            print(f"⚠️ Error al consultar a {analyst['name']}: {e}. Intentando con el siguiente analista.")
            continue
    
    raise Exception("Todos los proveedores de IA fallaron.")

def _extract_json(raw_response: str):
    """Extrae el primer bloque JSON válido de una respuesta de texto."""
    json_start = raw_response.find('{')
    json_end = raw_response.rfind('}') + 1
    if json_start != -1 and json_end != -1:
        json_str = raw_response[json_start:json_end]
        return json.loads(json_str)
    raise ValueError("No se encontró un objeto JSON en la respuesta.")

# --- INTERFACES PARA EL WORKER ---
def get_technical_analysis(df: pd.DataFrame, current_state: dict, order_flow: dict):
    """Función para el Analista Técnico."""
    recent_df = df.tail(15)
    order_flow_str = f"Delta: {order_flow['delta']:.2f}"
    data_string = f"Estado Actual del Bot: {json.dumps(current_state)}\nAnálisis de Flujo de Órdenes (últimos 5 min): {order_flow_str}\n\nDatos de las últimas 15 velas (formato ISO UTC):\n"
    cols_to_show = {'open': 'O', 'high': 'H', 'low': 'L', 'close': 'C', 'rsi_14': 'RSI', 'ema_12': 'EMA12', 'sml_high': 'SML_H', 'sml_low': 'SML_L'}
    existing_cols = {k: v for k, v in cols_to_show.items() if k in recent_df.columns}
    recent_df.index = recent_df.index.strftime('%Y-%m-%d %H:%M:%S')
    data_string += recent_df[existing_cols.keys()].rename(columns=existing_cols).to_string(float_format="%.2f")
    
    full_prompt = TECHNICAL_ANALYST_PROMPT + "\n\n" + data_string
    
    try:
        raw_response, source_ia = _call_llm(full_prompt)
        ai_decision = _extract_json(raw_response)
        new_state = ai_decision.get("new_state", current_state)
        proposal = ai_decision.get("trade_proposal")
        return new_state, proposal, f"**[Analista Técnico ({source_ia})]:**\n\n{raw_response}"
    except Exception as e:
        print(f"❌ Error al procesar la respuesta del Analista Técnico: {e}")
        return current_state, None, f"**[Analista Técnico]:**\n\nError al procesar la respuesta: {e}"

def get_risk_analysis(proposal: dict, order_flow: dict):
    """Función para el Gestor de Riesgos."""
    prompt_data = f"Propuesta a evaluar: {json.dumps(proposal)}\n\nContexto de Flujo de Órdenes: {json.dumps(order_flow)}"
    full_prompt = RISK_MANAGER_PROMPT + "\n\n" + prompt_data
    
    try:
        raw_response, source_ia = _call_llm(full_prompt)
        ai_decision = _extract_json(raw_response)
        return ai_decision, f"**[Gestor de Riesgos ({source_ia})]:**\n\n{raw_response}"
    except Exception as e:
        print(f"❌ Error al procesar la respuesta del Gestor de Riesgos: {e}")
        return {"decision": "REJECT", "reasoning": "Error de comunicación con el Gestor de Riesgos."}, f"**[Gestor de Riesgos]:**\n\nError al procesar la respuesta: {e}"
