# pages/2_🚀_Backtesting.py
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import sys
import os

# --- IMPORTACIONES DEL PROYECTO ---
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from src.market_data import get_historical_data
from src.backtester import run_backtest
from src.performance_analyzer import analyze_performance

# --- CONFIGURACIÓN DE LA PÁGINA ---
st.set_page_config(layout="wide", page_title="Infinity Room - Backtesting")
st.title("🚀 Módulo de Backtesting")
st.markdown("Simula el rendimiento de tu estrategia de scalping en 5 minutos sobre datos históricos.")

# --- CONTROLES EN LA BARRA LATERAL ---
with st.sidebar:
    st.header("⚙️ Controles de Simulación")
    bt_symbol = st.selectbox("Activo", options=["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"], index=0, key="bt_symbol")
    
    # Se eliminó el selector de temporalidad para fijarlo en 5m
    
    bt_days = st.number_input("Período de Backtest (días)", min_value=10, max_value=365*2, value=30, step=10, key="bt_days")
    run_backtest_button = st.button("Ejecutar Simulación", use_container_width=True, type="primary")

# --- LÓGICA DE EJECUCIÓN DEL BACKTEST ---
if run_backtest_button:
    # La temporalidad ahora está fija en '5m'
    timeframe_fijo = '5m'
    
    with st.spinner(f"Obteniendo {bt_days} días de datos para {bt_symbol} en {timeframe_fijo}..."):
        historical_data = get_historical_data(symbol=bt_symbol, timeframe=timeframe_fijo, days=bt_days)
    
    if historical_data:
        # Pasamos el DataFrame directamente, el backtester se encargará de prepararlo
        df_hist = pd.DataFrame(historical_data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        
        with st.spinner("Ejecutando simulación vela por vela con la IA... Esto puede ser lento y consumir tokens."):
            trades, equity_curve = run_backtest(df_hist) 
            st.session_state['backtest_results'] = (trades, equity_curve)
        st.success("¡Backtest completado!")
    else:
        st.error("No se pudieron obtener datos históricos para el backtest.")

# --- VISUALIZACIÓN DE RESULTADOS ---
if 'backtest_results' in st.session_state:
    trades, equity_curve = st.session_state['backtest_results']
    
    st.markdown("---")
    st.header("Resultados de la Simulación")

    if trades:
        # NOTA: La función analyze_performance puede necesitar ajustes para funcionar con la nueva salida
        # performance_metrics = analyze_performance(trades, equity_curve)
        
        # Mostramos métricas simples por ahora
        st.metric("Total de Trades Generados", len(trades))

        st.subheader("Log de Trades Propuestos por la IA")
        st.dataframe(pd.DataFrame(trades), use_container_width=True)
    else:
        st.warning("La IA no generó ninguna propuesta de trade en el período de backtest seleccionado.")
