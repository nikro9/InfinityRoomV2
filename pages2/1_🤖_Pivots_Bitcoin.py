# Pages/1_🤖_Pivots_Bitcoin.py
import streamlit as st
import pandas as pd
import json
import redis
import time
import sys
import os

# --- IMPORTACIONES DEL PROYECTO ---
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from src import config
from src.ui_components import create_main_chart

# --- CONFIGURACIÓN DE LA PÁGINA ---
st.set_page_config(layout="wide", page_title="Bitcoin Pivots")
STRATEGY_CONFIG = config.STRATEGIES["BITCOIN_PIVOTS"]

st.title(f"♾️ Monitor en Vivo para {STRATEGY_CONFIG['symbol']}")

# --- CONEXIÓN A REDIS Y BUCLE DE ACTUALIZACIÓN ---
redis_url = os.getenv('REDIS_URL')
if redis_url:
    r = redis.from_url(redis_url, decode_responses=True)
else:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)

try:
    r.ping()
except redis.exceptions.ConnectionError as e:
    st.error(f"❌ Error de conexión con Redis: {e}")
    st.stop()

placeholder_status = st.empty()
placeholder_chart = st.empty()
placeholder_details = st.empty()

while True:
    redis_prefix = STRATEGY_CONFIG['redis_prefix']
    status_str = r.get(f"{redis_prefix}:status")
    chart_data_str = r.get(f"{redis_prefix}:chart_data")
    
    status_data = json.loads(status_str) if status_str else None
    chart_data = json.loads(chart_data_str) if chart_data_str else None
    
    with placeholder_status.container():
        reasoning_text = status_data.get('reasoning', 'Esperando al worker de Bitcoin...') if status_data else 'Esperando al worker de Bitcoin...'
        st.info(f"**Análisis de {STRATEGY_CONFIG['symbol']}:** {reasoning_text}")

    with placeholder_chart.container():
        if chart_data and 'data' in chart_data and 'columns' in chart_data:
            try:
                df_live = pd.DataFrame(chart_data['data'], columns=chart_data['columns'])
                if 'timestamp' in df_live.columns:
                    df_live['timestamp'] = pd.to_datetime(df_live['timestamp'], unit='ms')
                    df_live.set_index('timestamp', inplace=True)
                    df_live.index = df_live.index.tz_localize('UTC').tz_convert('Etc/GMT+3')
                    st.plotly_chart(create_main_chart(df_live, status_data, chart_data), use_container_width=True)
            except Exception as e:
                st.error(f"Error al procesar los datos del gráfico: {e}")
        else:
            st.warning(f"Esperando datos del worker para {STRATEGY_CONFIG['symbol']}...")

    with placeholder_details.container():
        if status_data and status_data.get('proposal'):
            proposal = status_data['proposal']
            st.subheader("Detalles de la Propuesta de Trade Activa")
            col1, col2, col3 = st.columns(3)
            col1.metric("Precio de Entrada", f"{proposal.get('entry_price', 0):,.2f}")
            col2.metric("Stop Loss (SL)", f"{proposal.get('stop_loss', 0):,.2f}")
            col3.metric("Take Profit (TP)", f"{proposal.get('take_profit', 0):,.2f}")
            st.info("Se recomienda tomar un TP1 del 75% de la posicion y el 25% restante colocar en Breakeven y dejar correr para maximizar ganancias")

    time.sleep(config.REFRESH_INTERVAL)