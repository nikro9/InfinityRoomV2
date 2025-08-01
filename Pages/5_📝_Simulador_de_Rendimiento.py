import streamlit as st
import pandas as pd
import sys
import os

# Añadir la ruta raíz al sys.path para permitir importaciones desde src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.performance_analyzer import project_performance

st.set_page_config(layout="wide", page_title="Simulador de Rendimiento")

st.title("🤖 Simulador de Rendimiento de Capital")
st.markdown("Calcula cómo se hubiera comportado tu capital con la estrategia histórica del bot.")

# --- Cargar Datos Históricos ---
try:
    trades_df = pd.read_csv('data/backtest_results/historical_trades.csv')
    equity_df = pd.read_csv('data/backtest_results/equity_curve.csv')
except FileNotFoundError:
    st.error("⚠️ Error: No se encontró el archivo de resultados del backtest. Por favor, ejecuta un backtest primero para generar los datos.")
    st.stop()

# --- Panel de Simulación ---
user_capital = st.number_input(
    "Ingresa tu capital inicial ($)",
    min_value=100.0,
    value=10000.0,
    step=500.0,
    help="Escribe la cantidad con la que te gustaría simular la estrategia."
)

st.divider()

periods_in_days = [30, 60, 90, 180, 365]
cols = st.columns(len(periods_in_days))

for i, days in enumerate(periods_in_days):
    with cols[i]:
        final_capital, growth = project_performance(user_capital, trades_df.copy(), equity_df.copy(), days)
        
        st.metric(
            label=f"En los últimos {days} días",
            value=f"${final_capital:,.2f}",
            delta=f"{growth:.2%}"
        )

st.info("Nota: Los rendimientos pasados no garantizan resultados futuros. Esta es una simulación basada en datos históricos.", icon="⚠️")