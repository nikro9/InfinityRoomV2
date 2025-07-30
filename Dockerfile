# 1. Usar una imagen oficial y ligera de Python como base
FROM python:3.11-slim

# 2. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Actualizar el gestor de paquetes e instalar dependencias del sistema
# Algunas librerías de Python las necesitan para compilarse correctamente
RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential

# 4. Copiar el archivo de requerimientos e instalar las dependencias de Python
# Esto se hace en un paso separado para aprovechar el cache de Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar todo el resto del código del proyecto al contenedor
COPY . .

# 6. Exponer el puerto que Streamlit usa por defecto para que sea accesible
EXPOSE 8501

# Nota: No necesitamos un comando de inicio (CMD) aquí.
# Se lo diremos directamente a Railway para cada servicio.
