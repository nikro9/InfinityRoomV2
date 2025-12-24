// src/pages/PivotsBitcoin.jsx
// Kublai Trading - BTC view with KublaiChart PRO
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import KublaiChart from '../components/charts/KublaiChart';
import MobileNavBar from '../components/layout/MobileNavBar';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';
import {
    Bot, TrendingUp, TrendingDown,
    Wifi, WifiOff, Home
} from 'lucide-react';

const PivotsBitcoin = () => {
    const [timeframe, setTimeframe] = useState('5m');
    const { candles, currentPrice, priceChange, isConnected } = useBinanceWebSocket('btcusdt', timeframe);

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
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
    const topBarHeight = 44;
    const mobileNavHeight = isMobile ? 56 : 0;
    const desktopPanelWidth = isMobile ? 0 : 200;
    const chartHeight = windowSize.height - topBarHeight - mobileNavHeight;

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0b0e11',
            overflow: 'hidden',
            paddingBottom: isMobile ? 56 : 0,
        }}>
            {/* Compact Top Bar */}
            <div style={{
                height: topBarHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 10px',
                background: '#131722',
                borderBottom: '1px solid #2a2e39',
                flexShrink: 0,
            }}>
                {/* Left: Symbol & Price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f7931a, #ffab40)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'white',
                    }}>
                        ₿
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>BTC</span>

                    <motion.span
                        key={currentPrice}
                        initial={{ scale: 1.02 }}
                        animate={{ scale: 1 }}
                        style={{
                            fontSize: 14,
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
                        gap: 3,
                        padding: '2px 5px',
                        background: priceChange >= 0 ? 'rgba(38, 166, 154, 0.15)' : 'rgba(239, 83, 80, 0.15)',
                        borderRadius: 3,
                    }}>
                        {priceChange >= 0 ? <TrendingUp size={9} color="#26a69a" /> : <TrendingDown size={9} color="#ef5350" />}
                        <span style={{ fontSize: 10, fontWeight: 600, color: priceChange >= 0 ? '#26a69a' : '#ef5350' }}>
                            {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2) || '0.00'}%
                        </span>
                    </div>
                </div>

                {/* Right: Connection */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 6px',
                    background: isConnected ? 'rgba(38, 166, 154, 0.1)' : 'rgba(239, 83, 80, 0.1)',
                    borderRadius: 4,
                }}>
                    {isConnected ? (
                        <>
                            <Wifi size={10} color="#26a69a" />
                            <span style={{ fontSize: 9, color: '#26a69a', fontWeight: 600 }}>LIVE</span>
                            <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ width: 4, height: 4, background: '#26a69a', borderRadius: '50%' }}
                            />
                        </>
                    ) : (
                        <>
                            <WifiOff size={10} color="#ef5350" />
                            <span style={{ fontSize: 9, color: '#ef5350', fontWeight: 600 }}>OFF</span>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Chart - KublaiChart PRO */}
                <div style={{ flex: 1, height: chartHeight, minWidth: 0 }}>
                    <KublaiChart
                        candles={candles}
                        height={chartHeight}
                        timeframe={timeframe}
                        onTimeframeChange={setTimeframe}
                    />
                </div>

                {/* Desktop Side Panel */}
                {!isMobile && (
                    <div style={{
                        width: desktopPanelWidth,
                        background: '#131722',
                        borderLeft: '1px solid #2a2e39',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0,
                        fontSize: 11,
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #2a2e39',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}>
                            <Bot size={12} color="#ED3237" />
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>IA Kublai</span>
                        </div>

                        {/* Levels */}
                        <div style={{ padding: 12 }}>
                            <div style={{ fontSize: 9, color: '#787b86', marginBottom: 8, fontWeight: 600, letterSpacing: 0.5 }}>
                                NIVELES CLAVE
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                <LevelRow label="Resistencia" value={currentPrice ? (currentPrice * 1.02).toFixed(0) : '-'} color="#ef5350" />
                                <LevelRow label="Precio" value={currentPrice?.toFixed(0) || '-'} color="#fff" highlight />
                                <LevelRow label="Soporte" value={currentPrice ? (currentPrice * 0.98).toFixed(0) : '-'} color="#26a69a" />
                            </div>
                        </div>

                        {/* Analysis */}
                        <div style={{ padding: '0 12px 12px' }}>
                            <div style={{ fontSize: 9, color: '#787b86', marginBottom: 6, fontWeight: 600 }}>
                                ANÁLISIS
                            </div>
                            <p style={{ fontSize: 10, color: '#d1d4dc', lineHeight: 1.4 }}>
                                {candles.length > 0
                                    ? `${priceChange > 0 ? '🟢 Alcista' : '🔴 Bajista'} · ${candles.length} velas`
                                    : 'Conectando...'}
                            </p>
                        </div>

                        <div style={{ flex: 1 }} />

                        {/* Nav */}
                        <div style={{ padding: 8, borderTop: '1px solid #2a2e39' }}>
                            <Link to="/dashboard" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 8px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 4,
                                color: '#787b86',
                                textDecoration: 'none',
                                fontSize: 10,
                            }}>
                                <Home size={10} /> Dashboard
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Nav */}
            {isMobile && <MobileNavBar position="bottom" />}
        </div>
    );
};

const LevelRow = ({ label, value, color, highlight }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: highlight ? '4px 6px' : 0,
        background: highlight ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderRadius: 3,
    }}>
        <span style={{ fontSize: 10, color: '#787b86' }}>{label}</span>
        <span style={{ fontSize: 11, color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
            ${value}
        </span>
    </div>
);

export default PivotsBitcoin;
