// src/pages/Backtesting.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlowCard, LoadingSpinner, MetricCard } from '../components/shared';
import { Rocket, Play, TrendingUp, TrendingDown } from 'lucide-react';

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];

const Backtesting = () => {
    const [symbol, setSymbol] = useState('BTC/USDT');
    const [days, setDays] = useState(30);
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState(null);

    const runBacktest = () => {
        setIsRunning(true);
        setResults(null);

        // Simulate backtest execution
        setTimeout(() => {
            // Generate mock results
            const mockTrades = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
                timestamp: new Date(Date.now() - (i * 86400000)).toISOString().split('T')[0],
                type: Math.random() > 0.5 ? 'BUY' : 'SELL',
                entry_price: 100000 + (Math.random() - 0.5) * 5000,
                stop_loss: 99000 + (Math.random() - 0.5) * 2000,
                take_profit: 102000 + (Math.random() - 0.5) * 2000,
                result: Math.random() > 0.4 ? 'WIN' : 'LOSS',
                pnl: (Math.random() - 0.3) * 500
            }));

            setResults({
                trades: mockTrades,
                totalTrades: mockTrades.length,
                wins: mockTrades.filter(t => t.result === 'WIN').length,
                losses: mockTrades.filter(t => t.result === 'LOSS').length,
                totalPnL: mockTrades.reduce((acc, t) => acc + t.pnl, 0)
            });
            setIsRunning(false);
        }, 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="mb-lg">
                <h1 className="text-display aurora-text" style={{ fontSize: '2rem' }}>
                    🚀 Backtesting
                </h1>
                <p className="text-muted">Simula el rendimiento de tu estrategia de scalping en 5 minutos sobre datos históricos</p>
            </div>

            {/* Controls */}
            <GlowCard className="mb-lg">
                <h3 className="text-display mb-lg" style={{ fontSize: '1.1rem' }}>
                    ⚙️ Controles de Simulación
                </h3>

                <div className="grid grid-cols-3 gap-lg mb-lg">
                    <div>
                        <label className="text-sm text-muted mb-sm" style={{ display: 'block' }}>Activo</label>
                        <select
                            className="input select"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                        >
                            {SYMBOLS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-muted mb-sm" style={{ display: 'block' }}>
                            Período de Backtest (días)
                        </label>
                        <input
                            type="number"
                            className="input"
                            value={days}
                            onChange={(e) => setDays(Math.max(10, Math.min(730, parseInt(e.target.value) || 10)))}
                            min={10}
                            max={730}
                            step={10}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <motion.button
                            className="btn btn-primary btn-lg w-full"
                            onClick={runBacktest}
                            disabled={isRunning}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isRunning ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    >
                                        <Rocket size={18} />
                                    </motion.div>
                                    Ejecutando...
                                </>
                            ) : (
                                <>
                                    <Play size={18} />
                                    Ejecutar Simulación
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                <p className="text-muted text-sm">
                    <strong>Nota:</strong> Temporalidad fija en 5m. El backtest utiliza la estrategia de pivots con análisis de IA.
                </p>
            </GlowCard>

            {/* Loading */}
            {isRunning && (
                <GlowCard className="mb-lg">
                    <LoadingSpinner text={`Obteniendo ${days} días de datos para ${symbol}... Ejecutando simulación vela por vela con la IA...`} />
                </GlowCard>
            )}

            {/* Results */}
            {results && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-display mb-lg" style={{ fontSize: '1.25rem' }}>
                        📊 Resultados de la Simulación
                    </h3>

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-4 gap-md mb-lg">
                        <MetricCard
                            label="Total de Trades"
                            value={results.totalTrades}
                            icon="📈"
                            delay={0}
                        />
                        <MetricCard
                            label="Trades Ganadores"
                            value={results.wins}
                            deltaType="positive"
                            icon="✅"
                            delay={0.1}
                        />
                        <MetricCard
                            label="Trades Perdedores"
                            value={results.losses}
                            deltaType="negative"
                            icon="❌"
                            delay={0.2}
                        />
                        <MetricCard
                            label="P&L Total"
                            value={`$${results.totalPnL.toFixed(2)}`}
                            deltaType={results.totalPnL >= 0 ? 'positive' : 'negative'}
                            icon="💰"
                            delay={0.3}
                        />
                    </div>

                    {/* Trades Table */}
                    <GlowCard>
                        <h4 className="text-display mb-md">Log de Trades Propuestos por la IA</h4>

                        {results.trades.length === 0 ? (
                            <p className="text-muted text-center p-lg">
                                La IA no generó ninguna propuesta de trade en el período de backtest seleccionado.
                            </p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Tipo</th>
                                            <th>Entrada</th>
                                            <th>Stop Loss</th>
                                            <th>Take Profit</th>
                                            <th>Resultado</th>
                                            <th>P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.trades.map((trade, idx) => (
                                            <motion.tr
                                                key={idx}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <td className="text-mono text-sm">{trade.timestamp}</td>
                                                <td>
                                                    <span
                                                        className="status-indicator"
                                                        style={{
                                                            background: trade.type === 'BUY'
                                                                ? 'rgba(0, 200, 83, 0.15)'
                                                                : 'rgba(255, 82, 82, 0.15)',
                                                            color: trade.type === 'BUY' ? 'var(--success)' : 'var(--danger)'
                                                        }}
                                                    >
                                                        {trade.type}
                                                    </span>
                                                </td>
                                                <td className="text-mono">${trade.entry_price.toFixed(2)}</td>
                                                <td className="text-mono" style={{ color: 'var(--danger)' }}>
                                                    ${trade.stop_loss.toFixed(2)}
                                                </td>
                                                <td className="text-mono" style={{ color: 'var(--success)' }}>
                                                    ${trade.take_profit.toFixed(2)}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        color: trade.result === 'WIN' ? 'var(--success)' : 'var(--danger)'
                                                    }}>
                                                        {trade.result === 'WIN' ? '✅ WIN' : '❌ LOSS'}
                                                    </span>
                                                </td>
                                                <td className="text-mono" style={{
                                                    color: trade.pnl >= 0 ? 'var(--success)' : 'var(--danger)'
                                                }}>
                                                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </GlowCard>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Backtesting;
