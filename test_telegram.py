# test_telegram.py
import sys
import os

# Añadimos la ruta a 'src' para que pueda encontrar el módulo de notificaciones
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

try:
    from src.notifications import send_telegram_message
    print("✅ Módulo de notificaciones importado correctamente.")
except ImportError:
    print("❌ Error: No se pudo importar 'send_telegram_message' desde 'src/notifications.py'.")
    print("Asegúrate de que el archivo existe y no tiene errores.")
    exit()

# --- MENSAJE DE PRUEBA ---
test_message = """
✅ *Prueba de Conexión - Infinity Room* ✅

Si recibes este mensaje, tu bot de Telegram está configurado correctamente y listo para enviar alertas de trading.
"""

print("\n🧠 Enviando mensaje de prueba a Telegram...")

# Llamamos a la función para enviar el mensaje
send_telegram_message(test_message)