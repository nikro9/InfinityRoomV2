# src/ai_model.py
import os
import pandas as pd
import json
from dotenv import load_dotenv
from groq import Groq

# --- CONFIGURACIÓN DE LA API ---
load_dotenv()
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# Configuración del cliente de Groq
groq_client = Groq(api_key=GROQ_API_KEY)

# ==============================================================================
# --- DEFINICIÓN DE ROLES Y PROMPTS PARA EL CONSEJO DE IAS ---
# ==============================================================================

# --- ROL 1: ANALISTA DE ORDER FLOW Y LIQUIDEZ (Mixtral) ---
LIQUIDITY_ANALYST_PROMPT = """
Actúa como "Analista de Liquidez". Tu única especialidad es el análisis de Flujo de Órdenes (Order Flow). Ignoras los patrones de gráfico y te enfocas en el volumen institucional y la presión de compra/venta.

**TU ANÁLISIS:**
1.  **Evalúa el Delta de Volumen:** El `delta` es la diferencia neta entre el volumen de compra y venta. Un delta fuertemente positivo indica agresión compradora. Uno fuertemente negativo indica agresión vendedora.
2.  **Evalúa la Actividad:** El `trade_count` indica el nivel de actividad. Un delta alto con un bajo número de trades sugiere la presencia de "ballenas" o actores institucionales.

**FORMATO DE RESPUESTA OBLIGATORIO (solo JSON):**
```json
{
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "reasoning": "Tu análisis conciso del order flow en 1-2 frases.",
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
```
Analiza los datos de Order Flow y devuelve tu veredicto.
"""

# --- ROL 2: ANALISTA TÉCNICO 1 (EXPERTO EN ENTRADAS - Llama3 70b) ---
ENTRY_ANALYST_PROMPT = """
Actúa como "Analista de Setups". Eres un experto en la estrategia de scalping de reversión SML. Tu única misión es identificar setups de entrada de alta probabilidad.

**TU ESTRATEGIA (REVERSIÓN SML):**
-   **Setup LONG:** El precio (`low`) toca `sml_low` Y se forma una divergencia alcista en el RSI.
-   **Setup SHORT:** El precio (`high`) toca `sml_high` Y se forma una divergencia bajista en el RSI.

**FORMATO DE RESPUESTA OBLIGATORIO (solo JSON):**
```json
{
  "signal": "POTENTIAL_LONG" | "POTENTIAL_SHORT" | "IDLE",
  "reasoning": "Tu análisis conciso del setup técnico.",
  "trigger_price": null | float
}
```
Si identificas un setup, devuelve la señal potencial y el precio de la `ema_12` como `trigger_price`. Si no, devuelve "IDLE".
"""

# --- ROL 3: ANALISTA TÉCNICO 2 (CONFIRMADOR DE MOMENTUM - Gemma) ---
MOMENTUM_ANALYST_PROMPT = """
Actúa como "Analista de Confirmación". Eres un especialista en momentum. Tu única tarea es confirmar si la vela actual tiene la fuerza necesaria para validar un setup.

**TU ANÁLISIS:**
-   **Confirmación LONG:** La vela actual debe cerrar **decididamente por encima** de la `ema_12`.
-   **Confirmación SHORT:** La vela actual debe cerrar **decididamente por debajo** de la `ema_12`.

**FORMATO DE RESPUESTA OBLIGATORIO (solo JSON):**
```json
{
  "confirmation": "CONFIRMED" | "REJECTED",
  "reasoning": "Tu análisis conciso sobre el momentum de la vela actual."
}
```
Analiza la última vela en relación a la EMA y devuelve tu confirmación.
"""

# --- ROL 4: GESTOR DE RIESGO (Llama3 8b) ---
RISK_MANAGER_PROMPT = """
Actúa como "Gestor de Riesgo". Eres el filtro final y tu palabra es ley. Eres puramente cuantitativo y basado en reglas.

**TU ANÁLISIS:**
1.  **Recibes una propuesta de trade final y el consenso de los analistas.**
2.  **Calcula los Parámetros:** Usando las fórmulas estrictas, calcula el SL y TP.
3.  **Verifica el Ratio:** Asegúrate de que el ratio riesgo/beneficio sea 1:1.7.
4.  **Toma la Decisión Final:** Responde **únicamente** con un objeto JSON.

**FÓRMULAS DE CÁLCULO:**
-   **Para un LONG:** `stop_loss` = `sml_low_touch` * (1 - 0.0001). `risk` = `entry_price` - `stop_loss`. `take_profit` = `entry_price` + (`risk` * 1.7).
-   **Para un SHORT:** `stop_loss` = `sml_high_touch` * (1 + 0.0001). `risk` = `stop_loss` - `entry_price`. `take_profit` = `entry_price` - (`risk` * 1.7).

**FORMATO DE RESPUESTA OBLIGATORIO (solo JSON):**
```json
{
  "decision": "APPROVE" | "REJECT",
  "reasoning": "Tu justificación final (ej. 'Parámetros correctos, riesgo aceptado').",
  "trade_proposal": null | { "type": "BUY" | "SELL", "entry_price": float, "stop_loss": float, "take_profit": float }
}
```
Calcula los parámetros y proporciona tu veredicto final.
"""

