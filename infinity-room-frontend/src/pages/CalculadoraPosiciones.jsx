// src/pages/CalculadoraPosiciones.jsx
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GlowCard, MetricCard } from '../components/shared';
import { Calculator, DollarSign, Target, AlertTriangle } from 'lucide-react';

const CalculadoraPosiciones = () => {
    const [capitalTotal, setCapitalTotal] = useState(10000);
    const [riesgoPorcentaje, setRiesgoPorcentaje] = useState(1);
    const [precioEntrada, setPrecioEntrada] = useState(70000);
    const [precioStopLoss, setPrecioStopLoss] = useState(69500);
    const [ratioRiesgoBeneficio, setRatioRiesgoBeneficio] = useState(1.7);

    const calculations = useMemo(() => {
        if (!precioEntrada || !precioStopLoss || !capitalTotal) {
            return null;
        }

        const riesgoEnDolares = capitalTotal * (riesgoPorcentaje / 100);
        const distanciaSLPorUnidad = Math.abs(precioEntrada - precioStopLoss);

        if (distanciaSLPorUnidad === 0) {
            return null;
        }

        const tamanoPosicionUnidades = riesgoEnDolares / distanciaSLPorUnidad;
        const tamanoPosicionDolares = tamanoPosicionUnidades * precioEntrada;

        // Calculate Take Profit
        const riesgoPorUnidadTP = Math.abs(precioEntrada - precioStopLoss);
        let precioTakeProfit;

        if (precioEntrada > precioStopLoss) {
            // Long position
            precioTakeProfit = precioEntrada + (riesgoPorUnidadTP * ratioRiesgoBeneficio);
        } else {
            // Short position
            precioTakeProfit = precioEntrada - (riesgoPorUnidadTP * ratioRiesgoBeneficio);
        }

        return {
            riesgoEnDolares,
            tamanoPosicionUnidades,
            tamanoPosicionDolares,
            precioTakeProfit,
            isLong: precioEntrada > precioStopLoss
        };
    }, [capitalTotal, riesgoPorcentaje, precioEntrada, precioStopLoss, ratioRiesgoBeneficio]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="mb-lg">
                <h1 className="text-display aurora-text" style={{ fontSize: '2rem' }}>
                    🧮 Calculadora de Posiciones
                </h1>
                <p className="text-muted">Calcula el tamaño de tu operación basado en el capital y el riesgo que estás dispuesto a asumir</p>
            </div>

            {/* Input Form */}
            <GlowCard className="mb-xl">
                <h3 className="text-display mb-lg" style={{ fontSize: '1.1rem' }}>
                    📊 Parámetros de la Operación
                </h3>

                <div className="grid grid-cols-3 gap-lg">
                    {/* Column 1: Capital & Risk */}
                    <div>
                        <div className="mb-lg">
                            <label className="text-sm text-muted mb-sm flex items-center gap-sm" style={{ display: 'flex' }}>
                                <DollarSign size={14} />
                                Capital Total de la Cuenta ($)
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={capitalTotal}
                                onChange={(e) => setCapitalTotal(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={100}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-muted mb-sm flex items-center gap-sm" style={{ display: 'flex' }}>
                                <AlertTriangle size={14} />
                                Riesgo por Operación (%)
                            </label>
                            <input
                                type="range"
                                value={riesgoPorcentaje}
                                onChange={(e) => setRiesgoPorcentaje(parseFloat(e.target.value))}
                                min={0.1}
                                max={10}
                                step={0.1}
                                style={{ width: '100%' }}
                            />
                            <div className="flex justify-between text-sm text-muted mt-sm">
                                <span>0.1%</span>
                                <span className="text-mono" style={{ color: 'var(--accent-primary)' }}>
                                    {riesgoPorcentaje.toFixed(1)}%
                                </span>
                                <span>10%</span>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Entry & Stop Loss */}
                    <div>
                        <div className="mb-lg">
                            <label className="text-sm text-muted mb-sm flex items-center gap-sm" style={{ display: 'flex' }}>
                                <Target size={14} />
                                Precio de Entrada
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={precioEntrada}
                                onChange={(e) => setPrecioEntrada(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={1}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-muted mb-sm" style={{ display: 'block' }}>
                                Precio de Stop Loss
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={precioStopLoss}
                                onChange={(e) => setPrecioStopLoss(parseFloat(e.target.value) || 0)}
                                min={0}
                                step={1}
                            />
                        </div>
                    </div>

                    {/* Column 3: Risk/Reward Ratio */}
                    <div>
                        <label className="text-sm text-muted mb-sm" style={{ display: 'block' }}>
                            Ratio Riesgo/Beneficio
                        </label>
                        <input
                            type="number"
                            className="input"
                            value={ratioRiesgoBeneficio}
                            onChange={(e) => setRatioRiesgoBeneficio(parseFloat(e.target.value) || 0.1)}
                            min={0.1}
                            step={0.1}
                        />
                        <p className="text-muted text-xs mt-sm">
                            {ratioRiesgoBeneficio >= 1
                                ? `✅ Favorable: Ganas ${ratioRiesgoBeneficio}x por cada 1x de riesgo`
                                : `⚠️ Desfavorable: Ratio menor a 1:1`
                            }
                        </p>
                    </div>
                </div>
            </GlowCard>

            {/* Results */}
            {calculations ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className="text-display mb-lg" style={{ fontSize: '1.25rem' }}>
                        📋 Resultados del Cálculo
                    </h3>

                    <div className="grid grid-cols-4 gap-md">
                        <MetricCard
                            label="Riesgo Máximo por Trade"
                            value={`$${calculations.riesgoEnDolares.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                            icon="⚠️"
                            delay={0}
                        />
                        <MetricCard
                            label="Tamaño de Posición (Activo)"
                            value={calculations.tamanoPosicionUnidades.toFixed(4)}
                            icon="📊"
                            delay={0.1}
                        />
                        <MetricCard
                            label="Tamaño de Posición (USD)"
                            value={`$${calculations.tamanoPosicionDolares.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                            icon="💵"
                            delay={0.2}
                        />
                        <MetricCard
                            label="Precio Take Profit Sugerido"
                            value={`$${calculations.precioTakeProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                            icon="🎯"
                            delta={calculations.isLong ? 'LONG' : 'SHORT'}
                            deltaType={calculations.isLong ? 'positive' : 'negative'}
                            delay={0.3}
                        />
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    className="card text-center p-xl"
                    style={{ borderColor: 'var(--warning)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <p className="text-muted">
                        {precioEntrada === precioStopLoss
                            ? '⚠️ El precio de entrada y el Stop Loss no pueden ser iguales.'
                            : '📝 Ingresa los parámetros de tu operación para calcular el tamaño de la posición.'
                        }
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
};

export default CalculadoraPosiciones;
