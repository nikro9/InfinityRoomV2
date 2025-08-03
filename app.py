# app.py
import streamlit as st

# Configuración de la página principal
st.set_page_config(
    page_title="Infinity Room - Plataforma de Trading",
    page_icon="♾️",
    layout="wide"
)

st.title("Bienvenido a Infinity Room ♾️")
st.header("Tu Centro de Control para Trading Algorítmico con IA")
st.markdown("---")

st.info("⬅️ Por favor, selecciona una estrategia o herramienta del menú de navegación lateral para comenzar.")

st.markdown(
    """
    ### Estrategias Disponibles:

    - **🤖 Pivots Bitcoin:**
      - Monitorea `BTC/USDT` con la estrategia de reversión en SML Channel de 200 períodos.
    
    - **📈 Pivots Altcoins:**
      - Monitorea una lista seleccionada de altcoins con la misma estrategia de pivotes, pero adaptada con un SML de 400 períodos para mayor volatilidad.

    ### Herramientas:
    - **📜 Log de Actividad:**
      - Revisa las decisiones concisas y el estado actual de los bots.
    - **💬 Chat con IA:**
      - Analiza el razonamiento conversacional completo y los datos que la IA utilizó para tomar cada decisión.
    - **🚀 Backtesting:**
      - Simula el rendimiento de las estrategias sobre datos históricos para su validación.
    """
)

st.sidebar.success("Selecciona una vista arriba.")