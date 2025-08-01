# src/notifications.py
import os
import requests
from dotenv import load_dotenv

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

def send_telegram_message(message: str):
    """
    Envía un mensaje formateado a un chat de Telegram a través de un bot.
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("⚠️  Advertencia: No se encontraron las credenciales de Telegram en el archivo .env. No se enviarán notificaciones.")
        return

    # La URL de la API de Telegram para enviar mensajes
    api_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    
    # El contenido del mensaje
    payload = {
        'chat_id': TELEGRAM_CHAT_ID,
        'text': message,
        'parse_mode': 'Markdown'  # Permite usar formato como *negrita* y `código`
    }
    
    try:
        response = requests.post(api_url, json=payload, timeout=10)
        if response.status_code == 200:
            print("✅ Notificación de Telegram enviada exitosamente.")
        else:
            print(f"❌ Error al enviar notificación de Telegram: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Falla crítica al intentar enviar notificación por Telegram: {e}")