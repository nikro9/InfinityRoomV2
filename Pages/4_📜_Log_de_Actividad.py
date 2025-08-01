# pages/3_📜_Log_de_Actividad.py
import streamlit as st
import redis
import json
import pandas as pd

# --- CONFIGURACIÓN DE LA PÁGINA ---
st.set_page_config(layout="wide", page_title="Infinity Room - Log")
st.title("📜 Log de Actividad y Trades")
st.markdown("Historial de las decisiones de la IA y las propuestas de trade generadas.")

# --- CONEXIÓN A REDIS ---
try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.ping()
except redis.exceptions.ConnectionError as e:
    st.error(f"Error de conexión con Redis: {e}")
    st.stop()

# --- SECCIÓN DE ÚLTIMOS TRADES ---
st.subheader("Últimas Propuestas de Trade")
trade_logs_json = r.lrange("infinity_room:trades", 0, -1) # Obtener todos los trades guardados

if not trade_logs_json:
    st.info("Aún no se han generado propuestas de trade.")
else:
    try:
        trades_list = [json.loads(item) for item in trade_logs_json]
        trades_df = pd.DataFrame(trades_list)
        # Reordenar columnas para mayor claridad
        if not trades_df.empty:
            cols_order = ['timestamp', 'type', 'entry_price', 'stop_loss', 'take_profit']
            existing_cols = [col for col in cols_order if col in trades_df.columns]
            st.dataframe(trades_df[existing_cols], use_container_width=True)
    except Exception as e:
        st.error(f"Error al procesar los datos de trades: {e}")

st.markdown("---")

# --- SECCIÓN DE LOG DE RAZONAMIENTO ---
st.subheader("Log de Razonamiento de la IA")
ai_logs = r.lrange("infinity_room:log", 0, -1) # Obtener todos los logs guardados

if not ai_logs:
    st.info("Aún no hay registros en el log de la IA.")
else:
    # Creamos un contenedor con scroll para los logs
    with st.container(height=500):
        # Mostramos los logs en orden cronológico (el más reciente arriba)
        for log_entry in ai_logs:
            st.text(log_entry)