# app.py
import streamlit as st
import pandas as pd
import json
import redis
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import time
import sys
import os

# --- IMPORTACIONES DEL PROYECTO ---
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))
from src import config

# --- FUNCIÓN DE GRÁFICO AVANZADO ---
def create_main_chart(df: pd.DataFrame, status_data: dict = None, chart_data: dict = None) -> go.Figure:
    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.03, row_heights=[0.8, 0.2])
    
    # Indicadores base
    fig.add_trace(go.Candlestick(x=df.index, open=df['open'], high=df['high'], low=df['low'], close=df['close'], name='Precio'), row=1, col=1)
    fig.add_trace(go.Scatter(x=df.index, y=df['ema_fast'], mode='lines', name=f'EMA {config.EMA_FAST_PERIOD}', line=dict(color='white', width=1), line_shape='hv'), row=1, col=1)
    
    if 'sml_high' in df.columns and 'sml_low' in df.columns:
        fig.add_trace(go.Scatter(x=df.index, y=df['sml_high'], mode='lines', name='SML High', line=dict(color='rgba(0, 200, 83, 0.7)', width=2)), row=1, col=1)
        fig.add_trace(go.Scatter(x=df.index, y=df['sml_low'], mode='lines', name='SML Low', line=dict(color='rgba(255, 82, 82, 0.7)', width=2)), row=1, col=1)
        
    if 'rsi' in df.columns:
        fig.add_trace(go.Scatter(x=df.index, y=df['rsi'], mode='lines', name='RSI', line=dict(color='yellow', width=1)), row=2, col=1)
        subtle_grey = 'rgba(211, 211, 211, 0.3)'
        fig.add_hline(y=70, line_dash="dash", line_color=subtle_grey, line_width=1, row=2, col=1)
        fig.add_hline(y=30, line_dash="dash", line_color=subtle_grey, line_width=1, row=2, col=1)

    # Lógica para graficar divergencias
    divergences = chart_data.get('divergences', []) if chart_data else []
    if divergences:
        for div in divergences:
            fig.add_shape(type="line", layer='below',
                          x0=div['price_start']['x'], y0=div['price_start']['y'],
                          x1=div['price_end']['x'], y1=div['price_end']['y'],
                          line=dict(color="rgba(255, 255, 255, 0.5)", width=2, dash="dot"), row=1, col=1)
            fig.add_shape(type="line", layer='below',
                          x0=div['rsi_start']['x'], y0=div['rsi_start']['y'],
                          x1=div['rsi_end']['x'], y1=div['rsi_end']['y'],
                          line=dict(color="rgba(255, 255, 255, 0.5)", width=2, dash="dot"), row=2, col=1)

    # Lógica para graficar el trade activo
    proposal = status_data.get('proposal') if status_data else None
    if proposal and all(k in proposal for k in ['entry_price', 'stop_loss', 'take_profit']):
        entry_price = proposal['entry_price']
        sl = proposal['stop_loss']
        tp = proposal['take_profit']
        trade_type = proposal.get('type', 'BUY')

        sl_color = "rgba(255, 82, 82, 0.2)"
        tp_color = "rgba(0, 200, 83, 0.2)"
        if trade_type == 'SELL':
            sl_color, tp_color = tp_color, sl_color

        fig.add_shape(type="rect", x0=df.index[-1], y0=entry_price, x1=df.index[-1] + pd.Timedelta(hours=4), y1=tp,
                      fillcolor=tp_color, line=dict(width=0), layer='below', row=1, col=1)
        fig.add_shape(type="rect", x0=df.index[-1], y0=entry_price, x1=df.index[-1] + pd.Timedelta(hours=4), y1=sl,
                      fillcolor=sl_color, line=dict(width=0), layer='below', row=1, col=1)
        fig.add_hline(y=entry_price, line_dash="dot", line_color="white", line_width=1,
                      annotation_text=f"Entrada: {entry_price}", annotation_position="bottom right", row=1, col=1)

    # Layout y estilo general
    fig.update_layout(height=700, xaxis_rangeslider_visible=False, showlegend=True, paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="#0E1117", font_color="white", margin=dict(l=40, r=40, t=40, b=40), legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1))
    fig.update_xaxes(showspikes=True)
    fig.update_yaxes(showspikes=True, row=1, col=1)
    fig.update_yaxes(range=[0, 100], row=2, col=1)
    return fig

# --- CONFIGURACIÓN DE PÁGINA Y CONEXIÓN A REDIS ---
st.set_page_config(layout="wide", page_title="Infinity Room - Live", page_icon="♾️")

# --- INTERFAZ PRINCIPAL ---
st.title("♾️ Infinity Room - Monitor en Vivo")
placeholder_status = st.empty()
placeholder_chart = st.empty()

try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.ping()
except redis.exceptions.ConnectionError as e:
    st.error(f"❌ Error de conexión con Redis. Asegúrate de que Redis Server esté corriendo. Detalle: {e}")
    st.stop()
    
# --- BUCLE DE ACTUALIZACIÓN EN VIVO ---
while True:
    status_str = r.get("infinity_room:status")
    chart_data_str = r.get("infinity_room:chart_data")
    status_data = json.loads(status_str) if status_str else None
    chart_data = json.loads(chart_data_str) if chart_data_str else None

    # --- Rellenar el contenedor de ESTADO ---
    with placeholder_status.container():
        reasoning_text = status_data.get('reasoning', 'Esperando al worker...') if status_data else 'Esperando al worker...'
        # --- CAMBIO DE TEXTO ---
        st.info(f"**Análisis de Infinity Room:** {reasoning_text}")

    # --- Rellenar el contenedor del GRÁFICO ---
    with placeholder_chart.container():
        if chart_data and 'data' in chart_data and 'columns' in chart_data:
            try:
                df_live = pd.DataFrame(chart_data['data'], columns=chart_data['columns'])
                if 'timestamp' in df_live.columns:
                    df_live['timestamp'] = pd.to_datetime(df_live['timestamp'], unit='ms')
                    df_live.set_index('timestamp', inplace=True)
                    df_live.index = df_live.index.tz_localize('UTC').tz_convert('Etc/GMT+3')
                    
                    st.plotly_chart(create_main_chart(df_live, status_data, chart_data), use_container_width=True)
                else:
                    st.error("Los datos del worker no contienen la columna 'timestamp'.")
            except Exception as e:
                st.error(f"Error al procesar los datos del gráfico: {e}")
        else:
            st.warning("Esperando datos del worker para generar el gráfico...")

    time.sleep(config.REFRESH_INTERVAL)