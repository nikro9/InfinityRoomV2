// src/pages/PivotsBitcoin.jsx
// Kublai Trading - Mobile-first responsive trading view
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TradingVueWrapper from '../components/charts/TradingVueWrapper';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';
import {
    Bot, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
    Wifi, WifiOff, Menu, X, Info, Star, Share2
} from 'lucide-react';

const PivotsBitcoin = () => {
    const { candles, currentPrice, priceChange, isConnected } = useBinanceWebSocket('btcusdt', '5m');

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const isMobile = windowSize.width < 768;

    useEffect(() => {
        const handleResize = () => setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Chart takes full height minus topbar
    const topBarHeight = isMobile ? 56 : 48;
    const chartHeight = windowSize.height - topBarHeight;

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0b0e11',
            overflow: 'hidden',
        }}>
            {/* Compact Top Bar */}
            <div style={{
                height: topBarHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '0 12px' : '0 16px',
                background: '#131722',
                borderBottom: '1px solid #2a2e39',
                gap: 8,
            }}>
                {/* Left: Symbol & Price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f7931a, #ffab40)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'white',
                        }}>
                            ₿
                        </div>
                        <span style={{
                            fontSize: isMobile ? 14 : 16,
                            fontWeight: 700,
                            color: '#fff',
                        }}>
                            BTC/USDT
                        </span>
                    </div>

                    {/* Price */}
                    <motion.span
                        key={currentPrice}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        style={{
                            fontSize: isMobile ? 16 : 20,
                            fontWeight: 700,
                            color: priceChange >= 0 ? '#26a69a' : '#ef5350',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        ${currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                    </motion.span>

                    {/* Change */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        background: priceChange >= 0 ? 'rgba(38, 166, 154, 0.1)' : 'rgba(239, 83, 80, 0.1)',
                        borderRadius: 4,
                    }}>
                        {priceChange >= 0 ? <TrendingUp size={12} color="#26a69a" /> : <TrendingDown size={12} color="#ef5350" />}
                        <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: priceChange >= 0 ? '#26a69a' : '#ef5350',
                        }}>
                            {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2) || '0.00'}%
                        </span>
                    </div>
                </div>

                {/* Right: Connection & Info Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Connection Status */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        background: isConnected ? 'rgba(38, 166, 154, 0.1)' : 'rgba(239, 83, 80, 0.1)',
                        borderRadius: 4,
                    }}>
                        {isConnected ? (
                            <>
                                <Wifi size={12} color="#26a69a" />
                                <span style={{ fontSize: 10, color: '#26a69a', fontWeight: 600 }}>LIVE</span>
                                <motion.div
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    style={{ width: 6, height: 6, background: '#26a69a', borderRadius: '50%' }}
                                />
                            </>
                        ) : (
                            <>
                                <WifiOff size={12} color="#ef5350" />
                                <span style={{ fontSize: 10, color: '#ef5350', fontWeight: 600 }}>OFF</span>
                            </>
                        )}
                    </div>

                    {/* Info Toggle Button */}
                    <button
                        onClick={() => setShowInfoPanel(!showInfoPanel)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            border: 'none',
                            background: showInfoPanel ? 'rgba(237, 50, 55, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: showInfoPanel ? '#ED3237' : '#d1d4dc',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {showInfoPanel ? <X size={18} /> : <Info size={18} />}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {/* Chart - FULL SCREEN */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    inset: 0,
                }}>
                    <TradingVueWrapper
                        data={candles}
                        height={chartHeight}
                        title="Kublai Charts"
                    />
                </div>

                {/* Mobile Info Panel (Overlay) */}
                <AnimatePresence>
                    {showInfoPanel && (
                        <motion.div
                            initial={{ opacity: 0, y: isMobile ? '100%' : 0, x: isMobile ? 0 : 20 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, y: isMobile ? '100%' : 0, x: isMobile ? 0 : 20 }}
                            transition={{ type: 'spring', damping: 25 }}
                            style={{
                                position: 'absolute',
                                ...(isMobile ? {
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    maxHeight: '60vh',
                                    borderTopLeftRadius: 20,
                                    borderTopRightRadius: 20,
                                } : {
                                    top: 16,
                                    right: 16,
                                    width: 300,
                                    borderRadius: 16,
                                }),
                                background: 'rgba(19, 23, 34, 0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                overflow: 'hidden',
                                zIndex: 50,
                            }}
                        >
                            {/* Panel Header */}
                            <div style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Bot size={20} color="#ED3237" />
                                    <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>IA Kublai</span>
                                </div>
                                <button
                                    onClick={() => setShowInfoPanel(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#666',
                                        cursor: 'pointer',
                                        padding: 4,
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div style={{ padding: 20, overflowY: 'auto', maxHeight: isMobile ? 'calc(60vh - 60px)' : 400 }}>
                                {/* Analysis */}
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, color: '#787b86', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Análisis en Tiempo Real
                                    </div>
                                    <p style={{ fontSize: 13, color: '#d1d4dc', lineHeight: 1.6 }}>
                                        {candles.length > 0
                                            ? `Monitoreando BTC/USDT. ${priceChange > 0 ? '🟢 Tendencia alcista' : '🔴 Tendencia bajista'} en el corto plazo.`
                                            : 'Conectando con Binance...'}
                                    </p>
                                </div>

                                {/* Key Levels */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 20,
                                }}>
                                    <div style={{ fontSize: 11, color: '#787b86', marginBottom: 12, fontWeight: 600 }}>
                                        NIVELES CLAVE
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <LevelRow
                                            label="Resistencia"
                                            value={currentPrice ? (currentPrice * 1.02).toFixed(2) : '-'}
                                            color="#ef5350"
                                        />
                                        <LevelRow
                                            label="Precio Actual"
                                            value={currentPrice?.toFixed(2) || '-'}
                                            color="#fff"
                                            highlight
                                        />
                                        <LevelRow
                                            label="Soporte"
                                            value={currentPrice ? (currentPrice * 0.98).toFixed(2) : '-'}
                                            color="#26a69a"
                                        />
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <StatBox label="Velas" value={candles.length} />
                                    <StatBox label="Timeframe" value="5m" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Bottom Bar - Quick Info */}
                {isMobile && !showInfoPanel && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 56,
                            background: 'linear-gradient(180deg, transparent, rgba(11, 14, 17, 0.9))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingBottom: 8,
                        }}
                    >
                        <button
                            onClick={() => setShowInfoPanel(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 20px',
                                background: 'rgba(237, 50, 55, 0.9)',
                                border: 'none',
                                borderRadius: 25,
                                color: 'white',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(237, 50, 55, 0.4)',
                            }}
                        >
                            <Bot size={16} /> Ver Análisis IA
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// Helper Components
const LevelRow = ({ label, value, color, highlight }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: highlight ? '8px 10px' : 0,
        background: highlight ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderRadius: 6,
    }}>
        <span style={{ fontSize: 12, color: '#787b86' }}>{label}</span>
        <span style={{
            fontSize: 13,
            color,
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace"
        }}>
            ${value}
        </span>
    </div>
);

const StatBox = ({ label, value }) => (
    <div style={{
        padding: 12,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        textAlign: 'center',
    }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{value}</div>
        <div style={{ fontSize: 10, color: '#787b86', marginTop: 4 }}>{label}</div>
    </div>
);

export default PivotsBitcoin;
