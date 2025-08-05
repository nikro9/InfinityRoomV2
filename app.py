import streamlit as st
import os
import base64

# 1. Configuración de página ancha, es importante que esté primero.
st.set_page_config(layout="wide")

# 2. --- ESTE ES EL NUEVO CÓDIGO CLAVE ---
#    Un bloque de CSS para forzar el modo de pantalla completa real,
#    eliminando todos los márgenes, paddings y barras de Streamlit.
force_fullscreen_css = """
<style>
    /* Elimina el padding alrededor del área principal */
    .main .block-container {
        padding: 0rem;
    }

    /* Oculta la UI por defecto de Streamlit */
    [data-testid="stSidebar"], [data-testid="stHeader"], [data-testid="stToolbar"], footer {
        display: none;
    }

    /* Fuerza al contenedor principal a ocupar todo el ancho */
    div[data-testid="stAppViewContainer"] {
        width: 100% !important;
        max-width: 100% !important;
    }
</style>
"""
st.markdown(force_fullscreen_css, unsafe_allow_html=True)


# --- PASOS 3 Y 4: Cargar HTML y Logo (esta parte se mantiene igual) ---
HTML_PATH = os.path.join('infinity-landing', 'index.html')
LOGO_PATH = os.path.join('infinity-landing', 'logo.png')

def get_image_as_base64(path):
    if not os.path.exists(path): return None
    with open(path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode()

try:
    with open(HTML_PATH, 'r', encoding='utf-8') as f:
        html_content = f.read()
except FileNotFoundError:
    st.error(f"Error: No se encontró el archivo {HTML_PATH}.")
    st.stop()

logo_base64 = get_image_as_base64(LOGO_PATH)
if logo_base64:
    html_content = html_content.replace('src="logo.png"', f'src="data:image/png;base64,{logo_base64}"')
else:
    html_content = html_content.replace('<img src="logo.png"', '<img style="display:none;"')

# --- PASO 5: Inyectar tu HTML ---
st.markdown(html_content, unsafe_allow_html=True)