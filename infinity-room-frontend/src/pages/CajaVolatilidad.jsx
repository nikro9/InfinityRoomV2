// src/pages/CajaVolatilidad.jsx
import { motion } from 'framer-motion';
import { GlowCard } from '../components/shared';
import { Box, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const CajaVolatilidad = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="mb-lg">
                <h1 className="text-display aurora-text" style={{ fontSize: '2rem' }}>
                    📦 Caja de Volatilidad
                </h1>
                <p className="text-muted">Estrategia para Índices - S&P 500, Nasdaq</p>
            </div>

            {/* Coming Soon Card */}
            <GlowCard className="mb-xl">
                <motion.div
                    className="text-center p-xl"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}
                        animate={{
                            rotateY: [0, 360],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 2
                        }}
                    >
                        📦
                    </motion.div>
                    <h2 className="text-display mb-md" style={{ fontSize: '1.75rem' }}>
                        Próximamente...
                    </h2>
                    <p className="text-muted mb-lg" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        Esta sección contendrá el dashboard para la nueva estrategia de "Caja de Volatilidad",
                        diseñada para operar en la apertura de mercados de índices como el S&P 500 o el Nasdaq.
                    </p>
                </motion.div>
            </GlowCard>

            {/* Strategy Overview */}
            <h3 className="text-display mb-lg" style={{ fontSize: '1.25rem' }}>
                📖 Concepto General de la Estrategia
            </h3>

            <div className="grid grid-cols-3 gap-lg">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <GlowCard>
                        <div className="flex items-center gap-md mb-md">
                            <Box size={24} style={{ color: 'var(--accent-primary)' }} />
                            <h4 className="text-display">1. Definir la "Caja"</h4>
                        </div>
                        <p className="text-muted text-sm">
                            Se identifica el rango (máximo y mínimo) de las primeras horas de la sesión de trading.
                        </p>
                    </GlowCard>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <GlowCard>
                        <div className="flex items-center gap-md mb-md">
                            <Clock size={24} style={{ color: 'var(--warning)' }} />
                            <h4 className="text-display">2. Buscar la Ruptura</h4>
                        </div>
                        <p className="text-muted text-sm">
                            El bot esperará a que el precio rompa este rango inicial con volumen confirmatorio.
                        </p>
                    </GlowCard>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <GlowCard>
                        <div className="flex items-center gap-md mb-md">
                            <TrendingUp size={24} style={{ color: 'var(--success)' }} />
                            <h4 className="text-display">3. Operar la Ruptura</h4>
                        </div>
                        <p className="text-muted text-sm">
                            Se abrirá una operación en la dirección de la ruptura, asumiendo continuación de volatilidad.
                        </p>
                    </GlowCard>
                </motion.div>
            </div>

            {/* Status Notice */}
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
                        <strong>Estado:</strong> Esta estrategia se encuentra actualmente en fase de diseño.
                        Se agregarán funcionalidades como selector de índice, conexión a Redis para un nuevo worker
                        y visualización del gráfico con la "caja" dibujada. ¡Vuelve pronto!
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CajaVolatilidad;
