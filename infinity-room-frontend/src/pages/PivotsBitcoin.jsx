// src/pages/PivotsBitcoin.jsx
// Kublai Trading - Responsive trading view with proper layout
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import TradingVueWrapper from '../components/charts/TradingVueWrapper';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';
import {
    Bot, TrendingUp, TrendingDown,
    Wifi, WifiOff, Settings, Home, BarChart3, MessageCircle, X
} from 'lucide-react';

const PivotsBitcoin = () => {
    const { candles, currentPrice, priceChange, isConnected } = useBinanceWebSocket('btcusdt', '5m');

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const isMobile = windowSize.width < 768;

    useEffect(() => {
        const handleResize = () => setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate heights
    const topBarHeight = 48;
    const mobileBottomBarHeight = isMobile ? 60 : 0;
    const desktopPanelWidth = isMobile ? 0 : 280;
    const chartHeight = windowSize.height - topBarHeight - mobileBottomBarHeight;

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0b0e11',
            overflow: 'hidden',
        }}>
            {/* Top Bar */}
            <div style={{
                height: topBarHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                background: '#131722',
                borderBottom: '1px solid #2a2e39',
                flexShrink: 0,
            }}>
                {/* Left: Symbol & Price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>BTC/USDT</span>

                    <motion.span
                        key={currentPrice}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: priceChange >= 0 ? '#26a69a' : '#ef5350',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        ${currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                    </motion.span>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        background: priceChange >= 0 ? 'rgba(38, 166, 154, 0.15)' : 'rgba(239, 83, 80, 0.15)',
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

                {/* Right: Connection & Mobile Menu */}
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
                                    style={{ width: 5, height: 5, background: '#26a69a', borderRadius: '50%' }}
                                />
                            </>
                        ) : (
                            <>
                                <WifiOff size={12} color="#ef5350" />
                                <span style={{ fontSize: 10, color: '#ef5350', fontWeight: 600 }}>OFF</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                position: 'relative',
            }}>
                {/* Chart */}
                <div style={{
                    flex: 1,
                    height: chartHeight,
                    minWidth: 0,
                }}>
                    <TradingVueWrapper
                        data={candles}
                        height={chartHeight}
                    />
                </div>

                {/* Desktop Right Panel */}
                {!isMobile && (
                    <div style={{
                        width: desktopPanelWidth,
                        background: '#131722',
                        borderLeft: '1px solid #2a2e39',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0,
                    }}>
                        {/* Panel Header */}
                        <div style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #2a2e39',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <Bot size={16} color="#ED3237" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>IA Kublai</span>
                        </div>

                        {/* Key Levels */}
                        <div style={{ padding: 16 }}>
                            <div style={{ fontSize: 11, color: '#787b86', marginBottom: 12, fontWeight: 600, letterSpacing: 0.5 }}>
                                NIVELES CLAVE
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <LevelRow label="Resistencia" value={currentPrice ? (currentPrice * 1.02).toFixed(2) : '-'} color="#ef5350" />
                                <LevelRow label="Precio Actual" value={currentPrice?.toFixed(2) || '-'} color="#fff" highlight />
                                <LevelRow label="Soporte" value={currentPrice ? (currentPrice * 0.98).toFixed(2) : '-'} color="#26a69a" />
                            </div>
                        </div>

                        {/* Analysis */}
                        <div style={{ padding: '0 16px 16px' }}>
                            <div style={{ fontSize: 11, color: '#787b86', marginBottom: 12, fontWeight: 600, letterSpacing: 0.5 }}>
                                ANÁLISIS
                            </div>
                            <p style={{ fontSize: 12, color: '#d1d4dc', lineHeight: 1.6 }}>
                                {candles.length > 0
                                    ? `${priceChange > 0 ? '🟢 Tendencia alcista' : '🔴 Tendencia bajista'} en timeframe 5m. ${candles.length} velas cargadas.`
                                    : 'Conectando...'}
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <StatBox label="Velas" value={candles.length} />
                            <StatBox label="TF" value="5m" />
                        </div>

                        {/* Spacer */}
                        <div style={{ flex: 1 }} />

                        {/* Navigation Links */}
                        <div style={{ padding: 12, borderTop: '1px solid #2a2e39' }}>
                            <Link to="/dashboard" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 12px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 8,
                                color: '#787b86',
                                textDecoration: 'none',
                                fontSize: 12,
                            }}>
                                <Home size={14} /> Volver al Dashboard
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Bar */}
            {isMobile && (
                <div style={{
                    height: mobileBottomBarHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    background: '#131722',
                    borderTop: '1px solid #2a2e39',
                    padding: '0 16px',
                    flexShrink: 0,
                }}>
                    <Link to="/dashboard" style={{ color: '#787b86', textDecoration: 'none' }}>
                        <MobileNavItem icon={Home} label="Home" />
                    </Link>
                    <Link to="/pivots-altcoins" style={{ color: '#787b86', textDecoration: 'none' }}>
                        <MobileNavItem icon={BarChart3} label="Altcoins" />
                    </Link>
                    <MobileNavItem icon={Bot} label="IA" active onClick={() => setShowMobileMenu(true)} />
                    <Link to="/chat-ia" style={{ color: '#787b86', textDecoration: 'none' }}>
                        <MobileNavItem icon={MessageCircle} label="Chat" />
                    </Link>
                </div>
            )}

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {showMobileMenu && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowMobileMenu(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.7)',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'flex-end',
                        }}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                background: '#131722',
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                padding: 20,
                                maxHeight: '70vh',
                                overflowY: 'auto',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Bot size={20} color="#ED3237" />
                                    <span style={{ fontWeight: 700, color: '#fff' }}>IA Kublai</span>
                                </div>
                                <button onClick={() => setShowMobileMenu(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Levels */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: '#787b86', marginBottom: 12, fontWeight: 600 }}>NIVELES CLAVE</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <LevelRow label="Resistencia" value={currentPrice ? (currentPrice * 1.02).toFixed(2) : '-'} color="#ef5350" />
                                    <LevelRow label="Precio Actual" value={currentPrice?.toFixed(2) || '-'} color="#fff" highlight />
                                    <LevelRow label="Soporte" value={currentPrice ? (currentPrice * 0.98).toFixed(2) : '-'} color="#26a69a" />
                                </div>
                            </div>

                            {/* Analysis */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16 }}>
                                <div style={{ fontSize: 11, color: '#787b86', marginBottom: 12, fontWeight: 600 }}>ANÁLISIS</div>
                                <p style={{ fontSize: 13, color: '#d1d4dc', lineHeight: 1.6 }}>
                                    {candles.length > 0
                                        ? `${priceChange > 0 ? '🟢 Tendencia alcista' : '🔴 Tendencia bajista'} en timeframe 5m.`
                                        : 'Conectando a Binance...'}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper Components
const LevelRow = ({ label, value, color, highlight }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: highlight ? '6px 8px' : 0,
        background: highlight ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderRadius: 4,
    }}>
        <span style={{ fontSize: 12, color: '#787b86' }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
            ${value}
        </span>
    </div>
);

const StatBox = ({ label, value }) => (
    <div style={{
        padding: 10,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 6,
        textAlign: 'center',
    }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{value}</div>
        <div style={{ fontSize: 10, color: '#787b86', marginTop: 2 }}>{label}</div>
    </div>
);

const MobileNavItem = ({ icon: Icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: onClick ? 'pointer' : 'default',
            color: active ? '#ED3237' : '#787b86',
        }}
    >
        <Icon size={20} />
        <span style={{ fontSize: 10 }}>{label}</span>
    </div>
);

export default PivotsBitcoin;
