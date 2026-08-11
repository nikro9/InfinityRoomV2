# src/ai_model.py
import os
import pandas as pd
import json
from dotenv import load_dotenv
from groq import Groq

# --- CONFIGURACIÓN DE LA API ---
load_dotenv()

# Cargar multiples llaves desde variables de entorno (GROQ_API_KEY_1, GROQ_API_KEY_2, etc.)
GROQ_API_KEYS = []
for i in range(1, 20):
    key = os.getenv(f'GROQ_API_KEY_{i}')
    if key and key not in GROQ_API_KEYS:
        GROQ_API_KEYS.append(key)

# Añadir la llave original por si acaso
original_key = os.getenv('GROQ_API_KEY')
if original_key and original_key not in GROQ_API_KEYS:
    GROQ_API_KEYS.append(original_key)

import itertools

# Create an iterator for Round-Robin API key selection
key_iterator = itertools.cycle(GROQ_API_KEYS) if GROQ_API_KEYS else None

def get_groq_client():
    """Devuelve un cliente de Groq instanciado con una API key usando Round-Robin."""
    if not GROQ_API_KEYS:
        raise ValueError("No Groq API keys found in environment variables.")
    return Groq(api_key=next(key_iterator))

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
Actúa como "Analista de Setups". Eres un experto en la estrategia "PUPU 5m - ZCoinTV Style". Tu única misión es identificar setups de entrada de REVERSIÓN de tendencia de alta probabilidad. NO buscas seguir la tendencia, buscas el giro.

**TU ESTRATEGIA (PUPU 5m) - REGLAS ESTRICTAS:**
-   **Setup LONG (Reversión Alcista):**
    1. El precio debe haber tocado o caído por debajo del `donchian_low` (que representa el mínimo de 400 periodos) en las últimas 20-30 velas.
    2. **CRÍTICO:** Debe existir una **divergencia alcista** clara entre el Precio y el RSI (el precio hizo un mínimo más bajo o igual, pero el RSI hizo un mínimo más alto).
    3. La señal de entrada se activa SÓLO cuando la vela actual o reciente **rompe y cierra POR ENCIMA de la `ema_12`**.
-   **Setup SHORT (Reversión Bajista):**
    1. El precio debe haber tocado o superado el `donchian_high` (que representa el máximo de 400 periodos) en las últimas 20-30 velas.
    2. **CRÍTICO:** Debe existir una **divergencia bajista** clara entre el Precio y el RSI (el precio hizo un máximo más alto o igual, pero el RSI hizo un máximo más bajo).
    3. La señal de entrada se activa SÓLO cuando la vela actual o reciente **rompe y cierra POR DEBAJO de la `ema_12`**.

**FORMATO DE RESPUESTA OBLIGATORIO (solo JSON):**
```json
{
  "signal": "POTENTIAL_LONG" | "POTENTIAL_SHORT" | "IDLE",
  "reasoning": "Explica concisamente: 1. Toque de Donchian. 2. Divergencia Precio/RSI detectada. 3. Ruptura de la EMA.",
  "trigger_price": null | float
}
```
Si se cumplen los 3 parámetros, devuelve la señal potencial y el precio actual de la `ema_12` como `trigger_price`. Si falta ALGUN parámetro (especialmente la divergencia o el cierre de EMA), devuelve "IDLE".
"""

# --- ROL 3: ANALISTA TÉCNICO 2 (CONFIRMADOR DE MOMENTUM - Gemma) ---
MOMENTUM_ANALYST_PROMPT = """
Actúa como "Analista de Confirmación". Eres un especialista en momentum para reversiones. Tu tarea es confirmar si la vela que rompe la EMA tiene fuerza genuina.

**TU ANÁLISIS:**
-   **Confirmación LONG:** La vela que rompe la `ema_12` hacia arriba debe tener un cuerpo sólido (cierre cerca de máximos) demostrando absorción de la liquidez bajista.
-   **Confirmación SHORT:** La vela que rompe la `ema_12` hacia abajo debe tener un cuerpo sólido (cierre cerca de mínimos) demostrando absorción de la liquidez alcista.

**FORMATO DE RESPUESTA OBLIGATORIO (solo JSON):**
```json
{
  "confirmation": "CONFIRMED" | "REJECTED",
  "reasoning": "Tu análisis conciso sobre el momentum de la vela actual y su cuerpo/mechas."
}
```
Analiza la última vela en relación a la EMA y devuelve tu confirmación.
"""

# --- ROL 4: GESTOR DE RIESGO (Llama3) ---
RISK_MANAGER_PROMPT = """
Actúa como "Gestor de Riesgo". Eres el filtro final y puramente cuantitativo.

**TU ANÁLISIS:**
1.  **Recibes una propuesta de trade y el consenso.**
2.  **Calcula los Parámetros:** Usa el ATR proporcionado en la propuesta para el Stop Loss.
3.  **Verifica el Ratio:** Asegúrate de que el ratio riesgo/beneficio sea mínimo 1:1.7 (Ideal 1:2 o 1:3 para estos setups).
4.  **Decisión Final:** Responde **únicamente** con un objeto JSON.

