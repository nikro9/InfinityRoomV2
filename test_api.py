# test_api.py
import os
from dotenv import load_dotenv
import google.generativeai as genai

print("--- Iniciando prueba de API ---")

try:
    # 1. Cargar el archivo .env
    if load_dotenv():
        print("✅ Archivo .env cargado correctamente.")
    else:
        print("⚠️  ADVERTENCIA: No se encontró el archivo .env.")

    # 2. Leer la clave de API
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("❌ ERROR: No se encontró la variable GOOGLE_API_KEY en el archivo .env.")
        print("--- Prueba de API finalizada ---")
        exit()
    else:
        # Muestra solo los últimos 4 dígitos por seguridad
        print(f"✅ Clave de API encontrada, terminando en: ...{api_key[-4:]}")

    # 3. Configurar la API
    genai.configure(api_key=api_key)
    print("⚙️  API de Google configurada.")

    # 4. Crear el modelo
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("🤖 Modelo 'gemini-1.5-flash' cargado.")

    # 5. Enviar una pregunta de prueba simple
    print("🧠 Enviando pregunta de prueba a Gemini...")
    response = model.generate_content("Hola, solo responde 'OK' si estás funcionando.")
    
    print("✅ ¡Respuesta recibida de Gemini!")
    print(f"🤖 Respuesta: {response.text.strip()}")

except Exception as e:
    print(f"🔥 Ocurrió un error catastrófico durante la prueba: {e}")

print("--- Prueba de API finalizada ---")