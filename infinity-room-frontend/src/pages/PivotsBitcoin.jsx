// src/pages/PivotsBitcoin.jsx
// Kublai Trading PRO - BTC view with enhanced TradingVue
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import TradingVueWrapper from '../components/charts/TradingVueWrapper';
import MobileNavBar from '../components/layout/MobileNavBar';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';
import {
    Bot, TrendingUp, TrendingDown,
    Wifi, WifiOff, Home, MessageSquare
} from 'lucide-react';

const PivotsBitcoin = () => {
    const [timeframe, setTimeframe] = useState('5m');
    const { candles, currentPrice, priceChange, isConnected } = useBinanceWebSocket('btcusdt', timeframe);

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const isMobile = windowSize.width < 768;

    // AI thinking simulation
    const [aiThoughts, setAiThoughts] = useState([]);
    useEffect(() => {
        if (currentPrice && priceChange !== undefined) {
            setAiThoughts([
                `Precio: $${currentPrice.toFixed(0)}`,
                priceChange > 0.3 ? '📈 Momentum alcista' : priceChange < -0.3 ? '📉 Presión bajista' : '⏸️ Consolidación',
                `Cambio: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`,
            ]);
        }
    }, [currentPrice, priceChange]);

    useEffect(() => {
        const handleResize = () => setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const topBarHeight = 40;
    const mobileNavHeight = isMobile ? 56 : 0;
    const panelWidth = isMobile ? 0 : 260;
    const chartHeight = windowSize.height - topBarHeight - mobileNavHeight;

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                        initial={{ scale: 1.03 }}
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
                        <span style={{ fontSize: 12, fontWeight: 600, color: priceChange >= 0 ? '#26a69a' : '#ef5350' }}>
                            {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2) || '0.00'}%
                        </span>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: isConnected ? 'rgba(38, 166, 154, 0.1)' : 'rgba(239, 83, 80, 0.1)',
                    borderRadius: 6,
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
                            <span style={{ fontSize: 10, color: '#ef5350', fontWeight: 600 }}>OFFLINE</span>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Chart - Full width minus panel */}
                <div style={{ flex: 1, height: chartHeight, minWidth: 0 }}>
                    <TradingVueWrapper
                        data={candles}
                        height={chartHeight}
                        timeframe={timeframe}
                        onTimeframeChange={setTimeframe}
                    />
                </div>

                {/* Desktop Side Panel - IA Kublai */}
                {!isMobile && (
                    <div style={{
                        width: panelWidth,
                        background: '#131722',
                        borderLeft: '1px solid #2a2e39',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0,
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid #2a2e39',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <Bot size={16} color="#ED3237" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>IA Kublai</span>
                        </div>

                        {/* Key Levels */}
                        <div style={{ padding: 14 }}>
                            <div style={{ fontSize: 10, color: '#787b86', marginBottom: 10, fontWeight: 600 }}>
                                NIVELES CLAVE
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <LevelRow label="Resistencia" value={currentPrice ? (currentPrice * 1.02).toFixed(0) : '-'} color="#ef5350" />
                                <LevelRow label="Precio" value={currentPrice?.toFixed(0) || '-'} color="#fff" highlight />
                                <LevelRow label="Soporte" value={currentPrice ? (currentPrice * 0.98).toFixed(0) : '-'} color="#26a69a" />
                            </div>
                        </div>

                        {/* AI Thoughts Log */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{
                                padding: '8px 14px',
                                borderTop: '1px solid #2a2e39',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}>
                                <MessageSquare size={12} color="#787b86" />
                                <span style={{ fontSize: 10, color: '#787b86', fontWeight: 600 }}>ANÁLISIS IA</span>
                            </div>
                            <div style={{
                                flex: 1,
                                padding: '0 14px 14px',
                                overflowY: 'auto',
                            }}>
                                {aiThoughts.map((thought, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{
                                            padding: '6px 8px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: 4,
                                            marginBottom: 4,
                                            borderLeft: '2px solid #ED3237',
                                            fontSize: 11,
                                            color: '#d1d4dc',
                                        }}
                                    >
                                        {thought}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Dashboard Link */}
                        <div style={{ padding: 10, borderTop: '1px solid #2a2e39' }}>
                            <Link to="/dashboard" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 6,
                                color: '#787b86',
                                textDecoration: 'none',
                                fontSize: 11,
                                transition: 'all 0.2s',
                            }}>
                                <Home size={12} /> Dashboard
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {isMobile && <MobileNavBar position="bottom" />}
        </div>
    );
};

const LevelRow = ({ label, value, color, highlight }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: highlight ? '6px 10px' : '4px 0',
        background: highlight ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderRadius: 4,
    }}>
        <span style={{ fontSize: 11, color: '#787b86' }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
            ${value}
        </span>
    </div>
);

export default PivotsBitcoin;
