// src/pages/PivotsAltcoins.jsx
// Kublai Trading - Altcoins view with TradingVue (stable)
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TradingVueWrapper from '../components/charts/TradingVueWrapper';
import MobileNavBar from '../components/layout/MobileNavBar';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

const ALTCOIN_LIST = [
    { symbol: 'ethusdt', label: 'ETH' },
    { symbol: 'xrpusdt', label: 'XRP' },
    { symbol: 'bnbusdt', label: 'BNB' },
    { symbol: 'solusdt', label: 'SOL' },
    { symbol: 'dogeusdt', label: 'DOGE' },
    { symbol: 'adausdt', label: 'ADA' },
    { symbol: 'ltcusdt', label: 'LTC' },
];

const PivotsAltcoins = () => {
    const [selectedSymbol, setSelectedSymbol] = useState('ethusdt');
    const [timeframe, setTimeframe] = useState('5m');

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

    const topBarHeight = 44;
    const mobileNavHeight = isMobile ? 56 : 0;
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
            {/* Top Bar with Asset Selector */}
            <div style={{
                height: topBarHeight,
                display: 'flex',
                alignItems: 'center',
                background: '#131722',
                borderBottom: '1px solid #2a2e39',
                flexShrink: 0,
                overflowX: 'auto',
                gap: 3,
                padding: '0 6px',
            }}>
                {ALTCOIN_LIST.map(alt => (
                    <button
                        key={alt.symbol}
                        onClick={() => setSelectedSymbol(alt.symbol)}
                        style={{
                            padding: '5px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            background: selectedSymbol === alt.symbol ? 'rgba(237, 50, 55, 0.2)' : 'transparent',
                            border: selectedSymbol === alt.symbol ? '1px solid rgba(237, 50, 55, 0.4)' : '1px solid transparent',
                            borderRadius: 5,
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

            {/* Chart */}
            <AltcoinChartWrapper
                symbol={selectedSymbol}
                height={chartHeight}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
            />

            {/* Mobile Nav */}
            {isMobile && <MobileNavBar position="bottom" />}
        </div>
    );
};

// Wrapper for WebSocket per symbol
const AltcoinChartWrapper = ({ symbol, height, timeframe, onTimeframeChange }) => {
    const { candles, currentPrice, priceChange, isConnected } = useBinanceWebSocket(symbol, timeframe);

    return (
        <div style={{ flex: 1, position: 'relative' }}>
            {/* Price Badge */}
            <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 25,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(19, 23, 34, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: priceChange >= 0 ? '#26a69a' : '#ef5350',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    ${currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {priceChange >= 0 ? <TrendingUp size={10} color="#26a69a" /> : <TrendingDown size={10} color="#ef5350" />}
                    <span style={{ fontSize: 10, fontWeight: 600, color: priceChange >= 0 ? '#26a69a' : '#ef5350' }}>
                        {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2) || '0.00'}%
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {isConnected ? (
                        <>
                            <Wifi size={9} color="#26a69a" />
                            <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ width: 4, height: 4, background: '#26a69a', borderRadius: '50%' }}
                            />
                        </>
                    ) : (
                        <WifiOff size={9} color="#ef5350" />
                    )}
                </div>
            </div>

            {/* TradingVue Chart */}
            <TradingVueWrapper
                data={candles}
                height={height}
                timeframe={timeframe}
                onTimeframeChange={onTimeframeChange}
            />
        </div>
    );
};

export default PivotsAltcoins;
