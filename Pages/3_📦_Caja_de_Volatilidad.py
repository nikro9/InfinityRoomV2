# pages/8_📦_Estrategia_Caja_de_Volatilidad.py
import streamlit as st

st.set_page_config(layout="wide", page_title="Caja de Volatilidad")

st.title("📦 Estrategia de Caja de Volatilidad para Índices")
st.header("Próximamente...")

st.markdown("---")
st.info(
    """
    Esta sección contendrá el dashboard para la nueva estrategia de "Caja de Volatilidad", 
    diseñada para operar en la apertura de mercados de índices como el S&P 500 o el Nasdaq.

    **Concepto General de la Estrategia:**
    1.  **Definir la "Caja":** Se identifica el rango (máximo y mínimo) de las primeras horas de la sesión de trading.
    2.  **Buscar la Ruptura:** El bot esperará a que el precio rompa este rango inicial con volumen.
    3.  **Operar a Favor de la Ruptura:** Se abrirá una operación en la dirección de la ruptura, asumiendo que la volatilidad continuará en esa dirección durante el día.

    Actualmente, esta estrategia se encuentra en fase de diseño. ¡Vuelve pronto!
    """
)

# Aquí iría el código futuro para la interfaz de esta estrategia:
# - Selector de Índice (SPX, NDX, etc.)
# - Conexión a Redis para un nuevo worker ('indices_worker.py')
# - Visualización del gráfico con la "caja" dibujada