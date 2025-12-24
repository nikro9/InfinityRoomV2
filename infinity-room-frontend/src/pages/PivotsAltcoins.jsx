// src/pages/PivotsAltcoins.jsx
// Full-screen trading view for Altcoins with asset selector
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopBar from '../components/layout/TopBar';
import TradingVueWrapper from '../components/charts/TradingVueWrapper';
import { useAltcoinData } from '../hooks/useMockData';

const ALTCOIN_LIST = [
    { symbol: 'ETH/USDT', label: 'Ethereum' },
    { symbol: 'XRP/USDT', label: 'XRP' },
    { symbol: 'BNB/USDT', label: 'Binance' },
    { symbol: 'SOL/USDT', label: 'Solana' },
    { symbol: 'DOGE/USDT', label: 'Doge' },
    { symbol: 'ADA/USDT', label: 'Cardano' },
    { symbol: 'LTC/USDT', label: 'Litecoin' },
    { symbol: 'LINK/USDT', label: 'Chainlink' },
];

const PivotsAltcoins = () => {
    const [selectedAsset, setSelectedAsset] = useState('ETH/USDT');
    const { candles, status, isLoading } = useAltcoinData(selectedAsset);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentPrice = candles.length > 0 ? candles[candles.length - 1]?.close : null;
    const prevPrice = candles.length > 1 ? candles[candles.length - 2]?.close : currentPrice;
    const priceChange = currentPrice && prevPrice ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

    const chartHeight = windowHeight - 48;

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top Bar with Asset Selector */}
            <div
                style={{
                    height: 48,
                    background: '#131722',
                    borderBottom: '1px solid #2a2e39',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    gap: 12,
                }}
            >
                {/* Asset Tabs */}
                <div style={{ display: 'flex', gap: 4 }}>
                    {ALTCOIN_LIST.map(asset => (
                        <button
                            key={asset.symbol}
                            onClick={() => setSelectedAsset(asset.symbol)}
                            style={{
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 500,
                                background: selectedAsset === asset.symbol ? 'rgba(41, 98, 255, 0.2)' : 'transparent',
                                border: 'none',
                                borderRadius: 4,
                                color: selectedAsset === asset.symbol ? '#2962ff' : '#787b86',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {asset.symbol.split('/')[0]}
                        </button>
                    ))}
                </div>

                <div style={{ width: 1, height: 24, background: '#2a2e39' }} />

                {/* Price Display */}
                {currentPrice && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: priceChange >= 0 ? '#26a69a' : '#ef5350',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}>
                            ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{
                            fontSize: 11,
                            color: priceChange >= 0 ? '#26a69a' : '#ef5350',
                        }}>
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Full-Screen Chart */}
            <div style={{ flex: 1, position: 'relative' }}>
                <TradingVueWrapper
                    data={candles}
                    proposal={status?.proposal}
                    height={chartHeight}
                />

                {/* Status Overlay */}
                {status?.reasoning && (
                    <motion.div
                        key={selectedAsset + '-status'}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            maxWidth: 400,
                            padding: '12px 16px',
                            background: 'rgba(19, 23, 34, 0.95)',
                            border: '1px solid #2a2e39',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#787b86',
                            zIndex: 10,
                        }}
                    >
                        <div style={{
                            fontSize: 11,
                            color: '#2962ff',
                            marginBottom: 6,
                            fontWeight: 600,
                        }}>
                            AI ANALYSIS
                        </div>
                        {status.reasoning}
                    </motion.div>
                )}

                {/* Trade Proposal */}
                {status?.proposal && (
                    <motion.div
                        key={selectedAsset + '-proposal'}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                            padding: '12px 16px',
                            background: 'rgba(19, 23, 34, 0.95)',
                            border: '1px solid #2a2e39',
                            borderRadius: 8,
                            zIndex: 10,
                        }}
                    >
                        <div style={{
                            fontSize: 11,
                            color: status.proposal.type === 'BUY' ? '#26a69a' : '#ef5350',
                            marginBottom: 8,
                            fontWeight: 600,
                        }}>
                            {status.proposal.type} SIGNAL
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                            <div>
                                <span style={{ color: '#787b86' }}>Entry:</span>{' '}
                                <span style={{ color: '#d1d4dc', fontFamily: "'JetBrains Mono'" }}>
                                    ${status.proposal.entry_price?.toFixed(2)}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#787b86' }}>SL:</span>{' '}
                                <span style={{ color: '#ef5350', fontFamily: "'JetBrains Mono'" }}>
                                    ${status.proposal.stop_loss?.toFixed(2)}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#787b86' }}>TP:</span>{' '}
                                <span style={{ color: '#26a69a', fontFamily: "'JetBrains Mono'" }}>
                                    ${status.proposal.take_profit?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default PivotsAltcoins;
