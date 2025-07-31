# archivo pages/4_💬_Chat_con_IA.py
import streamlit as st
import redis
import time
import json
import sys
import os

# --- IMPORTACIONES ---
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from src import config

# --- FUNCIÓN AUXILIAR PARA FORMATEAR LA RESPUESTA ---
def format_chat_entry(raw_text: str):
    """
    Formatea la respuesta completa de la IA para una visualización clara en el chat,
    mostrando tanto el texto conversacional como el JSON.
    """
    try:
        json_start = raw_text.find('{')
        json_end = raw_text.rfind('}') + 1
        
        # Extraemos las tres partes: texto antes, el JSON, y texto después
        text_before = raw_text[:json_start].strip()
        json_part_str = raw_text[json_start:json_end]
        text_after = raw_text[json_end:].strip()
        
        # Mostramos el texto conversacional si existe
        if text_before:
            st.markdown(text_before)
        
        # Mostramos el JSON de forma interactiva y legible
        st.json(json.loads(json_part_str))
        
        # Mostramos el texto de conclusión si existe
        if text_after:
            st.markdown(text_after)

    except Exception:
        # Si algo falla (ej. la IA no devolvió un JSON), muestra la respuesta cruda
        st.text(raw_text)

# --- CONFIGURACIÓN DE PÁGINA Y CONEXIÓN A REDIS ---
st.set_page_config(layout="wide", page_title="Infinity Room - Chat")
st.title("💬 Chat con los Analistas de IA")
st.markdown("Revisa el razonamiento conversacional y los datos estructurados devueltos por la IA.")

try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.ping()
except redis.exceptions.ConnectionError as e:
    st.error(f"Error de conexión con Redis: {e}")
    st.stop()

# --- BUCLE DE ACTUALIZACIÓN ---
placeholder = st.empty()
while True:
    with placeholder.container():
        chat_logs = r.lrange("infinity_room:chat_log", 0, -1)
        if not chat_logs:
            st.info("Esperando el primer análisis del worker para iniciar el chat...")
        else:
            for i, entry in enumerate(chat_logs):
                parts = entry.split("\n\n", 1)
                timestamp_header = parts[0]
                raw_response = parts[1] if len(parts) > 1 else ""

                with st.chat_message("assistant", avatar="🤖"):
                    st.markdown(f"{timestamp_header}")
                    # Usamos la nueva función para formatear la salida
                    format_chat_entry(raw_response)
                
                if i < len(chat_logs) - 1:
                    st.markdown("---")

    time.sleep(config.REFRESH_INTERVAL)
