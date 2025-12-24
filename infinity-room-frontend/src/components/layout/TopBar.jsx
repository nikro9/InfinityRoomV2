// src/components/layout/TopBar.jsx
// TradingView-style top ticker bar with asset info and quick actions
import { motion } from 'framer-motion';
import { Star, Bell, Settings, Maximize2, MoreHorizontal } from 'lucide-react';

const TopBar = ({ symbol = 'BTC/USDT', price, change, onSettingsClick }) => {
    const isPositive = change >= 0;

    return (
        <div
            style={{
                height: 48,
                background: '#131722',
                borderBottom: '1px solid #2a2e39',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                gap: 16,
            }}
        >
            {/* Left: Symbol info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Symbol */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#d1d4dc',
                    }}>
                        {symbol}
                    </span>
                    <button
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 4,
                            cursor: 'pointer',
                            color: '#787b86',
                        }}
                    >
                        <Star size={14} />
                    </button>
                </div>

                {/* Price */}
                {price && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: isPositive ? '#26a69a' : '#ef5350',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}>
                            ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{
                            fontSize: 12,
                            color: isPositive ? '#26a69a' : '#ef5350',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}>
                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                        </span>
                    </div>
                )}

                {/* Quick stats */}
                <div style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 11,
                    color: '#787b86',
                    marginLeft: 16,
                }}>
                    <span>24h Vol: <span style={{ color: '#d1d4dc' }}>$42.5B</span></span>
                    <span>High: <span style={{ color: '#d1d4dc' }}>$87,500</span></span>
                    <span>Low: <span style={{ color: '#d1d4dc' }}>$84,200</span></span>
                </div>
            </div>

            {/* Right: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <TopBarButton icon={Bell} label="Alerts" />
                <TopBarButton icon={Settings} label="Settings" onClick={onSettingsClick} />
                <TopBarButton icon={Maximize2} label="Fullscreen" />
                <TopBarButton icon={MoreHorizontal} label="More" />
            </div>
        </div>
    );
};

const TopBarButton = ({ icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        title={label}
        style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 4,
            color: '#787b86',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = '#d1d4dc';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#787b86';
        }}
    >
        <Icon size={16} />
    </button>
);

export default TopBar;
