// src/pages/Landing.jsx
// Kublai Trading Platform - Premium Responsive Landing Page
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Bot,
    TrendingUp,
    Shield,
    Zap,
    Clock,
    BarChart3,
    ArrowRight,
    Check,
    MessageCircle,
    Bell,
    Smartphone,
    ChevronDown,
    Send,
    Menu,
    X
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

const Landing = () => {
    const containerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                minHeight: '100vh',
                overflowY: 'auto',
                background: '#050505',
                scrollBehavior: 'smooth',
            }}
        >
            {/* Navigation */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '0 16px' : '0 48px',
                background: 'rgba(5, 5, 5, 0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                zIndex: 100,
            }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    <img
                        src="/kublai-logo-side.svg"
                        alt="Kublai"
                        style={{ height: isMobile ? 32 : 40, filter: 'brightness(0) invert(1)' }}
                    />
                </Link>

                {/* Mobile Menu Button */}
                {isMobile ? (
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: 8,
                        }}
                    >
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                        <a href="#telegram" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>Telegram Bot</a>
                        <a href="#features" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>Features</a>
                        <a href="#stats" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>Results</a>
                        <Link
                            to="/dashboard"
                            style={{
                                padding: '10px 24px',
                                background: 'linear-gradient(135deg, #ED3237, #ff6b6b)',
                                borderRadius: 8,
                                color: 'white',
                                textDecoration: 'none',
                                fontSize: 14,
                                fontWeight: 600,
                            }}
                        >
                            Panel de Trading
                        </Link>
                    </div>
                )}
            </nav>

            {/* Mobile Menu Overlay */}
            {isMobile && menuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        position: 'fixed',
                        top: 64,
                        left: 0,
                        right: 0,
                        background: 'rgba(5, 5, 5, 0.98)',
                        padding: 24,
                        zIndex: 99,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <a href="#telegram" onClick={() => setMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontSize: 16, padding: '8px 0' }}>Telegram Bot</a>
                    <a href="#features" onClick={() => setMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontSize: 16, padding: '8px 0' }}>Features</a>
                    <a href="#stats" onClick={() => setMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none', fontSize: 16, padding: '8px 0' }}>Results</a>
                    <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #ED3237, #ff6b6b)',
                            borderRadius: 8,
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: 16,
                            fontWeight: 600,
                            textAlign: 'center',
                        }}
                    >
                        Panel de Trading
                    </Link>
                </motion.div>
            )}

            {/* Hero Section */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                paddingTop: 64,
                padding: isMobile ? '80px 16px 40px' : '64px 24px',
            }}>
                {/* Animated Background */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
            radial-gradient(ellipse at 30% 20%, rgba(237, 50, 55, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(237, 50, 55, 0.05) 0%, transparent 60%)
          `,
                }} />

                {/* Grid Pattern */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
                    backgroundSize: '60px 60px',
                }} />

                {/* Floating Orbs - Hidden on mobile */}
                {!isMobile && (
                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute',
                            top: '20%',
                            right: '15%',
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(237, 50, 55, 0.3), transparent)',
                            filter: 'blur(40px)',
                        }}
                    />
                )}

                {/* Hero Content */}
                <div style={{
                    position: 'relative',
                    textAlign: 'center',
                    maxWidth: 900,
                    width: '100%',
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Animated Logo - VISIBLE with original colors */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            style={{ marginBottom: isMobile ? 24 : 40 }}
                        >
                            <motion.img
                                src="/kublai-logo-vertical.svg"
                                alt="Kublai"
                                animate={{
                                    filter: [
                                        'drop-shadow(0 0 30px rgba(237, 50, 55, 0.5))',
                                        'drop-shadow(0 0 60px rgba(237, 50, 55, 0.8))',
                                        'drop-shadow(0 0 30px rgba(237, 50, 55, 0.5))',
                                    ],
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    height: isMobile ? 120 : 180,
                                    width: 'auto',
                                    // No filter - show original red/black colors
                                }}
                            />
                        </motion.div>

                        {/* Badge - Now AI focused */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 16px',
                            background: 'rgba(237, 50, 55, 0.1)',
                            border: '1px solid rgba(237, 50, 55, 0.3)',
                            borderRadius: 100,
                            marginBottom: isMobile ? 24 : 32,
                        }}>
                            <Bot size={14} color="#ED3237" />
                            <span style={{ fontSize: 13, color: '#ED3237', fontWeight: 500 }}>
                                Consejo de 4 IAs Especializadas
                            </span>
                        </div>

                        {/* Main Headline - AI Focus */}
                        <h1 style={{
                            fontSize: isMobile ? 36 : 64,
                            fontWeight: 800,
                            lineHeight: 1.1,
                            marginBottom: isMobile ? 16 : 24,
                            background: 'linear-gradient(135deg, #fff 0%, #ccc 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            4 Bots de IA
                            <br />
                            <span style={{
                                background: 'linear-gradient(90deg, #ED3237, #ff6b6b)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Debatiendo por Ti
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p style={{
                            fontSize: isMobile ? 16 : 20,
                            color: '#888',
                            maxWidth: 650,
                            margin: isMobile ? '0 auto 32px' : '0 auto 40px',
                            lineHeight: 1.7,
                            padding: '0 8px',
                        }}>
                            Analista de Liquidez • Analista de Setups • Analista de Momentum • Gestor de Riesgo
                            <br />
                            <span style={{ color: '#666', fontSize: isMobile ? 14 : 16 }}>
                                Operando juntos para encontrar las mejores entradas en BTC y Altcoins.
                            </span>
                        </p>

                        {/* CTAs */}
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: 16,
                            justifyContent: 'center',
                            marginBottom: isMobile ? 32 : 48,
                            padding: '0 16px',
                        }}>
                            {/* Primary CTA - View Charts */}
                            <Link
                                to="/pivots-bitcoin"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    padding: isMobile ? '14px 24px' : '16px 32px',
                                    background: 'linear-gradient(135deg, #ED3237, #ff6b6b)',
                                    borderRadius: 12,
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    boxShadow: '0 0 40px rgba(237, 50, 55, 0.4)',
                                }}
                            >
                                <BarChart3 size={18} /> Ver Panel de Trading
                            </Link>
                            {/* Secondary CTA - Telegram */}
                            <a
                                href="https://t.me/KublaiTradingBot"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    padding: isMobile ? '14px 24px' : '16px 32px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12,
                                    color: '#fff',
                                    textDecoration: 'none',
                                    fontSize: 16,
                                    fontWeight: 500,
                                }}
                            >
                                <Send size={18} /> Alertas por Telegram
                            </a>
                        </div>

                        {/* Trust Signals */}
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: isMobile ? 12 : 32,
                            opacity: 0.6,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={14} color="#26a69a" />
                                <span style={{ fontSize: 13, color: '#888' }}>100% Gratis</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={14} color="#26a69a" />
                                <span style={{ fontSize: 13, color: '#888' }}>Sin registro</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={14} color="#26a69a" />
                                <span style={{ fontSize: 13, color: '#888' }}>Señales 24/7</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Scroll Indicator - Hidden on mobile */}
                    {!isMobile && (
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                position: 'absolute',
                                bottom: -80,
                                left: '50%',
                                transform: 'translateX(-50%)',
                            }}
                        >
                            <ChevronDown size={24} color="#444" />
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Telegram Bot Section */}
            <section id="telegram" style={{
                padding: isMobile ? '60px 16px' : '120px 48px',
                background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}
                    >
                        <h2 style={{
                            fontSize: 14,
                            color: '#ED3237',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                            marginBottom: 16,
                        }}>
                            Telegram Bot
                        </h2>
                        <h3 style={{
                            fontSize: isMobile ? 28 : 48,
                            fontWeight: 700,
                            color: '#fff',
                            marginBottom: 24,
                        }}>
                            Trading Signals en tu Bolsillo
                        </h3>
                        <p style={{ fontSize: isMobile ? 16 : 18, color: '#666', maxWidth: 600, margin: '0 auto' }}>
                            Recibí alertas instantáneas cuando detectamos oportunidades de trading
                        </p>
                    </motion.div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                        gap: isMobile ? 16 : 24,
                    }}>
                        <TelegramFeature
                            icon={Bell}
                            title="Alertas Instantáneas"
                            description="Notificaciones push directas a tu celular cuando hay señales de entrada o salida."
                            isMobile={isMobile}
                        />
                        <TelegramFeature
                            icon={BarChart3}
                            title="Análisis Técnico"
                            description="Soportes, resistencias y pivotes calculados con algoritmos propietarios."
                            isMobile={isMobile}
                        />
                        <TelegramFeature
                            icon={Smartphone}
                            title="Siempre Conectado"
                            description="Funcionamos 24/7 monitoreando el mercado mientras vos descansás."
                            isMobile={isMobile}
                        />
                    </div>

                    {/* Telegram CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginTop: isMobile ? 40 : 64 }}
                    >
                        <a
                            href="https://t.me/KublaiTradingBot"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: isMobile ? '16px 32px' : '20px 40px',
                                background: '#0088cc',
                                borderRadius: 12,
                                color: 'white',
                                textDecoration: 'none',
                                fontSize: isMobile ? 16 : 18,
                                fontWeight: 600,
                                boxShadow: '0 0 40px rgba(0, 136, 204, 0.3)',
                            }}
                        >
                            <MessageCircle size={isMobile ? 20 : 24} />
                            Abrir en Telegram
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" style={{
                padding: isMobile ? '60px 16px' : '120px 48px',
                background: '#0a0a0a',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                        gap: isMobile ? 12 : 24,
                    }}>
                        <StatCard number="24/7" label="Monitoreo" isMobile={isMobile} />
                        <StatCard number="5min" label="Timeframe" isMobile={isMobile} />
                        <StatCard number="BTC" label="Activo" isMobile={isMobile} />
                        <StatCard number="Free" label="Gratuito" isMobile={isMobile} />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={{
                padding: isMobile ? '60px 16px' : '120px 48px',
                background: '#050505',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 80 }}
                    >
                        <h2 style={{
                            fontSize: 14,
                            color: '#ff6b6b',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                            marginBottom: 16,
                        }}>
                            Features
                        </h2>
                        <h3 style={{
                            fontSize: isMobile ? 28 : 48,
                            fontWeight: 700,
                            color: '#fff',
                            marginBottom: 24,
                        }}>
                            Herramientas Profesionales
                        </h3>
                    </motion.div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                        gap: isMobile ? 16 : 24,
                    }}>
                        <FeatureCard
                            icon={Bot}
                            title="IA Avanzada"
                            description="Algoritmos de machine learning analizan patrones de mercado en tiempo real."
                            gradient="linear-gradient(135deg, #ED3237, #ff6b6b)"
                            isMobile={isMobile}
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            title="Pivotes Precisos"
                            description="Detección automática de soportes y resistencias en múltiples timeframes."
                            gradient="linear-gradient(135deg, #ff6b6b, #ffa502)"
                            isMobile={isMobile}
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Risk Management"
                            description="Sugerencias de stop-loss y take-profit calculadas automáticamente."
                            gradient="linear-gradient(135deg, #26a69a, #00c853)"
                            isMobile={isMobile}
                        />
                        <FeatureCard
                            icon={Clock}
                            title="Tiempo Real"
                            description="WebSocket directo a Binance para datos tick-by-tick sin delays."
                            gradient="linear-gradient(135deg, #a55eea, #8854d0)"
                            isMobile={isMobile}
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Charts Avanzados"
                            description="Visualización profesional con indicadores técnicos configurables."
                            gradient="linear-gradient(135deg, #45aaf2, #2d98da)"
                            isMobile={isMobile}
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Alta Velocidad"
                            description="Procesamiento en milisegundos para no perderte ninguna oportunidad."
                            gradient="linear-gradient(135deg, #ffa502, #ff6b6b)"
                            isMobile={isMobile}
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{
                padding: isMobile ? '60px 16px' : '120px 48px',
                background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
            }}>
                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 style={{
                            fontSize: isMobile ? 32 : 56,
                            fontWeight: 800,
                            color: '#fff',
                            marginBottom: 24,
                            lineHeight: 1.2,
                        }}>
                            Empezá a Operar
                            <br />
                            <span style={{
                                background: 'linear-gradient(90deg, #ED3237, #ff6b6b)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                con Ventaja
                            </span>
                        </h2>
                        <p style={{ fontSize: isMobile ? 16 : 18, color: '#666', marginBottom: 40 }}>
                            Unite al bot de Telegram y recibí señales profesionales gratis.
                        </p>
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: 16,
                            justifyContent: 'center',
                        }}>
                            <a
                                href="https://t.me/KublaiTradingBot"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    padding: isMobile ? '16px 32px' : '20px 48px',
                                    background: 'linear-gradient(135deg, #ED3237, #ff6b6b)',
                                    borderRadius: 16,
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontSize: isMobile ? 16 : 18,
                                    fontWeight: 600,
                                    boxShadow: '0 0 60px rgba(237, 50, 55, 0.5)',
                                }}
                            >
                                <Send size={20} /> Unirse Gratis
                            </a>
                            <Link
                                to="/pivots-bitcoin"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    padding: isMobile ? '16px 32px' : '20px 48px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 16,
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontSize: isMobile ? 16 : 18,
                                    fontWeight: 500,
                                }}
                            >
                                <ArrowRight size={20} /> Ver Panel
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: isMobile ? '32px 16px' : '48px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: isMobile ? 16 : 0,
            }}>
                <span style={{ color: '#444', fontSize: 13 }}>
                    © 2024 Kublai Trading
                </span>
                <div style={{ display: 'flex', gap: 24 }}>
                    <a href="https://t.me/KublaiTradingBot" target="_blank" rel="noopener noreferrer" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Telegram</a>
                    <a href="#" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Privacy</a>
                </div>
            </footer>
        </div>
    );
};

// Component: Telegram Feature
const TelegramFeature = ({ icon: Icon, title, description, isMobile }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
            padding: isMobile ? 24 : 32,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16,
            textAlign: 'center',
        }}
    >
        <div style={{
            width: isMobile ? 56 : 64,
            height: isMobile ? 56 : 64,
            background: 'linear-gradient(135deg, #0088cc, #00aaee)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
        }}>
            <Icon size={isMobile ? 24 : 28} color="white" />
        </div>
        <h4 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
            {title}
        </h4>
        <p style={{ fontSize: isMobile ? 13 : 14, color: '#666', lineHeight: 1.6 }}>
            {description}
        </p>
    </motion.div>
);

// Component: Stat Card
const StatCard = ({ number, label, isMobile }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
            padding: isMobile ? 20 : 32,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16,
            textAlign: 'center',
        }}
    >
        <div style={{
            fontSize: isMobile ? 32 : 48,
            fontWeight: 800,
            background: 'linear-gradient(90deg, #ED3237, #ff6b6b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
        }}>
            {number}
        </div>
        <div style={{ color: '#666', fontSize: isMobile ? 12 : 14 }}>{label}</div>
    </motion.div>
);

// Component: Feature Card
const FeatureCard = ({ icon: Icon, title, description, gradient, isMobile }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={!isMobile ? { y: -8, borderColor: 'rgba(237, 50, 55, 0.3)' } : {}}
        style={{
            padding: isMobile ? 24 : 32,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16,
            transition: 'all 0.3s ease',
        }}
    >
        <div style={{
            width: isMobile ? 40 : 48,
            height: isMobile ? 40 : 48,
            background: gradient,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
        }}>
            <Icon size={isMobile ? 20 : 24} color="white" />
        </div>
        <h4 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
            {title}
        </h4>
        <p style={{ fontSize: isMobile ? 13 : 14, color: '#666', lineHeight: 1.6 }}>
            {description}
        </p>
    </motion.div>
);

export default Landing;
