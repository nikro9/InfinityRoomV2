// src/pages/LogActividad.jsx
import { motion } from 'framer-motion';
import { GlowCard, LoadingSpinner } from '../components/shared';
import { useTrades } from '../hooks/useMockData';
import { ScrollText, TrendingUp, TrendingDown } from 'lucide-react';

// Mock activity log entries
const mockActivityLog = [
    '[2024-12-20 14:30:15] Análisis completado para BTC/USDT - Señal LONG detectada',
    '[2024-12-20 14:25:00] Divergencia alcista identificada en RSI',
    '[2024-12-20 14:20:45] Precio tocando nivel SML inferior',
    '[2024-12-20 14:15:30] Worker BTC iniciado correctamente',
    '[2024-12-20 14:10:00] Conectando con Redis...',
    '[2024-12-19 10:15:22] Trade propuesto: SELL @ 102,000 | SL: 102,800 | TP: 100,500',
    '[2024-12-19 10:10:00] Análisis completado para BTC/USDT - Señal SHORT detectada',
];

const LogActividad = () => {
    const { trades, isLoading } = useTrades();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="mb-lg">
                <h1 className="text-display aurora-text" style={{ fontSize: '2rem' }}>
                    📜 Log de Actividad
                </h1>
                <p className="text-muted">Historial de decisiones de la IA y propuestas de trade generadas</p>
            </div>

            {/* Trades Section */}
            <section className="mb-xl">
                <h3 className="text-display mb-md flex items-center gap-md" style={{ fontSize: '1.25rem' }}>
                    <TrendingUp size={20} style={{ color: 'var(--success)' }} />
                    Últimas Propuestas de Trade
                </h3>

                <GlowCard>
                    {isLoading ? (
                        <LoadingSpinner text="Cargando trades..." />
                    ) : trades.length === 0 ? (
                        <p className="text-muted text-center p-lg">
                            Aún no se han generado propuestas de trade.
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Tipo</th>
                                        <th>Precio de Entrada</th>
                                        <th>Stop Loss</th>
                                        <th>Take Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trades.map((trade, idx) => (
                                        <motion.tr
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
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
                                                    {trade.type === 'BUY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {trade.type}
                                                </span>
                                            </td>
                                            <td className="text-mono">${trade.entry_price.toLocaleString()}</td>
                                            <td className="text-mono" style={{ color: 'var(--danger)' }}>
                                                ${trade.stop_loss.toLocaleString()}
                                            </td>
                                            <td className="text-mono" style={{ color: 'var(--success)' }}>
                                                ${trade.take_profit.toLocaleString()}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlowCard>
            </section>

            {/* Activity Log Section */}
            <section>
                <h3 className="text-display mb-md flex items-center gap-md" style={{ fontSize: '1.25rem' }}>
                    <ScrollText size={20} style={{ color: 'var(--accent-primary)' }} />
                    Log de Razonamiento de la IA
                </h3>

                <GlowCard>
                    <div
                        style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.875rem'
                        }}
                    >
                        {mockActivityLog.length === 0 ? (
                            <p className="text-muted text-center p-lg">
                                Aún no hay registros en el log de la IA.
                            </p>
                        ) : (
                            mockActivityLog.map((log, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{
                                        padding: 'var(--space-sm) 0',
                                        borderBottom: '1px solid var(--border-color)',
                                        color: log.includes('Señal') ? 'var(--accent-secondary)' : 'var(--text-secondary)'
                                    }}
                                >
                                    {log}
                                </motion.div>
                            ))
                        )}
                    </div>
                </GlowCard>
            </section>
        </motion.div>
    );
};

export default LogActividad;
