// src/pages/PivotsAltcoins.jsx
// Kublai Trading - Altcoins view with native React KublaiChart
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import KublaiChart from '../components/charts/KublaiChart';
import MobileNavBar from '../components/layout/MobileNavBar';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

const ALTCOIN_LIST = [
    { symbol: 'ethusdt', label: 'ETH', color: '#627eea' },
    { symbol: 'xrpusdt', label: 'XRP', color: '#23292f' },
    { symbol: 'bnbusdt', label: 'BNB', color: '#f3ba2f' },
    { symbol: 'solusdt', label: 'SOL', color: '#9945ff' },
    { symbol: 'dogeusdt', label: 'DOGE', color: '#c2a633' },
    { symbol: 'adausdt', label: 'ADA', color: '#0033ad' },
    { symbol: 'ltcusdt', label: 'LTC', color: '#bfbbbb' },
];

const PivotsAltcoins = () => {
    const [selectedSymbol, setSelectedSymbol] = useState('ethusdt');

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
    const topBarHeight = 48;
    const mobileNavHeight = isMobile ? 56 : 0;
    const chartHeight = windowSize.height - topBarHeight - mobileNavHeight;

    const selectedAlt = ALTCOIN_LIST.find(a => a.symbol === selectedSymbol) || ALTCOIN_LIST[0];

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0b0e11',
            overflow: 'hidden',
            paddingBottom: isMobile ? 56 : 0,
        }}>
            {/* Top Bar with Asset Selector */}
            <div style={{
                height: topBarHeight,
                display: 'flex',
                alignItems: 'center',
                background: '#131722',
                borderBottom: '1px solid #2a2e39',
                flexShrink: 0,
                overflowX: 'auto',
                gap: 4,
                padding: '0 8px',
            }}>
                {/* Asset Tabs */}
                {ALTCOIN_LIST.map(alt => (
                    <button
                        key={alt.symbol}
                        onClick={() => setSelectedSymbol(alt.symbol)}
                        style={{
                            padding: '6px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                            background: selectedSymbol === alt.symbol ? 'rgba(237, 50, 55, 0.2)' : 'transparent',
                            border: selectedSymbol === alt.symbol ? '1px solid rgba(237, 50, 55, 0.4)' : '1px solid transparent',
                            borderRadius: 6,
                            color: selectedSymbol === alt.symbol ? '#ED3237' : '#787b86',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                    >
                        {alt.label}
                    </button>
                ))}
            </div>

            {/* Chart Area - Using KublaiChart (100% React) */}
            <AltcoinChart
                symbol={selectedSymbol}
                height={chartHeight}
            />

            {/* Mobile Navigation Bar */}
            {isMobile && <MobileNavBar position="bottom" />}
        </div>
    );
};

// Separate chart component to manage WebSocket per symbol
const AltcoinChart = ({ symbol, height }) => {
    const { candles, currentPrice, priceChange, isConnected } = useBinanceWebSocket(symbol, '5m');

    return (
        <div style={{ flex: 1, position: 'relative' }}>
            {/* Price & Connection overlay */}
            <div style={{
                position: 'absolute',
                top: 8,
                right: 70,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(19, 23, 34, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
            }}>
                <span style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: priceChange >= 0 ? '#26a69a' : '#ef5350',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    ${currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {priceChange >= 0 ? <TrendingUp size={12} color="#26a69a" /> : <TrendingDown size={12} color="#ef5350" />}
                    <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: priceChange >= 0 ? '#26a69a' : '#ef5350',
                    }}>
                        {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2) || '0.00'}%
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isConnected ? (
                        <>
                            <Wifi size={10} color="#26a69a" />
                            <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ width: 5, height: 5, background: '#26a69a', borderRadius: '50%' }}
                            />
                        </>
                    ) : (
                        <WifiOff size={10} color="#ef5350" />
                    )}
                </div>
            </div>

            {/* KublaiChart - 100% React, no Vue! */}
            <KublaiChart
                candles={candles}
                height={height}
                timeframe="5m"
                showEMA={true}
                emaPeriod={12}
            />
        </div>
    );
};

export default PivotsAltcoins;
