import streamlit as st
import os
import base64

# 1. Configuración de la página principal
st.set_page_config(
    page_title="Infinity Room - Plataforma de Trading",
    page_icon="♾️",
    layout="wide"
)

# 2. Función para codificar una imagen local a Base64
def get_image_as_base64(path):
    if not os.path.exists(path):
        return None
    with open(path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode()

# 3. Rutas a tus archivos
LANDING_HTML_PATH = os.path.join('infinity-landing', 'index.html')
LOGO_PATH = os.path.join('infinity-landing', 'logo.png') # Asumo que el logo está aquí

# 4. Leemos el contenido del archivo HTML
try:
    with open(LANDING_HTML_PATH, 'r', encoding='utf-8') as f:
        html_content = f.read()
except FileNotFoundError:
    st.error(f"Error: No se encontró el archivo {LANDING_HTML_PATH}.")
    st.stop()

# 5. Codificamos la imagen y la reemplazamos en el HTML
logo_base64 = get_image_as_base64(LOGO_PATH)
if logo_base64:
    # Reemplazamos la referencia local 'logo.png' por la imagen incrustada
    html_content = html_content.replace(
        'src="logo.png"', 
        f'src="data:image/png;base64,{logo_base64}"'
    )
else:
    # Si no se encuentra el logo, lo quitamos para no mostrar un ícono roto
    html_content = html_content.replace('<img src="logo.png"', '<img style="display:none;"')


# 6. Ocultamos la barra lateral de Streamlit para una experiencia limpia
hide_sidebar_style = """
    <style>
        [data-testid="stSidebar"] {display: none;}
    </style>
"""

# 7. Mostramos el resultado final
st.markdown(hide_sidebar_style + html_content, unsafe_allow_html=True)