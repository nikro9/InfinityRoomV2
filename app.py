# app.py (versión final y definitiva)
import streamlit as st
import os

# Configuración de página para que ocupe todo el espacio
st.set_page_config(layout="wide")

# Ocultamos la UI por defecto de Streamlit para una experiencia limpia
hide_streamlit_ui = """
<style>
    #root > div:nth-child(1) > div > div > div { padding: 0; }
    [data-testid="stToolbar"], [data-testid="stHeader"], [data-testid="stSidebar"], footer {
        display: none;
    }
</style>
"""
st.markdown(hide_streamlit_ui, unsafe_allow_html=True)

# Leemos y mostramos tu archivo HTML directamente
try:
    with open(os.path.join('infinity-landing', 'index.html'), 'r', encoding='utf-8') as f:
        html_content = f.read()
    st.components.v1.html(html_content, height=1000, scrolling=True)
except FileNotFoundError:
    st.error("Error: No se encontró el archivo 'infinity-landing/index.html'.")