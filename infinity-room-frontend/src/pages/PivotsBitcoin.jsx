// src/pages/PivotsBitcoin.jsx
// Full-screen trading view with REAL-TIME Binance data
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '../components/layout/TopBar';
import TradingVueWrapper from '../components/charts/TradingVueWrapper';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';
import { Bot, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

const PivotsBitcoin = () => {
    // REAL-TIME Binance WebSocket data
    const { candles, currentPrice, priceChange, isConnected } = useBinanceWebSocket('btcusdt', '5m');

    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [aiPanelExpanded, setAiPanelExpanded] = useState(true);

    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Chart takes full height minus topbar
    const chartHeight = windowHeight - 48;

    // Mock AI status for now
    const status = {
        reasoning: candles.length > 0
            ? `Analizando BTC/USDT en tiempo real. Precio actual: $${currentPrice?.toLocaleString()}. ${priceChange > 0 ? 'Tendencia alcista' : 'Tendencia bajista'} en el corto plazo.`
            : 'Conectando a Binance...',
        proposal: null,
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0b0e11' }}>
            {/* Top Bar with real price */}
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
                    {/* Connection Status */}
                    <div style={{
                        padding: '8px 16px',
                        background: isConnected ? 'rgba(38, 166, 154, 0.1)' : 'rgba(239, 83, 80, 0.1)',
                        borderBottom: '1px solid #2a2e39',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        {isConnected ? (
                            <>
                                <Wifi size={14} color="#26a69a" />
                                <span style={{ fontSize: 11, color: '#26a69a', fontWeight: 500 }}>
                                    BINANCE LIVE
                                </span>
                                <div style={{
                                    width: 6,
                                    height: 6,
                                    background: '#26a69a',
                                    borderRadius: '50%',
                                    animation: 'pulse 1s infinite',
                                }} />
                            </>
                        ) : (
                            <>
                                <WifiOff size={14} color="#ef5350" />
                                <span style={{ fontSize: 11, color: '#ef5350', fontWeight: 500 }}>
                                    DESCONECTADO
                                </span>
                            </>
                        )}
                    </div>

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
                                        {/* Analysis Text */}
                                        <div style={{
                                            fontSize: 12,
                                            color: '#d1d4dc',
                                            lineHeight: 1.6,
                                            marginBottom: 16,
                                        }}>
                                            {status?.reasoning}
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
                                                    <span style={{ color: '#ef5350', fontFamily: "'JetBrains Mono', monospace" }}>
                                                        ${currentPrice ? (currentPrice * 1.02).toLocaleString() : '-'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                    <span style={{ color: '#787b86' }}>Precio Actual</span>
                                                    <motion.span
                                                        key={currentPrice}
                                                        initial={{ backgroundColor: priceChange > 0 ? 'rgba(38, 166, 154, 0.3)' : 'rgba(239, 83, 80, 0.3)' }}
                                                        animate={{ backgroundColor: 'transparent' }}
                                                        transition={{ duration: 0.5 }}
                                                        style={{
                                                            color: '#d1d4dc',
                                                            fontFamily: "'JetBrains Mono', monospace",
                                                            padding: '2px 4px',
                                                            borderRadius: 2,
                                                        }}
                                                    >
                                                        ${currentPrice?.toLocaleString() || '-'}
                                                    </motion.span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                    <span style={{ color: '#787b86' }}>Soporte</span>
                                                    <span style={{ color: '#26a69a', fontFamily: "'JetBrains Mono', monospace" }}>
                                                        ${currentPrice ? (currentPrice * 0.98).toLocaleString() : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Live Price Ticker */}
                    <div style={{
                        padding: 16,
                        borderBottom: '1px solid #2a2e39',
                        background: 'rgba(255,255,255,0.02)',
                    }}>
                        <div style={{ fontSize: 10, color: '#787b86', marginBottom: 8 }}>PRECIO EN TIEMPO REAL</div>
                        <motion.div
                            key={currentPrice}
                            initial={{ scale: 1.05, color: priceChange > 0 ? '#26a69a' : '#ef5350' }}
                            animate={{ scale: 1, color: '#ffffff' }}
                            transition={{ duration: 0.3 }}
                            style={{
                                fontSize: 28,
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            ${currentPrice?.toLocaleString() || '-'}
                        </motion.div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 4,
                            color: priceChange > 0 ? '#26a69a' : '#ef5350',
                        }}>
                            {priceChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span style={{ fontSize: 13, fontWeight: 500 }}>
                                {priceChange > 0 ? '+' : ''}{priceChange?.toFixed(2)}%
                            </span>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                        <div style={{ fontSize: 10, color: '#787b86', marginBottom: 12, fontWeight: 600 }}>
                            ACTIVIDAD RECIENTE
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {candles.length > 0 ? (
                                <>
                                    <ActivityItem
                                        time={new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                        text={`Última vela: ${priceChange > 0 ? '🟢' : '🔴'} ${priceChange?.toFixed(2)}%`}
                                        type={priceChange > 0 ? 'bullish' : 'bearish'}
                                    />
                                    <ActivityItem
                                        time={new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                        text={`Conectado a Binance WebSocket`}
                                        type="info"
                                    />
                                    <ActivityItem
                                        time={new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                        text={`${candles.length} velas cargadas`}
                                        type="info"
                                    />
                                </>
                            ) : (
                                <ActivityItem
                                    time="--:--"
                                    text="Cargando datos históricos..."
                                    type="info"
                                />
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
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
