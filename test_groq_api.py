# test_groq_api.py
import os
from dotenv import load_dotenv
from groq import Groq

print("--- Iniciando prueba de API de Groq ---")

try:
    # 1. Cargar el archivo .env
    if load_dotenv():
        print("✅ Archivo .env cargado correctamente.")
    else:
        print("⚠️  ADVERTENCIA: No se encontró el archivo .env.")

    # 2. Leer la clave de API de Groq
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        print("❌ ERROR: No se encontró la variable GROQ_API_KEY en el archivo .env.")
        print("--- Prueba de API finalizada ---")
        exit()
    else:
        print(f"✅ Clave de API de Groq encontrada, terminando en: ...{api_key[-4:]}")

    # 3. Crear el cliente de Groq
    client = Groq(api_key=api_key)
    print("⚙️  Cliente de Groq configurado.")
    
    # 4. Enviar una pregunta de prueba simple
    print("🧠 Enviando pregunta de prueba a Groq (Llama 3)...")
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Hola, solo responde 'OK' si estás funcionando.",
            }
        ],
        model="llama3-8b-8192",
    )
    
    print("✅ ¡Respuesta recibida de Groq!")
    print(f"🤖 Respuesta: {chat_completion.choices[0].message.content.strip()}")

except Exception as e:
    print(f"🔥 Ocurrió un error catastrófico durante la prueba: {e}")

print("--- Prueba de API finalizada ---")