**FÓRMULAS DE CÁLCULO:**
-   **LONG:** `stop_loss` = `pivot_touch_price` - `atr_value`. `risk` = `entry_price` - `stop_loss`. `take_profit` = `entry_price` + (`risk` * 2).
-   **SHORT:** `stop_loss` = `pivot_touch_price` + `atr_value`. `risk` = `stop_loss` - `entry_price`. `take_profit` = `entry_price` - (`risk` * 2).

**IMPORTANTE:** En tu respuesta JSON, los valores deben ser NÚMEROS FLOTANTES FINALES (ej: `64047.08`), NUNCA fórmulas.

**FORMATO DE RESPUESTA OBLIGATORIO (solo JSON):**
```json
{
  "decision": "APPROVE" | "REJECT",
  "reasoning": "Justificación de tu cálculo de riesgo.",
  "trade_proposal": null | { "type": "BUY" | "SELL", "entry_price": float, "stop_loss": float, "take_profit": float }
}
```
Calcula los parámetros y proporciona tu veredicto final.
"""

# --- FUNCIONES DE COMUNICACIÓN Y ORQUESTACIÓN ---

def _call_groq(prompt: str, model: str, source_analyst: str):
    """Función unificada para llamar a la API de Groq con un modelo específico."""
    print(f"[!] Consultando a {source_analyst} (usando {model})...")
    client = get_groq_client()
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=model,
        temperature=0.1,
        response_format={"type": "json_object"},
        timeout=15.0
    )
    response_text = chat_completion.choices[0].message.content
    print(f"[OK] Respuesta recibida de {source_analyst}.")
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
    
    # Modelos distribuidos para evitar quemar el límite TPM del modelo 70b
    try:
        full_analysis['liquidity'] = _call_groq(f"{LIQUIDITY_ANALYST_PROMPT}\n\n{order_flow_str}", "llama3-8b-8192", "Analista de Liquidez")
    except Exception as e:
        full_analysis['liquidity'] = {"sentiment": "NEUTRAL", "reasoning": f"Error: {e}"}

    try:
        full_analysis['entry_setup'] = _call_groq(f"{ENTRY_ANALYST_PROMPT}\n\n{data_string_full}", "llama-3.3-70b-versatile", "Analista de Setups")
    except Exception as e:
        full_analysis['entry_setup'] = {"signal": "IDLE", "reasoning": f"Error: {e}"}

    try:
        full_analysis['momentum'] = _call_groq(f"{MOMENTUM_ANALYST_PROMPT}\n\n{data_string_simple}", "gemma2-9b-it", "Analista de Momentum")
    except Exception as e:
        full_analysis['momentum'] = {"confirmation": "REJECTED", "reasoning": f"Error: {e}"}

    proposal_to_risk_manager = None
    consensus_reasoning = "No se alcanzó consenso entre los analistas."
    
    setup_signal = full_analysis['entry_setup'].get('signal')
    momentum_confirmation = full_analysis['momentum'].get('confirmation')
    liquidity_sentiment = full_analysis['liquidity'].get('sentiment')

    if setup_signal == 'POTENTIAL_LONG' and momentum_confirmation == 'CONFIRMED' and liquidity_sentiment in ['BULLISH', 'NEUTRAL']:
        print("[+] Consenso preliminar para LONG.")
        consensus_reasoning = f"Setup: {full_analysis['entry_setup'].get('reasoning')}. Momentum: {full_analysis['momentum'].get('reasoning')}. Liquidez: {full_analysis['liquidity'].get('reasoning')}."
        proposal_to_risk_manager = {"type": "LONG", "entry_price": df.iloc[-1]['close'], "pivot_touch_price": df.iloc[-1]['donchian_low'], "atr_value": df.iloc[-1]['atr_14']}
    elif setup_signal == 'POTENTIAL_SHORT' and momentum_confirmation == 'CONFIRMED' and liquidity_sentiment in ['BEARISH', 'NEUTRAL']:
        print("[+] Consenso preliminar para SHORT.")
        consensus_reasoning = f"Setup: {full_analysis['entry_setup'].get('reasoning')}. Momentum: {full_analysis['momentum'].get('reasoning')}. Liquidez: {full_analysis['liquidity'].get('reasoning')}."
        proposal_to_risk_manager = {"type": "SHORT", "entry_price": df.iloc[-1]['close'], "pivot_touch_price": df.iloc[-1]['donchian_high'], "atr_value": df.iloc[-1]['atr_14']}

    if proposal_to_risk_manager:
        try:
            risk_decision = _call_groq(f"{RISK_MANAGER_PROMPT}\n\nPropuesta: {json.dumps(proposal_to_risk_manager)}\n\nConsenso de Analistas: {json.dumps(full_analysis)}", "llama3-8b-8192", "Gestor de Riesgo")
            if risk_decision.get("decision") == "APPROVE":
                print("[OK] Trade APROBADO por el Gestor de Riesgo!")
                return risk_decision.get("trade_proposal"), risk_decision.get("reasoning"), full_analysis
            else:
                print(f"[-] Trade RECHAZADO por el Gestor de Riesgo. Razón: {risk_decision.get('reasoning')}")
                return None, risk_decision.get("reasoning"), full_analysis
        except Exception as e:
            print(f"[X] Error con el Gestor de Riesgo: {e}")
            return None, f"Error en la gestión de riesgo: {e}", full_analysis
            
    return None, consensus_reasoning, full_analysis
