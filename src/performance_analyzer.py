import pandas as pd
import numpy as np

def analyze_performance(trades, equity_curve, risk_free_rate=0.0):
    """
    Analiza el rendimiento de una estrategia de trading a partir de las operaciones
    y la curva de equidad.
    """
    if not trades:
        return {
            "Total Trades": 0, "Win Rate": "0.00%", "Profit Factor": "0.00",
            "Expectancy ($)": "$0.00", "Average Win ($)": "$0.00", "Average Loss ($)": "$0.00",
            "Sharpe Ratio": "0.00", "Calmar Ratio": "0.00", "Max Drawdown ($)": "$0.00"
        }

    df = pd.DataFrame(trades)
    total_trades = len(df)
    
    wins = df[df['pnl'] > 0]
    losses = df[df['pnl'] < 0]
    
    win_rate = (len(wins) / total_trades) * 100 if total_trades > 0 else 0
    
    gross_profit = wins['pnl'].sum()
    gross_loss = abs(losses['pnl'].sum())
    
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
    avg_win = wins['pnl'].mean() if not wins.empty else 0
    avg_loss = abs(losses['pnl'].mean()) if not losses.empty else 0
    expectancy = df['pnl'].mean()

    equity_df = pd.DataFrame(equity_curve, columns=['equity'])
    
    equity_df['running_max'] = equity_df['equity'].cummax()
    equity_df['drawdown_val'] = equity_df['running_max'] - equity_df['equity']
    max_drawdown_val = equity_df['drawdown_val'].max()
    
    returns = equity_df['equity'].pct_change().dropna()
    sharpe_ratio = (returns.mean() - risk_free_rate) / returns.std() * np.sqrt(252) if returns.std() > 0 else 0

    total_duration_days = (pd.to_datetime(df['exit_time'].max()) - pd.to_datetime(df['entry_time'].min())).days
    if total_duration_days > 0:
        annual_return = (equity_df['equity'].iloc[-1] / equity_df['equity'].iloc[0]) ** (365.0 / total_duration_days) - 1
        calmar_ratio = annual_return / (max_drawdown_val / equity_df['equity'].iloc[0]) if max_drawdown_val > 0 else float('inf')
    else:
        calmar_ratio = 0.0

    return {
        "Total Trades": total_trades, "Win Rate": f"{win_rate:.2f}%", "Profit Factor": f"{profit_factor:.2f}",
        "Expectancy ($)": f"${expectancy:.2f}", "Average Win ($)": f"${avg_win:.2f}",
        "Average Loss ($)": f"${avg_loss:.2f}", "Sharpe Ratio": f"{sharpe_ratio:.2f}",
        "Calmar Ratio": f"{calmar_ratio:.2f}", "Max Drawdown ($)": f"${max_drawdown_val:.2f}"
    }

def project_performance(user_capital, trades_df, equity_df, days_ago):
    """
    Proyecta el rendimiento para un capital de usuario basado en el rendimiento
    histórico de la estrategia en un período de tiempo determinado.
    """
    if trades_df.empty or equity_df.empty:
        return user_capital, 0

    trades_df['entry_time'] = pd.to_datetime(trades_df['entry_time'])
    
    start_date = pd.Timestamp.now() - pd.Timedelta(days=days_ago)
    
    relevant_trades = trades_df[trades_df['entry_time'] >= start_date]
    if relevant_trades.empty:
        return user_capital, 0

    first_trade_index = relevant_trades.index[0]
    
    start_equity = equity_df.iloc[first_trade_index]['equity']
    end_equity = equity_df.iloc[-1]['equity']
    
    if start_equity == 0: return user_capital, 0

    growth_percentage = (end_equity / start_equity) - 1
    
    projected_capital = user_capital * (1 + growth_percentage)
    
    return projected_capital, growth_percentage