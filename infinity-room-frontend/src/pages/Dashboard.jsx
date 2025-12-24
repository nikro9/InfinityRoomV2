// src/pages/Dashboard.jsx
// Modern trading platform dashboard with LIVE data
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Zap,
    ArrowRight,
    Bitcoin,
    Layers,
    Bot,
    Calculator,
    FlaskConical,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { useMultiSymbolPrice } from '../hooks/useBinanceWebSocket';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const Dashboard = () => {
    // Live prices from Binance WebSocket
    const prices = useMultiSymbolPrice(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT']);
    
    // Backend status
    const [btcStatus, setBtcStatus] = useState(null);
    const [apiOnline, setApiOnline] = useState(false);

    // Poll backend status every 30s
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_BASE}/btc/status`);
                if (res.ok) {
                    const data = await res.json();
                    setBtcStatus(data);
                    setApiOnline(true);
                } else {
                    setApiOnline(false);
                }
            } catch {
                setApiOnline(false);
            }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const btcPrice = prices.BTCUSDT;
    const ethPrice = prices.ETHUSDT;
    const solPrice = prices.SOLUSDT;

    const activeSignals = btcStatus?.proposal ? 1 : 0;
    const workerStatus = btcStatus?.status || 'OFFLINE';

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0b0e11',
            padding: 24,
        }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 32 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Layers size={28} color="#2962ff" />
                    <h1 style={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: '#d1d4dc',
                        letterSpacing: '-0.5px'
                    }}>
                        KUBLAI Trading Platform
                    </h1>
                    {/* API Status indicator */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginLeft: 'auto',
                        padding: '4px 10px',
                        borderRadius: 4,
                        background: apiOnline ? 'rgba(38, 166, 154, 0.1)' : 'rgba(239, 83, 80, 0.1)',
                        border: `1px solid ${apiOnline ? 'rgba(38, 166, 154, 0.3)' : 'rgba(239, 83, 80, 0.3)'}`,
                    }}>
                        {apiOnline ? <Wifi size={14} color="#26a69a" /> : <WifiOff size={14} color="#ef5350" />}
                        <span style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: apiOnline ? '#26a69a' : '#ef5350',
                        }}>
                            {apiOnline ? 'API Online' : 'API Offline'}
                        </span>
                    </div>
                </div>
                <p style={{ color: '#787b86', fontSize: 14 }}>
                    AI-powered trading strategies and market analysis
                </p>
            </motion.div>

            {/* Live Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                marginBottom: 32,
            }}>
                <StatCard
                    title="BTC/USDT"
                    value={btcPrice ? `$${btcPrice.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'Loading...'}
                    change={btcPrice?.change}
                    icon={Bitcoin}
                    live
                />
                <StatCard
                    title="ETH/USDT"
                    value={ethPrice ? `$${ethPrice.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'Loading...'}
                    change={ethPrice?.change}
                    icon={Activity}
                    live
                />
                <StatCard
                    title="Worker Status"
                    value={workerStatus}
                    icon={TrendingUp}
                    statusColor={workerStatus === 'PROPOSAL' ? '#26a69a' : workerStatus === 'IDLE' ? '#787b86' : '#ef5350'}
                />
                <StatCard
                    title="Active Signals"
                    value={String(activeSignals)}
                    icon={Zap}
                    highlight={activeSignals > 0}
                />
            </div>

            {/* Active Signal Banner */}
            {btcStatus?.proposal && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'rgba(41, 98, 255, 0.1)',
                        border: '1px solid rgba(41, 98, 255, 0.3)',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 24,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                    }}
                >
                    <Zap size={24} color="#2962ff" />
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#d1d4dc', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                            🚨 Active Signal: BTC/USDT {btcStatus.proposal.type}
                        </div>
                        <div style={{ color: '#787b86', fontSize: 12 }}>
                            Entry: ${btcStatus.proposal.entry_price?.toLocaleString()} | 
                            SL: ${btcStatus.proposal.stop_loss?.toLocaleString()} | 
                            TP: ${btcStatus.proposal.take_profit?.toLocaleString()}
                        </div>
                    </div>
                    <Link to="/pivots-bitcoin" style={{ textDecoration: 'none' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            style={{
                                padding: '8px 16px',
                                background: '#2962ff',
                                border: 'none',
                                borderRadius: 6,
                                color: 'white',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            View Signal →
                        </motion.button>
                    </Link>
                </motion.div>
            )}

            {/* Quick Actions */}
            <div style={{ marginBottom: 32 }}>
                <h2 style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#787b86',
                    marginBottom: 16,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Quick Access
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                }}>
                    <QuickAction to="/pivots-bitcoin" icon={Bitcoin} label="BTC Pivots" desc="Live trading signals" />
                    <QuickAction to="/pivots-altcoins" icon={TrendingUp} label="Altcoins" desc="Multi-asset analysis" />
                    <QuickAction to="/chat-ia" icon={Bot} label="AI Chat" desc="Ask trading questions" />
                    <QuickAction to="/calculadora" icon={Calculator} label="Calculator" desc="Position sizing" />
                </div>
            </div>

            {/* Strategy Cards */}
            <div>
                <h2 style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#787b86',
                    marginBottom: 16,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Strategies
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16,
                }}>
                    <StrategyCard
                        title="Pivot Points Strategy"
                        description="AI-driven support and resistance trading with automated entries"
                        status={apiOnline && workerStatus !== 'OFFLINE' ? 'active' : 'offline'}
                        to="/pivots-bitcoin"
                    />
                    <StrategyCard
                        title="Volatility Box"
                        description="Range breakout strategy for high volatility markets"
                        status="development"
                        to="/caja-volatilidad"
                    />
                    <StrategyCard
                        title="Backtesting Lab"
                        description="Test strategies against historical data"
                        status="ready"
                        to="/backtesting"
                    />
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, change, icon: Icon, highlight, live, statusColor }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
            background: highlight ? 'rgba(41, 98, 255, 0.1)' : '#131722',
            border: `1px solid ${highlight ? '#2962ff' : '#2a2e39'}`,
            borderRadius: 8,
            padding: 16,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#787b86', fontSize: 12 }}>
                {title}
                {live && (
                    <span style={{
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#26a69a',
                        marginLeft: 6,
                        animation: 'pulse 2s infinite',
                    }} />
                )}
            </span>
            <Icon size={16} color={highlight ? '#2962ff' : '#787b86'} />
        </div>
        <div style={{
            fontSize: 20,
            fontWeight: 600,
            color: statusColor || '#d1d4dc',
            fontFamily: "'JetBrains Mono'"
        }}>
            {value}
        </div>
        {change !== undefined && change !== null && (
            <div style={{
                fontSize: 11,
                color: change >= 0 ? '#26a69a' : '#ef5350',
                marginTop: 4,
            }}>
                {change >= 0 ? '+' : ''}{parseFloat(change).toFixed(2)}%
            </div>
        )}
    </motion.div>
);

const QuickAction = ({ to, icon: Icon, label, desc }) => (
    <Link to={to} style={{ textDecoration: 'none' }}>
        <motion.div
            whileHover={{ scale: 1.02, borderColor: '#2962ff' }}
            style={{
                background: '#131722',
                border: '1px solid #2a2e39',
                borderRadius: 8,
                padding: 16,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
            }}
        >
            <Icon size={20} color="#2962ff" style={{ marginBottom: 8 }} />
            <div style={{ color: '#d1d4dc', fontSize: 13, fontWeight: 500 }}>{label}</div>
            <div style={{ color: '#787b86', fontSize: 11 }}>{desc}</div>
        </motion.div>
    </Link>
);

const StrategyCard = ({ title, description, status, to }) => (
    <Link to={to} style={{ textDecoration: 'none' }}>
        <motion.div
            whileHover={{ scale: 1.01, borderColor: '#2962ff' }}
            style={{
                background: '#131722',
                border: '1px solid #2a2e39',
                borderRadius: 8,
                padding: 20,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                height: '100%',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    background: status === 'active' ? 'rgba(38, 166, 154, 0.2)' :
                        status === 'development' ? 'rgba(255, 171, 64, 0.2)' :
                        status === 'offline' ? 'rgba(239, 83, 80, 0.2)' : 'rgba(41, 98, 255, 0.2)',
                    color: status === 'active' ? '#26a69a' :
                        status === 'development' ? '#ffab40' :
                        status === 'offline' ? '#ef5350' : '#2962ff',
                }}>
                    {status}
                </div>
            </div>
            <h3 style={{ color: '#d1d4dc', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{title}</h3>
            <p style={{ color: '#787b86', fontSize: 12, lineHeight: 1.5 }}>{description}</p>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 16,
                color: '#2962ff',
                fontSize: 12,
                fontWeight: 500,
            }}>
                Open <ArrowRight size={14} />
            </div>
        </motion.div>
    </Link>
);

export default Dashboard;
