# app.py
import streamlit as st
import os

# 1. Configuración de la página principal (mantenemos la tuya)
#    'layout="wide"' es ideal para que tu landing page ocupe toda la pantalla.
st.set_page_config(
    page_title="Infinity Room - Plataforma de Trading",
    page_icon="♾️",
    layout="wide"
)

# 2. Definimos las rutas a tus archivos HTML y CSS
#    Asegúrate de que la carpeta 'infinity-landing' esté en la raíz de tu proyecto.
LANDING_HTML_PATH = os.path.join('infinity-landing', 'index.html')
LANDING_CSS_PATH = os.path.join('infinity-landing', 'styles.css')

# 3. Leemos el contenido de los archivos
try:
    with open(LANDING_HTML_PATH, 'r', encoding='utf-8') as f:
        html_content = f.read()
except FileNotFoundError:
    st.error(f"Error: No se encontró el archivo index.html en la ruta '{LANDING_HTML_PATH}'.")
    st.stop() # Detiene la ejecución si el archivo principal no existe

# Leemos el CSS de forma opcional (si no existe, no pasa nada)
css_content = ""
if os.path.exists(LANDING_CSS_PATH):
    with open(LANDING_CSS_PATH, 'r', encoding='utf-8') as f:
        # Envolvemos el CSS en etiquetas <style> para que el navegador lo entienda
        css_content = f"<style>{f.read()}</style>"

# 4. Ocultamos la barra lateral de Streamlit en esta página de inicio
#    Esto le da a tu landing un aspecto de página web completa.
#    La barra lateral reaparecerá en las otras páginas.
hide_sidebar_style = """
    <style>
        [data-testid="stSidebar"] {display: none;}
    </style>
"""

# 5. Combinamos todo y lo mostramos en la página
#    Usamos st.markdown con unsafe_allow_html=True para renderizar tu código.
full_page_html = f"""
    {hide_sidebar_style}
    {css_content}
    {html_content}
"""
st.markdown(full_page_html, unsafe_allow_html=True)


# --- NOTA MUY IMPORTANTE SOBRE TUS ENLACES ---
# Para que los botones o enlaces de tu `index.html` lleven a las otras
# páginas de Streamlit, debes asegurarte de que sus atributos `href`
# apunten al nombre del archivo de la página, sin el número ni la extensión.
#
# Por ejemplo, si quieres un enlace a tu página `1_📈_Pivots_Bitcoin.py`,
# el enlace en tu HTML debe ser así:
#
# <a href="/Pivots_Bitcoin">Ir al Dashboard de Bitcoin</a>
#
# Streamlit se encarga del resto.