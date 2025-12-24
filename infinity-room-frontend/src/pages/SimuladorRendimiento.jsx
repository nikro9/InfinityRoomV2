// src/pages/SimuladorRendimiento.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlowCard, MetricCard, LoadingSpinner } from '../components/shared';
import { usePerformance } from '../hooks/useMockData';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const SimuladorRendimiento = () => {
    const [capital, setCapital] = useState(10000);
    const { data: projections, isLoading } = usePerformance(capital);

    const periodLabels = {
        30: '30 días',
        60: '60 días',
        90: '90 días',
        180: '6 meses',
        365: '1 año'
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
                    📝 Simulador de Rendimiento
                </h1>
                <p className="text-muted">Calcula cómo se hubiera comportado tu capital con la estrategia histórica del bot</p>
            </div>

            {/* Capital Input */}
            <GlowCard className="mb-xl">
                <div className="flex items-center gap-lg">
                    <DollarSign size={24} style={{ color: 'var(--accent-primary)' }} />
                    <div style={{ flex: 1 }}>
                        <label className="text-sm text-muted mb-sm" style={{ display: 'block' }}>
                            Ingresa tu capital inicial ($)
                        </label>
                        <input
                            type="number"
                            className="input"
                            value={capital}
                            onChange={(e) => setCapital(Math.max(100, parseFloat(e.target.value) || 0))}
                            min={100}
                            step={500}
                            style={{ maxWidth: '300px' }}
                        />
                    </div>
                    <p className="text-muted text-sm" style={{ maxWidth: '300px' }}>
                        Escribe la cantidad con la que te gustaría simular la estrategia.
                    </p>
                </div>
            </GlowCard>

            {/* Projections */}
            {isLoading ? (
                <LoadingSpinner text="Calculando proyecciones..." />
            ) : projections ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-display mb-lg flex items-center gap-md" style={{ fontSize: '1.25rem' }}>
                        <TrendingUp size={20} style={{ color: 'var(--success)' }} />
                        Proyección de Rendimiento
                    </h3>

                    <div className="grid grid-cols-5 gap-md">
                        {projections.map((proj, idx) => (
                            <MetricCard
                                key={proj.days}
                                label={periodLabels[proj.days]}
                                value={`$${proj.finalCapital.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}`}
                                delta={`${(proj.growth * 100).toFixed(2)}%`}
                                deltaType={proj.growth >= 0 ? 'positive' : 'negative'}
                                delay={idx * 0.1}
                            />
                        ))}
                    </div>
                </motion.div>
            ) : null}

            {/* Disclaimer */}
            <motion.div
                className="card mt-xl"
                style={{
                    background: 'rgba(255, 171, 64, 0.1)',
                    borderColor: 'var(--warning)'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="flex items-center gap-md">
                    <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                    <p className="text-sm">
                        <strong>Nota:</strong> Los rendimientos pasados no garantizan resultados futuros.
                        Esta es una simulación basada en datos históricos. Invierte responsablemente.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SimuladorRendimiento;
