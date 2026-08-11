// src/pages/LogActividad.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlowCard, LoadingSpinner } from '../components/shared';
import { tradesApi } from '../services/api';
import { ScrollText, TrendingUp, TrendingDown } from 'lucide-react';

const LogActividad = () => {
    const [trades, setTrades] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [tradesRes, logsRes] = await Promise.all([
                tradesApi.getTrades(),
                tradesApi.getActivityLog()
            ]);
            
            if (tradesRes && tradesRes.trades) {
                // Filter out null proposals just in case
                setTrades(tradesRes.trades.filter(t => t && t.type));
            }
            if (logsRes && logsRes.log) {
                // Map the logs correctly since backend returns {asset: "...", entry: "[Timestamp] - reasoning"}
                setActivityLog(logsRes.log);
            }
        } catch (error) {
            console.error("Error fetching activity data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Setup polling every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

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
                <p className="text-muted">Historial de decisiones de la IA y propuestas de trade generadas (Tiempo Real)</p>
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
                                        <th>Activo</th>
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
                                            <td className="text-mono text-sm font-bold">{trade.asset}</td>
                                            <td>
                                                <span
                                                    className="status-indicator"
                                                    style={{
                                                        background: trade.type === 'BUY' || trade.type === 'LONG'
                                                            ? 'rgba(0, 200, 83, 0.15)'
                                                            : 'rgba(255, 82, 82, 0.15)',
                                                        color: trade.type === 'BUY' || trade.type === 'LONG' ? 'var(--success)' : 'var(--danger)'
                                                    }}
                                                >
                                                    {trade.type === 'BUY' || trade.type === 'LONG' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {trade.type}
                                                </span>
                                            </td>
                                            <td className="text-mono">${trade.entry_price?.toLocaleString()}</td>
                                            <td className="text-mono" style={{ color: 'var(--danger)' }}>
                                                ${trade.stop_loss?.toLocaleString()}
                                            </td>
                                            <td className="text-mono" style={{ color: 'var(--success)' }}>
                                                ${trade.take_profit?.toLocaleString()}
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
                        {isLoading ? (
                             <LoadingSpinner text="Cargando logs..." />
                        ) : activityLog.length === 0 ? (
                            <p className="text-muted text-center p-lg">
                                Aún no hay registros en el log de la IA.
                            </p>
                        ) : (
                            activityLog.map((logObj, idx) => {
                                const logStr = typeof logObj === 'string' ? logObj : `${logObj.asset} | ${logObj.entry}`;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            padding: 'var(--space-sm) 0',
                                            borderBottom: '1px solid var(--border-color)',
                                            color: logStr.includes('Señal') || logStr.includes('LONG') || logStr.includes('SHORT') ? 'var(--accent-secondary)' : 'var(--text-secondary)'
                                        }}
                                    >
                                        {logStr}
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </GlowCard>
            </section>
        </motion.div>
    );
};

export default LogActividad;
