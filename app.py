import streamlit as st
import os
import base64

# Configuración de página ancha para que el iframe tenga espacio
st.set_page_config(layout="wide")

# --- PASO 1: OCULTAR LA UI POR DEFECTO DE STREAMLIT ---
# Esto elimina el header, la barra lateral, etc., para una experiencia de pantalla completa.
hide_streamlit_ui = """
<style>
    #root > div:nth-child(1) > div > div > div {
        padding: 0;
    }
    [data-testid="stToolbar"] {display: none;}
    [data-testid="stHeader"] {display: none;}
    [data-testid="stSidebar"] {display: none;}
    footer {display: none;}
</style>
"""
st.markdown(hide_streamlit_ui, unsafe_allow_html=True)


# --- PASO 2: PREPARAR EL HTML PARA EL IFRAME ---
# Leemos tu archivo HTML, que ya contiene su propio CSS
try:
    with open(os.path.join('infinity-landing', 'index.html'), 'r', encoding='utf-8') as f:
        html_content = f.read()
except FileNotFoundError:
    st.error("No se encontró el archivo index.html en la carpeta 'infinity-landing'.")
    st.stop()

# Función para incrustar la imagen del logo
def get_image_as_base64(path):
    if not os.path.exists(path): return None
    with open(path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode()

# Incrustamos el logo en el HTML
logo_path = os.path.join('infinity-landing', 'logo.png')
logo_base64 = get_image_as_base64(logo_path)
if logo_base64:
    html_content = html_content.replace('src="logo.png"', f'src="data:image/png;base64,{logo_base64}"')
else:
    # Si no hay logo, lo ocultamos para que no se vea el ícono roto
    html_content = html_content.replace('<img src="logo.png"', '<img style="display:none;"')

# Codificamos el HTML final para pasarlo de forma segura al iframe
html_b64 = base64.b64encode(html_content.encode()).decode()


# --- PASO 3: CREAR EL IFRAME DE PANTALLA COMPLETA ---
# st.components.v1.html es más robusto para esto que st.markdown
st.components.v1.html(
    f'<iframe src="data:text/html;base64,{html_b64}" style="width: 100%; height: 100vh; border: none; margin: 0; padding: 0; overflow: hidden;"></iframe>',
    height=3000, # Un valor alto para asegurar que no haya doble scrollbar
    scrolling=False
)