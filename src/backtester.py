# src/backtester.py
import pandas as pd
from src import config
from src.indicators import calculate_ema, calculate_rsi, calculate_sml_channel
from src.strategy import check_strategy_logic, calculate_trade_parameters


def run_backtest(df_hist: pd.DataFrame, strategy_key: str = "BITCOIN_PIVOTS"):
    """
    Ejecuta una simulación de backtesting vela por vela sobre datos históricos.
    Usa la lógica determinística de strategy.py (no hace llamadas a API de IA).
    """
    print("Iniciando proceso de backtesting...")

    strategy_config = config.STRATEGIES.get(strategy_key)
    if not strategy_config:
        raise ValueError(f"Estrategia '{strategy_key}' no encontrada en config.STRATEGIES")

    # --- 1. PREPARACIÓN DE DATOS ---
    if 'timestamp' in df_hist.columns:
        df_hist['timestamp'] = pd.to_datetime(df_hist['timestamp'], unit='ms')
        df_hist.set_index('timestamp', inplace=True)
    
    # Ensure numeric columns
    for col in ['open', 'high', 'low', 'close', 'volume']:
        df_hist[col] = pd.to_numeric(df_hist[col], errors='coerce')

    # --- 2. CÁLCULO DE INDICADORES ---
    df_hist['ema_12'] = calculate_ema(df_hist['close'], period=config.EMA_FAST_PERIOD)
    df_hist['rsi_14'] = calculate_rsi(df_hist['close'], period=config.RSI_PERIOD)

    # Calcular SML Channel
    sml_tf = strategy_config.get('sml_timeframe', '200min')
    sml_anchor = strategy_config.get('sml_anchor_time', '13:20:00')
    
    df_sml = df_hist.resample(sml_tf, origin=sml_anchor).agg(
        {'open': 'first', 'high': 'max', 'low': 'min', 'close': 'last'}
    ).dropna()
    df_sml = calculate_sml_channel(df_sml)

    # Unir SML al dataframe principal
    df_merged = pd.merge_asof(
        df_hist.sort_index(),
        df_sml[['sml_high', 'sml_low']],
        left_index=True,
        right_index=True,
        direction='backward'
    )
    df_merged.dropna(inplace=True)
    print(f"Datos preparados. {len(df_merged)} velas listas para la simulación.")

    if len(df_merged) < 50:
        print("Datos insuficientes para backtesting.")
        return [], []

    # --- 3. BUCLE DE SIMULACIÓN ---
    initial_capital = 1000  # Capital inicial simulado en USDT
    position_size_pct = 0.02  # 2% del capital por trade
    
    trades = []
    equity = initial_capital
    equity_curve = [equity]
    current_state = {"status": "IDLE", "reasoning": "Iniciando backtest..."}
    active_trade = None

    for i in range(1, len(df_merged)):
        current_candle = df_merged.iloc[i]
        prev_candle = df_merged.iloc[i - 1]

        sml_pivots = {
            'high': current_candle.get('sml_high', float('inf')),
            'low': current_candle.get('sml_low', 0),
        }

        # --- GESTIONAR TRADE ACTIVO ---
        if active_trade:
            current_price = current_candle['close']
            current_high = current_candle['high']
            current_low = current_candle['low']

            if active_trade['type'] == 'LONG':
                # Check SL hit (use low of candle)
                if current_low <= active_trade['stop_loss']:
                    pnl = (active_trade['stop_loss'] - active_trade['entry']) * active_trade['size']
                    equity += pnl
                    active_trade['exit'] = active_trade['stop_loss']
                    active_trade['exit_time'] = str(df_merged.index[i])
                    active_trade['pnl'] = pnl
                    active_trade['result'] = 'LOSS'
                    trades.append(active_trade)
                    active_trade = None
                    current_state = {"status": "IDLE"}
                # Check TP hit (use high of candle)
                elif current_high >= active_trade['target']:
                    pnl = (active_trade['target'] - active_trade['entry']) * active_trade['size']
                    equity += pnl
                    active_trade['exit'] = active_trade['target']
                    active_trade['exit_time'] = str(df_merged.index[i])
                    active_trade['pnl'] = pnl
                    active_trade['result'] = 'WIN'
                    trades.append(active_trade)
                    active_trade = None
                    current_state = {"status": "IDLE"}

            elif active_trade['type'] == 'SHORT':
                # Check SL hit (use high of candle)
                if current_high >= active_trade['stop_loss']:
                    pnl = (active_trade['entry'] - active_trade['stop_loss']) * active_trade['size']
                    equity += pnl
                    active_trade['exit'] = active_trade['stop_loss']
                    active_trade['exit_time'] = str(df_merged.index[i])
                    active_trade['pnl'] = pnl
                    active_trade['result'] = 'LOSS'
                    trades.append(active_trade)
                    active_trade = None
                    current_state = {"status": "IDLE"}
                # Check TP hit (use low of candle)  
                elif current_low <= active_trade['target']:
                    pnl = (active_trade['entry'] - active_trade['target']) * active_trade['size']
                    equity += pnl
                    active_trade['exit'] = active_trade['target']
                    active_trade['exit_time'] = str(df_merged.index[i])
                    active_trade['pnl'] = pnl
                    active_trade['result'] = 'WIN'
                    trades.append(active_trade)
                    active_trade = None
                    current_state = {"status": "IDLE"}

        # --- EVALUAR NUEVA SEÑAL (solo si no hay trade activo) ---
        if not active_trade:
            new_state, trade_proposal = check_strategy_logic(
                current_state, current_candle, prev_candle, sml_pivots
            )
            current_state = new_state

            if trade_proposal:
                # Calculate position size
                risk_per_trade = equity * position_size_pct
                entry = trade_proposal['entry']
                sl = trade_proposal['stop_loss']
                risk_distance = abs(entry - sl)
                
                if risk_distance > 0:
                    size = risk_per_trade / risk_distance
                    active_trade = {
                        **trade_proposal,
                        'size': size,
                        'entry_time': str(df_merged.index[i]),
                    }

        equity_curve.append(equity)

    # Close any remaining open trade at last price
    if active_trade:
        last_price = df_merged.iloc[-1]['close']
        if active_trade['type'] == 'LONG':
            pnl = (last_price - active_trade['entry']) * active_trade['size']
        else:
            pnl = (active_trade['entry'] - last_price) * active_trade['size']
        equity += pnl
        active_trade['exit'] = last_price
        active_trade['exit_time'] = str(df_merged.index[-1])
        active_trade['pnl'] = pnl
        active_trade['result'] = 'OPEN_CLOSE'
        trades.append(active_trade)
        equity_curve.append(equity)

    wins = sum(1 for t in trades if t.get('pnl', 0) > 0)
    losses = sum(1 for t in trades if t.get('pnl', 0) <= 0)
    win_rate = (wins / len(trades) * 100) if trades else 0

    print(f"Backtesting completado. {len(trades)} trades | Win Rate: {win_rate:.1f}% | Equity final: ${equity:.2f}")
    return trades, equity_curve
