# src/indicators.py
import pandas as pd
import pandas_ta as ta
from src import config

def calculate_ema(close_prices: pd.Series, period: int) -> pd.Series:
    """
    Calcula la Media Móvil Exponencial (EMA) usando un período explícito.
    """
    return ta.ema(close_prices, length=period)


def calculate_rsi(close_prices: pd.Series, period: int) -> pd.Series:
    """
    Calcula el Índice de Fuerza Relativa (RSI) usando un período explícito.
    """
    return ta.rsi(close_prices, length=period)


def calculate_sml_channel(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calcula los niveles del SML Channel replicando la lógica de Pine Script.
    El SML High es simplemente el 'high' de la vela y el SML Low es el 'low'.
    """
    # Esta es la corrección clave basada en tu código de Pine Script
    df['sml_high'] = df['high']
    df['sml_low'] = df['low']
    return df