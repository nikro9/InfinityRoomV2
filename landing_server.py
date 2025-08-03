# landing_server.py
import http.server
import socketserver
import os

# Puerto en el que se servirá la landing page
PORT = 8000
# Directorio que contiene los archivos de la landing page
DIRECTORY = "infinity-landing"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Le decimos al servidor que sirva los archivos desde la carpeta 'infinity-landing'
        super().__init__(*args, directory=DIRECTORY, **kwargs)

# Configuración del servidor
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"✅ Servidor de la Landing Page corriendo en http://localhost:{PORT}")
    print("   Entra a esa dirección en tu navegador para ver la página de inicio.")
    print("   Presiona Ctrl+C para detener el servidor.")
    httpd.serve_forever()