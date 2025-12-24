// src/pages/PivotsBitcoin.jsx
// Full-screen trading view with AI panel and trade visualization
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '../components/layout/TopBar';
import TradingVueWrapper from '../components/charts/TradingVueWrapper';
import { useBitcoinData } from '../hooks/useMockData';
import { Bot, ChevronDown, ChevronUp, Target, TrendingUp, TrendingDown } from 'lucide-react';

const PivotsBitcoin = () => {
    const { candles, status, isLoading } = useBitcoinData();
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [aiPanelExpanded, setAiPanelExpanded] = useState(true);

    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentPrice = candles.length > 0 ? candles[candles.length - 1]?.close : null;
    const prevPrice = candles.length > 1 ? candles[candles.length - 2]?.close : currentPrice;
    const priceChange = currentPrice && prevPrice ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

    // Chart takes full height minus topbar
    const chartHeight = windowHeight - 48;

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0b0e11' }}>
            {/* Top Bar */}
            <TopBar
                symbol="BTC/USDT"
                price={currentPrice}
                change={priceChange}
            />

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                {/* Chart - Full Width */}
                <div style={{ flex: 1 }}>
                    <TradingVueWrapper
                        data={candles}
                        proposal={status?.proposal}
                        height={chartHeight}
                    />
                </div>

                {/* Right Panel - AI & Trade Info */}
                <motion.div
                    initial={{ x: 300 }}
                    animate={{ x: 0 }}
                    style={{
                        width: 320,
                        background: '#131722',
                        borderLeft: '1px solid #2a2e39',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {/* AI Analysis Panel */}
                    <div style={{ borderBottom: '1px solid #2a2e39' }}>
                        <button
                            onClick={() => setAiPanelExpanded(!aiPanelExpanded)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: 'rgba(41, 98, 255, 0.1)',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#2962ff',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Bot size={16} />
                                <span style={{ fontWeight: 600, fontSize: 12 }}>IA NEXUS</span>
                                <span style={{
                                    width: 8,
                                    height: 8,
                                    background: '#26a69a',
                                    borderRadius: '50%',
                                    animation: 'pulse 2s infinite',
                                }} />
                            </div>
                            {aiPanelExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <AnimatePresence>
                            {aiPanelExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div style={{ padding: 16 }}>
                                        {/* AI Status */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 12,
                                            padding: '8px 12px',
                                            background: 'rgba(38, 166, 154, 0.1)',
                                            borderRadius: 6,
                                            border: '1px solid rgba(38, 166, 154, 0.3)',
                                        }}>
                                            <div style={{
                                                width: 6,
                                                height: 6,
                                                background: '#26a69a',
                                                borderRadius: '50%',
                                            }} />
                                            <span style={{ fontSize: 11, color: '#26a69a', fontWeight: 500 }}>
                                                ANALIZANDO EN TIEMPO REAL
                                            </span>
                                        </div>

                                        {/* Analysis Text */}
                                        <div style={{
                                            fontSize: 12,
                                            color: '#d1d4dc',
                                            lineHeight: 1.6,
                                            marginBottom: 16,
                                        }}>
                                            {status?.reasoning || 'Escaneando estructura de mercado y niveles de soporte/resistencia basados en la estructura de pivotes configurada...'}
                                        </div>

                                        {/* Key Levels */}
                                        <div style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: 6,
                                            padding: 12,
                                        }}>
                                            <div style={{ fontSize: 10, color: '#787b86', marginBottom: 8, fontWeight: 600 }}>
                                                NIVELES CLAVE
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                    <span style={{ color: '#787b86' }}>Resistencia</span>
                                                    <span style={{ color: '#ef5350', fontFamily: "'JetBrains Mono'" }}>
                                                        ${(currentPrice * 1.02)?.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                    <span style={{ color: '#787b86' }}>Precio Actual</span>
                                                    <span style={{ color: '#d1d4dc', fontFamily: "'JetBrains Mono'" }}>
                                                        ${currentPrice?.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                    <span style={{ color: '#787b86' }}>Soporte</span>
                                                    <span style={{ color: '#26a69a', fontFamily: "'JetBrains Mono'" }}>
                                                        ${(currentPrice * 0.98)?.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Trade Signal Panel */}
                    {status?.proposal && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: 16,
                                borderBottom: '1px solid #2a2e39',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 12
                            }}>
                                {status.proposal.type === 'BUY' ? (
                                    <TrendingUp size={16} color="#26a69a" />
                                ) : (
                                    <TrendingDown size={16} color="#ef5350" />
                                )}
                                <span style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: status.proposal.type === 'BUY' ? '#26a69a' : '#ef5350',
                                }}>
                                    {status.proposal.type === 'BUY' ? 'SEÑAL LONG' : 'SEÑAL SHORT'}
                                </span>
                            </div>

                            {/* Trade Visualization Box */}
                            <div style={{
                                background: '#0b0e11',
                                borderRadius: 8,
                                padding: 4,
                                marginBottom: 12,
                            }}>
                                {/* Take Profit Zone */}
                                <div style={{
                                    background: 'rgba(38, 166, 154, 0.2)',
                                    borderTop: '2px solid #26a69a',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <span style={{ fontSize: 10, color: '#26a69a', fontWeight: 600 }}>TP</span>
                                    <span style={{ fontSize: 12, color: '#26a69a', fontFamily: "'JetBrains Mono'" }}>
                                        ${status.proposal.take_profit?.toLocaleString()}
                                    </span>
                                </div>

                                {/* Entry Zone */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderLeft: '2px solid #2962ff',
                                    padding: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <span style={{ fontSize: 10, color: '#2962ff', fontWeight: 600 }}>ENTRY</span>
                                    <span style={{ fontSize: 14, color: '#d1d4dc', fontWeight: 600, fontFamily: "'JetBrains Mono'" }}>
                                        ${status.proposal.entry_price?.toLocaleString()}
                                    </span>
                                </div>

                                {/* Stop Loss Zone */}
                                <div style={{
                                    background: 'rgba(239, 83, 80, 0.2)',
                                    borderBottom: '2px solid #ef5350',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <span style={{ fontSize: 10, color: '#ef5350', fontWeight: 600 }}>SL</span>
                                    <span style={{ fontSize: 12, color: '#ef5350', fontFamily: "'JetBrains Mono'" }}>
                                        ${status.proposal.stop_loss?.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Risk/Reward */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 6,
                            }}>
                                <div>
                                    <div style={{ fontSize: 10, color: '#787b86' }}>Risk/Reward</div>
                                    <div style={{ fontSize: 14, color: '#26a69a', fontWeight: 600 }}>1:2.5</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 10, color: '#787b86' }}>Probabilidad</div>
                                    <div style={{ fontSize: 14, color: '#d1d4dc', fontWeight: 600 }}>72%</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Activity Log */}
                    <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                        <div style={{ fontSize: 10, color: '#787b86', marginBottom: 12, fontWeight: 600 }}>
                            ACTIVIDAD RECIENTE
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <ActivityItem
                                time="12:45"
                                text="Nuevo nivel de resistencia detectado en $87,500"
                                type="info"
                            />
                            <ActivityItem
                                time="12:42"
                                text="Estructura de mercado: Higher High confirmado"
                                type="bullish"
                            />
                            <ActivityItem
                                time="12:38"
                                text="EMA 12 cruzó por encima de EMA 26"
                                type="bullish"
                            />
                            <ActivityItem
                                time="12:35"
                                text="Volumen incrementando en zona de soporte"
                                type="info"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
};

const ActivityItem = ({ time, text, type }) => (
    <div style={{
        fontSize: 11,
        color: '#d1d4dc',
        padding: '8px 10px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 4,
        borderLeft: `2px solid ${type === 'bullish' ? '#26a69a' :
                type === 'bearish' ? '#ef5350' : '#2962ff'
            }`,
    }}>
        <span style={{ color: '#787b86', marginRight: 8 }}>{time}</span>
        {text}
    </div>
);

export default PivotsBitcoin;
