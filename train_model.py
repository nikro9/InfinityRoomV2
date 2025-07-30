# train_model.py
import pandas as pd
import numpy as np
import joblib
import os
import sys
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import plotly.graph_objects as go

# --- CONFIGURACIÓN DE LA RUTA DEL PROYECTO ---
# Esto permite que el script encuentre los módulos dentro de la carpeta src/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

# --- IMPORTACIONES DEL PROYECTO ---
from src import config
from src.market_data import get_historical_data
from src.indicators import calculate_ema, calculate_rsi, calculate_sml_channel

# --- PARÁMETROS DE ENTRENAMIENTO Y ETIQUETADO ---
# Cuántas velas hacia adelante miraremos para determinar si la vela actual fue una buena señal.
LOOK_FORWARD_CANDLES = 10
# Qué porcentaje de ganancia debe alcanzar para ser considerada una señal de LONG/SHORT.
PROFIT_THRESHOLD = 0.005  # 0.5%

def label_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """
    Analiza el movimiento futuro del precio para etiquetar cada vela.
    - 1 (LONG): Si el precio sube un X% antes de bajar un X%.
    - -1 (SHORT): Si el precio baja un X% antes de subir un X%.
    - 0 (IDLE): Si no ocurre ninguno de los dos en el período de observación.
    """
    print("🧠 Etiquetando el dataset...")
    labels = []
    for i in range(len(df) - LOOK_FORWARD_CANDLES):
        window = df.iloc[i : i + LOOK_FORWARD_CANDLES]
        current_price = df.iloc[i]['close']
        
        # Definimos los umbrales de take profit y stop loss para el etiquetado
        long_target = current_price * (1 + PROFIT_THRESHOLD)
        short_target = current_price * (1 - PROFIT_THRESHOLD)
        
        long_signal = False
        short_signal = False
        
        for j in range(1, len(window)):
            future_price_high = window.iloc[j]['high']
            future_price_low = window.iloc[j]['low']
            
            # Comprueba si el objetivo de LONG se alcanzó primero
            if future_price_high >= long_target:
                long_signal = True
                break
            
            # Comprueba si el objetivo de SHORT se alcanzó primero
            if future_price_low <= short_target:
                short_signal = True
                break
        
        if long_signal and not short_signal:
            labels.append(1)  # LONG
        elif short_signal and not long_signal:
            labels.append(-1) # SHORT
        else:
            labels.append(0)  # IDLE
            
    # Rellenamos las últimas etiquetas que no se pueden calcular
    labels.extend([0] * LOOK_FORWARD_CANDLES)
    df['target'] = labels
    return df

def train_signal_model():
    """
    Función principal para orquestar el proceso de entrenamiento del modelo de IA.
    """
    print("--- Iniciando Proceso de Entrenamiento del Modelo de Señales ---")

    # 1. OBTENER DATOS HISTÓRICOS
    print(f"⬇️  Obteniendo 60 días de datos históricos para {config.SYMBOL}...")
    data = get_historical_data(symbol=config.SYMBOL, timeframe=config.TIMEFrame_OPERATIVA, days=60)
    if not data:
        print("❌ Error: No se pudieron obtener los datos. Abortando.")
        return

    df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df.set_index('timestamp', inplace=True)
    print(f"✅ Datos obtenidos: {len(df)} velas.")

    # 2. CALCULAR INDICADORES (FEATURES)
    print("📈 Calculando indicadores técnicos...")
    df['ema_12'] = calculate_ema(df['close'], period=config.EMA_FAST_PERIOD)
    df['ema_200'] = calculate_ema(df['close'], period=config.EMA_TREND_PERIOD)
    df['rsi_14'] = calculate_rsi(df['close'], period=config.RSI_PERIOD)
    
    # Calcular SML Channel
    df_sml = df.resample(config.TIMEFRAME_SML).agg(
        {'open': 'first', 'high': 'max', 'low': 'min', 'close': 'last'}
    ).dropna()
    df_sml = calculate_sml_channel(df_sml)
    df = pd.merge_asof(df.sort_index(), df_sml[['sml_high', 'sml_low']], left_index=True, right_index=True, direction='backward')
    
    # Añadimos features adicionales que pueden ser útiles
    df['price_vs_ema_fast'] = (df['close'] - df['ema_12']) / df['ema_12']
    df['price_vs_ema_trend'] = (df['close'] - df['ema_200']) / df['ema_200']
    df['ema_fast_vs_ema_trend'] = (df['ema_12'] - df['ema_200']) / df['ema_200']

    # 3. ETIQUETAR EL DATASET
    df = label_dataset(df)

    # 4. PREPARAR LOS DATOS PARA EL MODELO
    print("🧹 Limpiando y preparando datos...")
    df.dropna(inplace=True)
    
    # Las características (X) son los indicadores, las etiquetas (y) son nuestro 'target'
    features = ['ema_12', 'ema_200', 'rsi_14', 'sml_high', 'sml_low', 
                'price_vs_ema_fast', 'price_vs_ema_trend', 'ema_fast_vs_ema_trend']
    X = df[features]
    y = df['target']

    # Dividir en conjuntos de entrenamiento y prueba
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Conjunto de entrenamiento: {len(X_train)} muestras.")
    print(f"Conjunto de prueba: {len(X_test)} muestras.")
    print(f"Distribución de etiquetas en el dataset: \n{y.value_counts(normalize=True)}")

    # 5. ENTRENAR EL MODELO
    print("🤖 Entrenando el modelo RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced', n_jobs=-1)
    model.fit(X_train, y_train)
    print("✅ Modelo entrenado.")

    # 6. EVALUAR EL MODELO
    print("\n--- Evaluación del Modelo ---")
    y_pred = model.predict(X_test)
    print("Reporte de Clasificación:")
    print(classification_report(y_test, y_pred, target_names=['SHORT (-1)', 'IDLE (0)', 'LONG (1)']))
    
    print("Matriz de Confusión:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)

    # 7. GUARDAR EL MODELO
    model_dir = os.path.join('src', 'model')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'signal_model.pkl')
    joblib.dump(model, model_path)
    print(f"\n💾 Modelo guardado exitosamente en: {model_path}")
    print("--- Proceso de Entrenamiento Finalizado ---")

if __name__ == "__main__":
    train_signal_model()
