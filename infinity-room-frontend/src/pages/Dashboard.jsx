// src/pages/Dashboard.jsx
// Modern trading platform dashboard
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
    FlaskConical
} from 'lucide-react';

const Dashboard = () => {
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
                </div>
                <p style={{ color: '#787b86', fontSize: 14 }}>
                    AI-powered trading strategies and market analysis
                </p>
            </motion.div>

            {/* Quick Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                marginBottom: 32,
            }}>
                <StatCard
                    title="BTC/USDT"
                    value="$86,911"
                    change={-0.66}
                    icon={Bitcoin}
                />
                <StatCard
                    title="ETH/USDT"
                    value="$2,941"
                    change={-1.60}
                    icon={Activity}
                />
                <StatCard
                    title="Win Rate"
                    value="68.5%"
                    change={2.3}
                    icon={TrendingUp}
                />
                <StatCard
                    title="Active Signals"
                    value="3"
                    icon={Zap}
                    highlight
                />
            </div>

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
                        status="active"
                        winRate={72}
                        to="/pivots-bitcoin"
                    />
                    <StrategyCard
                        title="Volatility Box"
                        description="Range breakout strategy for high volatility markets"
                        status="development"
                        winRate={65}
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

const StatCard = ({ title, value, change, icon: Icon, highlight }) => (
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
            <span style={{ color: '#787b86', fontSize: 12 }}>{title}</span>
            <Icon size={16} color={highlight ? '#2962ff' : '#787b86'} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#d1d4dc', fontFamily: "'JetBrains Mono'" }}>
            {value}
        </div>
        {change !== undefined && (
            <div style={{
                fontSize: 11,
                color: change >= 0 ? '#26a69a' : '#ef5350',
                marginTop: 4,
            }}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
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

const StrategyCard = ({ title, description, status, winRate, to }) => (
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
                        status === 'development' ? 'rgba(255, 171, 64, 0.2)' : 'rgba(41, 98, 255, 0.2)',
                    color: status === 'active' ? '#26a69a' :
                        status === 'development' ? '#ffab40' : '#2962ff',
                }}>
                    {status}
                </div>
                {winRate && (
                    <span style={{ color: '#26a69a', fontSize: 12, fontFamily: "'JetBrains Mono'" }}>
                        {winRate}% win
                    </span>
                )}
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
