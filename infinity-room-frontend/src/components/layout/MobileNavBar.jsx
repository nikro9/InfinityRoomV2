// src/components/layout/MobileNavBar.jsx
// Persistent mobile navigation bar for trading pages
import { Link, useLocation } from 'react-router-dom';
import {
    Home, Bitcoin, TrendingUp, MessageCircle, Calculator, BarChart3, Menu
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/pivots-bitcoin', icon: Bitcoin, label: 'BTC' },
    { path: '/pivots-altcoins', icon: TrendingUp, label: 'Alts' },
    { path: '/chat-ia', icon: MessageCircle, label: 'IA' },
    { path: '/calculadora', icon: Calculator, label: 'Calc' },
];

const MobileNavBar = ({ position = 'bottom' }) => {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const isTop = position === 'top';

    return (
        <>
            <div style={{
                position: 'fixed',
                ...(isTop ? { top: 0 } : { bottom: 0 }),
                left: 0,
                right: 0,
                height: 56,
                background: 'rgba(19, 23, 34, 0.95)',
                backdropFilter: 'blur(20px)',
                borderTop: isTop ? 'none' : '1px solid #2a2e39',
                borderBottom: isTop ? '1px solid #2a2e39' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                zIndex: 90,
                padding: '0 8px',
            }}>
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                padding: '8px 12px',
                                textDecoration: 'none',
                                color: isActive ? '#ED3237' : '#787b86',
                                borderRadius: 8,
                                background: isActive ? 'rgba(237, 50, 55, 0.1)' : 'transparent',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Icon size={20} />
                            <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
                        </Link>
                    );
                })}

                {/* More menu button */}
                <button
                    onClick={() => setMenuOpen(true)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        color: '#787b86',
                        cursor: 'pointer',
                    }}
                >
                    <Menu size={20} />
                    <span style={{ fontSize: 10, fontWeight: 500 }}>Más</span>
                </button>
            </div>

            {/* Full Menu Overlay */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMenuOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.8)',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#131722',
                                borderRadius: 16,
                                padding: 24,
                                width: 'calc(100% - 48px)',
                                maxWidth: 320,
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 24,
                                paddingBottom: 16,
                                borderBottom: '1px solid #2a2e39',
                            }}>
                                <img
                                    src="/kublai-logo-side.svg"
                                    alt="Kublai"
                                    style={{ height: 24 }}
                                />
                                <span style={{ fontSize: 16, fontWeight: 700, color: '#ED3237' }}>
                                    Kublai
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { path: '/dashboard', label: 'Dashboard', icon: Home },
                                    { path: '/pivots-bitcoin', label: 'BTC Pivots', icon: Bitcoin },
                                    { path: '/pivots-altcoins', label: 'Altcoins', icon: TrendingUp },
                                    { path: '/caja-volatilidad', label: 'Volatilidad', icon: BarChart3 },
                                    { path: '/chat-ia', label: 'Chat IA', icon: MessageCircle },
                                    { path: '/calculadora', label: 'Calculadora', icon: Calculator },
                                ].map(item => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMenuOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '12px 16px',
                                                background: isActive ? 'rgba(237, 50, 55, 0.1)' : 'transparent',
                                                borderRadius: 8,
                                                textDecoration: 'none',
                                                color: isActive ? '#ED3237' : '#d1d4dc',
                                            }}
                                        >
                                            <Icon size={18} />
                                            <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default MobileNavBar;
