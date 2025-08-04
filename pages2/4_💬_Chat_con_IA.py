# pages/4_💬_Chat_con_IA.py
import streamlit as st
import redis
import time
import json
import sys
import os
import re

# --- IMPORTACIONES ---
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src import config

# --- FUNCIÓN AUXILIAR PARA OBTENER CANALES DE CHAT ---
def get_available_chat_channels(redis_client: redis.Redis) -> dict:
    """
    Busca en Redis todas las claves de log de chat disponibles y crea un
    diccionario con nombres amigables para mostrar en la UI.
    """
    chat_keys = redis_client.keys("*:chat_log")
    channels = {}
    for key in chat_keys:
        # Extraemos el prefijo base (ej: 'infinity:btc' o 'infinity:alts:ETHUSDT')
        prefix = key.replace(':chat_log', '')
        # Creamos un nombre amigable para el selector
        parts = prefix.split(':')
        if len(parts) > 2 and parts[1] == 'alts':
            friendly_name = f"Altcoins ({parts[2]})"
        elif len(parts) > 1 and parts[1] == 'btc':
            friendly_name = "Consejo Infinity (BTC)"
        else:
            friendly_name = prefix # Nombre por defecto
        
        channels[friendly_name] = prefix
    return channels

# --- FUNCIÓN MEJORADA PARA FORMATEAR LA RESPUESTA ---
def display_formatted_analysis(raw_text: str):
    """
    Analiza la respuesta completa de la IA, que puede contener múltiples secciones,
    y las formatea en componentes de Streamlit visualmente atractivos.
    """
    # El primer split separa el encabezado principal del cuerpo del mensaje
    header_part, *body_parts = raw_text.split('\n\n', 1)
    body = body_parts[0] if body_parts else ""
    
    # Mostramos el encabezado principal (ej: "Análisis de BTC/USDT a las...")
    st.markdown(f"*{header_part}*")
    
    # Usamos regex para dividir el cuerpo del mensaje por los títulos de los analistas
    parts = re.split(r'(\*\*Analista.*?|\*\*DECISIÓN FINAL.*?)\n', body)
    parts = [p.strip() for p in parts if p.strip()]

    i = 0
    while i < len(parts):
        title = parts[i]
        content = parts[i + 1] if (i + 1) < len(parts) else ""
        
        st.markdown(f"**{title.replace('**', '')}**")

        # Intentamos interpretar el contenido como JSON
        try:
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                with st.container(border=True):
                    if 'sentiment' in data:
                        emoji = "📈" if data.get('sentiment') == "BULLISH" else "📉" if data.get('sentiment') == "BEARISH" else "↔️"
                        st.markdown(f"**Sentimiento:** {data.get('sentiment', 'N/D')} {emoji}")
                    if 'signal' in data:
                        st.markdown(f"**Señal Potencial:** `{data.get('signal', 'N/D')}`")
                    if 'confirmation' in data:
                        confirm_emoji = "✅" if data.get('confirmation') == "CONFIRMED" else "❌"
                        st.markdown(f"**Confirmación:** {data.get('confirmation', 'N/D')} {confirm_emoji}")
                    if 'confidence' in data:
                        st.markdown(f"**Confianza:** {data.get('confidence', 'N/D')}")
                    if 'trigger_price' in data:
                        st.markdown(f"**Precio de Activación:** `$ {data.get('trigger_price', 'N/D')}`")
                    if 'reasoning' in data:
                        st.markdown(f"**Razonamiento:** *{data.get('reasoning', 'Sin razonamiento.')}*")
            else:
                # Si no hay JSON, es el texto de la decisión final
                st.info(content)

        except (json.JSONDecodeError, IndexError):
            st.code(content, language='text')

        i += 2


# --- CONFIGURACIÓN DE PÁGINA Y CONEXIÓN A REDIS ---
st.set_page_config(layout="wide", page_title="Infinity Room - Chat")
st.title("💬 Chat con los Analistas de IA")
st.markdown("Revisa el razonamiento conversacional de los diferentes workers.")

try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.ping()
except redis.exceptions.ConnectionError as e:
    st.error(f"❌ **Error de conexión con Redis:** No se pudo conectar al servidor. Detalles: {e}")
    st.stop()

# --- BUCLE DE ACTUALIZACIÓN ---
placeholder = st.empty()
while True:
    with placeholder.container():
        # Obtenemos dinámicamente los canales de chat disponibles
        chat_channels = get_available_chat_channels(r)

        if not chat_channels:
            st.info("Esperando que algún worker inicie para mostrar un canal de chat...")
        else:
            # Creamos el selector para que el usuario elija el canal
            sorted_channels = sorted(chat_channels.keys())
            selected_channel_name = st.selectbox(
                "Selecciona un canal de análisis:",
                options=sorted_channels
            )

            # Obtenemos el prefijo de Redis para el canal seleccionado
            selected_prefix = chat_channels[selected_channel_name]

            # --- NUEVO BOTÓN PARA LIMPIAR HISTORIAL ---
            st.markdown("---") # Separador visual
            col1, col2 = st.columns([4, 1]) # Columnas para alinear el botón
            with col2:
                if st.button("🗑️ Limpiar Chat"):
                    # Borramos la clave del chat log en Redis
                    r.delete(f"{selected_prefix}:chat_log")
                    st.toast(f"Historial de '{selected_channel_name}' limpiado.")
                    # Forzamos la recarga de la página para ver el cambio
                    time.sleep(1) # Pequeña pausa para que se vea el toast
                    st.rerun()
            st.markdown("---")
            # --- FIN DEL BOTÓN ---

            # Leemos los logs del canal seleccionado
            chat_logs = r.lrange(f"{selected_prefix}:chat_log", 0, -1)

            if not chat_logs:
                st.info(f"No hay mensajes en el canal '{selected_channel_name}'.")
            else:
                # Iteramos en orden inverso para mostrar lo más nuevo arriba
                for entry in reversed(chat_logs):
                    with st.chat_message("assistant", avatar="🤖"):
                        # Usamos la función para formatear la salida completa
                        display_formatted_analysis(entry)
                    st.markdown("---")

    time.sleep(config.REFRESH_INTERVAL)