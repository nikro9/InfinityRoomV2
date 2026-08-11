# src/indicators.py
import pandas as pd
import pandas_ta as ta

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

def calculate_donchian_channel(df: pd.DataFrame, period: int = 400) -> pd.DataFrame:
    """
    Calcula los Canales de Donchian (Highest High / Lowest Low).
    """
    df['donchian_high'] = df['high'].rolling(window=period).max()
    df['donchian_low'] = df['low'].rolling(window=period).min()
    return df

def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """
    Calcula el Average True Range (ATR).
    """
    return ta.atr(df['high'], df['low'], df['close'], length=period)