# --- FUNCIONES DE COMUNICACIÓN Y ORQUESTACIÓN ---

def _call_groq(prompt: str, model: str, source_analyst: str):
    """Función unificada para llamar a la API de Groq con un modelo específico."""
    print(f"⚡️ Consultando a {source_analyst} (usando {model})...")
    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=model,
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    response_text = chat_completion.choices[0].message.content
    print(f"🤖 Respuesta recibida de {source_analyst}.")
    return json.loads(response_text)

def get_infinity_room_decision(df: pd.DataFrame, order_flow: dict):
    """
    Orquesta el debate entre los 4 agentes de IA y devuelve la decisión final.
    """
    recent_df = df.tail(40)
    data_string_full = f"Datos de las últimas 40 velas:\n{recent_df.to_string(float_format='%.2f')}"
    data_string_simple = f"Datos de la última vela:\n{recent_df.tail(1).to_string(float_format='%.2f')}"
    order_flow_str = f"Flujo de Órdenes (últimos 5 min): {json.dumps(order_flow)}"

    full_analysis = {}
    
    try:
        full_analysis['liquidity'] = _call_groq(f"{LIQUIDITY_ANALYST_PROMPT}\n\n{order_flow_str}", "llama3-70b-8192", "Analista de Liquidez")
    except Exception as e:
        full_analysis['liquidity'] = {"sentiment": "NEUTRAL", "reasoning": f"Error: {e}"}

    try:
        full_analysis['entry_setup'] = _call_groq(f"{ENTRY_ANALYST_PROMPT}\n\n{data_string_full}", "llama3-70b-8192", "Analista de Setups")
    except Exception as e:
        full_analysis['entry_setup'] = {"signal": "IDLE", "reasoning": f"Error: {e}"}

    try:
        full_analysis['momentum'] = _call_groq(f"{MOMENTUM_ANALYST_PROMPT}\n\n{data_string_simple}", "llama3-8b-8192", "Analista de Momentum")
    except Exception as e:
        full_analysis['momentum'] = {"confirmation": "REJECTED", "reasoning": f"Error: {e}"}

    proposal_to_risk_manager = None
    consensus_reasoning = "No se alcanzó consenso entre los analistas."
    
    setup_signal = full_analysis['entry_setup'].get('signal')
    momentum_confirmation = full_analysis['momentum'].get('confirmation')
    liquidity_sentiment = full_analysis['liquidity'].get('sentiment')

    if setup_signal == 'POTENTIAL_LONG' and momentum_confirmation == 'CONFIRMED' and liquidity_sentiment in ['BULLISH', 'NEUTRAL']:
        print("✅ Consenso preliminar para LONG.")
        consensus_reasoning = f"Setup: {full_analysis['entry_setup'].get('reasoning')}. Momentum: {full_analysis['momentum'].get('reasoning')}. Liquidez: {full_analysis['liquidity'].get('reasoning')}."
        proposal_to_risk_manager = {"type": "LONG", "entry_price": df.iloc[-1]['close'], "sml_low_touch": df.iloc[-1]['sml_low']}
    elif setup_signal == 'POTENTIAL_SHORT' and momentum_confirmation == 'CONFIRMED' and liquidity_sentiment in ['BEARISH', 'NEUTRAL']:
        print("✅ Consenso preliminar para SHORT.")
        consensus_reasoning = f"Setup: {full_analysis['entry_setup'].get('reasoning')}. Momentum: {full_analysis['momentum'].get('reasoning')}. Liquidez: {full_analysis['liquidity'].get('reasoning')}."
        proposal_to_risk_manager = {"type": "SHORT", "entry_price": df.iloc[-1]['close'], "sml_high_touch": df.iloc[-1]['sml_high']}

    if proposal_to_risk_manager:
        try:
            risk_decision = _call_groq(f"{RISK_MANAGER_PROMPT}\n\nPropuesta: {json.dumps(proposal_to_risk_manager)}\n\nConsenso de Analistas: {json.dumps(full_analysis)}", "llama3-8b-8192", "Gestor de Riesgo")
            if risk_decision.get("decision") == "APPROVE":
                print("🛡️ ¡Trade APROBADO por el Gestor de Riesgo!")
                return risk_decision.get("trade_proposal"), risk_decision.get("reasoning"), full_analysis
            else:
                print(f"🛡️ Trade RECHAZADO por el Gestor de Riesgo. Razón: {risk_decision.get('reasoning')}")
                return None, risk_decision.get("reasoning"), full_analysis
        except Exception as e:
            print(f"❌ Error con el Gestor de Riesgo: {e}")
            return None, f"Error en la gestión de riesgo: {e}", full_analysis
            
    return None, consensus_reasoning, full_analysis
