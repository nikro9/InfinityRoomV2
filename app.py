# app.py (Nueva Página de Bienvenida)
import streamlit as st

st.set_page_config(
    page_title="Infinity Room - Plataforma de Trading",
    page_icon="♾️",
    layout="wide"
)

st.title("Bienvenido a Infinity Room ♾️")
st.header("Tu Centro de Control para Trading Algorítmico con IA")

st.markdown("---")
st.markdown(
    """
    ### Selecciona una estrategia del menú de la izquierda para comenzar.

    - **🤖 Pivots Bitcoin:** Implementa la estrategia de reversión en SML Channel, optimizada específicamente para BTC/USDT.
    - **📈 Pivots Altcoins (Próximamente):** La misma estrategia de pivotes, pero adaptada para otros activos de alta volatilidad.
    - **📦 Caja de Volatilidad (Próximamente):** Una estrategia completamente diferente diseñada para operar en la apertura de mercados de índices.
    - **... y más.**

    Esta plataforma utiliza un sistema multi-agente de IA para analizar el mercado, proponer operaciones y gestionar el riesgo en tiempo real.
    """
)