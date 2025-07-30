# src/backtester.py
import pandas as pd
from src import config
from src.indicators import calculate_ema, calculate_rsi, calculate_sml_channel
# Importamos la lógica de la IA, ya que el backtest debe simular sus decisiones
from src.ai_model import get_ai_signal 

def run_backtest(df_hist: pd.DataFrame):
    """
    Ejecuta una simulación de backtesting vela por vela sobre datos históricos.
    """
    print("Iniciando proceso de backtesting...")

    # --- 1. PREPARACIÓN DE DATOS ---
    # CORRECCIÓN: Convertir 'timestamp' a datetime y establecerlo como índice.
    # Esto soluciona el TypeError: Only valid with DatetimeIndex.
    if 'timestamp' not in df_hist.columns:
        raise ValueError("El DataFrame histórico debe contener una columna 'timestamp'.")
    
    df_hist['timestamp'] = pd.to_datetime(df_hist['timestamp'], unit='ms')
    df_hist.set_index('timestamp', inplace=True)

    # --- 2. CÁLCULO DE INDICADORES ---
    # Usamos los mismos nombres de columna que el worker para consistencia.
    df_hist['ema_12'] = calculate_ema(df_hist['close'], period=config.EMA_FAST_PERIOD)
    df_hist['ema_200'] = calculate_ema(df_hist['close'], period=config.EMA_TREND_PERIOD)
    df_hist['rsi_14'] = calculate_rsi(df_hist['close'], period=config.RSI_PERIOD)

    # Calcular SML Channel
    df_sml = df_hist.resample(config.TIMEFRAME_SML, origin="13:20:00").agg(
        {'open': 'first', 'high': 'max', 'low': 'min', 'close': 'last'}
    ).dropna()
    df_sml = calculate_sml_channel(df_sml)
    
    # Unir SML al dataframe principal
    df_merged = pd.merge_asof(df_hist.sort_index(), df_sml[['sml_high', 'sml_low']], left_index=True, right_index=True, direction='backward')
    df_merged.dropna(inplace=True)
    print(f"Datos preparados. {len(df_merged)} velas listas para la simulación.")

    # --- 3. BUCLE DE SIMULACIÓN ---
    trades = []
    equity = config.INITIAL_CAPITAL
    equity_curve = [equity]
    current_state = {"status": "IDLE", "reasoning": "Iniciando backtest..."}
    active_trade = None

    # Iteramos vela por vela, simulando el comportamiento del worker
    for i in range(1, len(df_merged)):
        # Creamos una vista "histórica" del dataframe para cada paso
        historical_window = df_merged.iloc[:i]
        
        # Simulamos el order flow con datos nulos, ya que no tenemos datos de trades históricos
        mock_order_flow = {"buy_volume": 0, "sell_volume": 0, "delta": 0, "trade_count": 0}
        
        # Simulamos la decisión de la IA
        # NOTA: Esto hará llamadas reales a la API, puede ser lento y consumir tokens.
        # En una fase posterior, podríamos reemplazar esto con una simulación local.
        new_state, proposal, _ = get_ai_signal(historical_window, current_state, mock_order_flow)
        
        current_state = new_state # La IA gestiona el estado

        # Lógica para gestionar un trade activo
        if active_trade:
            current_price = historical_window.iloc[-1]['close']
            if active_trade['type'] == 'BUY':
                if current_price >= active_trade['take_profit'] or current_price <= active_trade['stop_loss']:
                    # Cerrar trade
                    active_trade = None
                    current_state['status'] = 'IDLE'
            elif active_trade['type'] == 'SELL':
                 if current_price <= active_trade['take_profit'] or current_price >= active_trade['stop_loss']:
                    # Cerrar trade
                    active_trade = None
                    current_state['status'] = 'IDLE'

        # Si la IA genera una nueva propuesta y no hay un trade activo
        if proposal and not active_trade:
            trades.append(proposal)
            active_trade = proposal
            current_state['status'] = f"IN_{proposal['type']}"

        equity_curve.append(equity) # Simplificado: la curva de capital necesita una lógica de PnL

    print(f"Backtesting completado. Se generaron {len(trades)} trades.")
    return trades, equity_curve
