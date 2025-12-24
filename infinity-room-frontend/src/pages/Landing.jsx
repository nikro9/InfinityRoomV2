// src/pages/Landing.jsx
// Premium marketing landing page - "WOW" factor
import { motion, useScroll, useTransform } from 'framer-motion';
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
    Star,
    Cpu,
    LineChart,
    Lock,
    Globe,
    ChevronDown,
    Play
} from 'lucide-react';
import { useRef } from 'react';

const Landing = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ container: containerRef });

    return (
        <div
            ref={containerRef}
            style={{
                height: '100vh',
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
                padding: '0 48px',
                background: 'rgba(5, 5, 5, 0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #2962ff, #00c6ff)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Cpu size={20} color="white" />
                    </div>
                    <span style={{
                        fontSize: 20,
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #fff, #888)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        NEXUS
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <a href="#features" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>Features</a>
                    <a href="#stats" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>Results</a>
                    <a href="#pricing" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>Pricing</a>
                    <Link
                        to="/dashboard"
                        style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #2962ff, #00c6ff)',
                            borderRadius: 8,
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        Launch App
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                paddingTop: 64,
            }}>
                {/* Animated Background */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
            radial-gradient(ellipse at 30% 20%, rgba(41, 98, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(0, 198, 255, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(138, 43, 226, 0.05) 0%, transparent 60%)
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

                {/* Floating Orbs */}
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
                        background: 'linear-gradient(135deg, rgba(41, 98, 255, 0.3), transparent)',
                        filter: 'blur(40px)',
                    }}
                />
                <motion.div
                    animate={{
                        y: [0, 20, 0],
                        scale: [1, 0.9, 1],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute',
                        bottom: '30%',
                        left: '10%',
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(0, 198, 255, 0.2), transparent)',
                        filter: 'blur(60px)',
                    }}
                />

                {/* Hero Content */}
                <div style={{
                    position: 'relative',
                    textAlign: 'center',
                    maxWidth: 900,
                    padding: '0 24px',
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Badge */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 16px',
                            background: 'rgba(41, 98, 255, 0.1)',
                            border: '1px solid rgba(41, 98, 255, 0.3)',
                            borderRadius: 100,
                            marginBottom: 32,
                        }}>
                            <Zap size={14} color="#2962ff" />
                            <span style={{ fontSize: 13, color: '#2962ff', fontWeight: 500 }}>
                                Powered by Advanced AI
                            </span>
                        </div>

                        {/* Main Headline */}
                        <h1 style={{
                            fontSize: 72,
                            fontWeight: 800,
                            lineHeight: 1.1,
                            marginBottom: 24,
                            background: 'linear-gradient(135deg, #fff 0%, #888 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            Trade Smarter.
                            <br />
                            <span style={{
                                background: 'linear-gradient(90deg, #2962ff, #00c6ff)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Not Harder.
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p style={{
                            fontSize: 20,
                            color: '#888',
                            maxWidth: 600,
                            margin: '0 auto 40px',
                            lineHeight: 1.6,
                        }}>
                            AI-powered trading signals that analyze markets 24/7.
                            Get professional-grade insights without the complexity.
                        </p>

                        {/* CTAs */}
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 48 }}>
                            <Link
                                to="/dashboard"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '16px 32px',
                                    background: 'linear-gradient(135deg, #2962ff, #00c6ff)',
                                    borderRadius: 12,
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontSize: 16,
                                    fontWeight: 600,
                                    boxShadow: '0 0 40px rgba(41, 98, 255, 0.4)',
                                }}
                            >
                                Start Free Trial <ArrowRight size={18} />
                            </Link>
                            <button
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '16px 32px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12,
                                    color: '#fff',
                                    fontSize: 16,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                <Play size={18} /> Watch Demo
                            </button>
                        </div>

                        {/* Trust Signals */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 32,
                            opacity: 0.6,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={14} color="#26a69a" />
                                <span style={{ fontSize: 13, color: '#888' }}>No credit card required</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={14} color="#26a69a" />
                                <span style={{ fontSize: 13, color: '#888' }}>14-day free trial</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={14} color="#26a69a" />
                                <span style={{ fontSize: 13, color: '#888' }}>Cancel anytime</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Scroll Indicator */}
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
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" style={{
                padding: '120px 48px',
                background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: 64 }}
                    >
                        <h2 style={{
                            fontSize: 14,
                            color: '#2962ff',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                            marginBottom: 16,
                        }}>
                            Real Results
                        </h2>
                        <h3 style={{
                            fontSize: 48,
                            fontWeight: 700,
                            color: '#fff',
                            marginBottom: 16,
                        }}>
                            Numbers That Speak
                        </h3>
                    </motion.div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 24,
                    }}>
                        <StatCard number="24/7" label="Market Analysis" />
                        <StatCard number="98.2%" label="Uptime" />
                        <StatCard number="72%" label="Win Rate" />
                        <StatCard number="<50ms" label="Signal Speed" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={{
                padding: '120px 48px',
                background: '#0a0a0a',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: 80 }}
                    >
                        <h2 style={{
                            fontSize: 14,
                            color: '#00c6ff',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                            marginBottom: 16,
                        }}>
                            Features
                        </h2>
                        <h3 style={{
                            fontSize: 48,
                            fontWeight: 700,
                            color: '#fff',
                            marginBottom: 24,
                        }}>
                            Everything You Need to Win
                        </h3>
                        <p style={{ fontSize: 18, color: '#666', maxWidth: 600, margin: '0 auto' }}>
                            Professional-grade trading tools powered by artificial intelligence
                        </p>
                    </motion.div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 24,
                    }}>
                        <FeatureCard
                            icon={Bot}
                            title="AI Trading Signals"
                            description="Advanced machine learning algorithms analyze market patterns and generate high-probability trade signals."
                            gradient="linear-gradient(135deg, #2962ff, #00c6ff)"
                        />
                        <FeatureCard
                            icon={LineChart}
                            title="Real-Time Analysis"
                            description="Monitor support, resistance, and market structure with live updates and instant notifications."
                            gradient="linear-gradient(135deg, #00c6ff, #26a69a)"
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Risk Management"
                            description="Smart position sizing, stop-loss, and take-profit levels calculated automatically for every trade."
                            gradient="linear-gradient(135deg, #26a69a, #00c853)"
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Pivot Detection"
                            description="Proprietary algorithms detect key support and resistance levels before price reaches them."
                            gradient="linear-gradient(135deg, #ff6b6b, #ffa502)"
                        />
                        <FeatureCard
                            icon={Clock}
                            title="24/7 Monitoring"
                            description="Never miss an opportunity. Our AI works around the clock, even while you sleep."
                            gradient="linear-gradient(135deg, #a55eea, #8854d0)"
                        />
                        <FeatureCard
                            icon={Lock}
                            title="Secure & Private"
                            description="Your API keys are encrypted. We never have access to your funds or withdrawal permissions."
                            gradient="linear-gradient(135deg, #45aaf2, #2d98da)"
                        />
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section style={{
                padding: '120px 48px',
                background: '#050505',
            }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: 80 }}
                    >
                        <h2 style={{ fontSize: 48, fontWeight: 700, color: '#fff' }}>
                            Start in 3 Simple Steps
                        </h2>
                    </motion.div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                        <StepCard
                            number="01"
                            title="Connect Your Exchange"
                            description="Link your preferred exchange using read-only API keys. Your funds stay in your control."
                        />
                        <StepCard
                            number="02"
                            title="Configure Your Strategy"
                            description="Choose your risk level, assets, and preferred indicators. Our AI adapts to your style."
                        />
                        <StepCard
                            number="03"
                            title="Start Trading"
                            description="Receive real-time signals and let the AI guide your decisions. Trade with confidence."
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{
                padding: '120px 48px',
                background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
            }}>
                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 style={{
                            fontSize: 56,
                            fontWeight: 800,
                            color: '#fff',
                            marginBottom: 24,
                            lineHeight: 1.2,
                        }}>
                            Ready to Trade
                            <br />
                            <span style={{
                                background: 'linear-gradient(90deg, #2962ff, #00c6ff)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Like a Pro?
                            </span>
                        </h2>
                        <p style={{ fontSize: 18, color: '#666', marginBottom: 40 }}>
                            Join thousands of traders who are already using NEXUS AI.
                        </p>
                        <Link
                            to="/dashboard"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '20px 48px',
                                background: 'linear-gradient(135deg, #2962ff, #00c6ff)',
                                borderRadius: 16,
                                color: 'white',
                                textDecoration: 'none',
                                fontSize: 18,
                                fontWeight: 600,
                                boxShadow: '0 0 60px rgba(41, 98, 255, 0.5)',
                            }}
                        >
                            Get Started Free <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '48px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <span style={{ color: '#444', fontSize: 13 }}>
                    © 2024 NEXUS. All rights reserved.
                </span>
                <div style={{ display: 'flex', gap: 24 }}>
                    <a href="#" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Terms</a>
                    <a href="#" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Privacy</a>
                    <a href="#" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>Contact</a>
                </div>
            </footer>

            {/* Global Styles */}
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
        </div>
    );
};

// Component: Stat Card
const StatCard = ({ number, label }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
            padding: 32,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16,
            textAlign: 'center',
        }}
    >
        <div style={{
            fontSize: 48,
            fontWeight: 800,
            background: 'linear-gradient(90deg, #2962ff, #00c6ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
        }}>
            {number}
        </div>
        <div style={{ color: '#666', fontSize: 14 }}>{label}</div>
    </motion.div>
);

// Component: Feature Card
const FeatureCard = ({ icon: Icon, title, description, gradient }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8, borderColor: 'rgba(41, 98, 255, 0.3)' }}
        style={{
            padding: 32,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16,
            transition: 'all 0.3s ease',
        }}
    >
        <div style={{
            width: 48,
            height: 48,
            background: gradient,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
        }}>
            <Icon size={24} color="white" />
        </div>
        <h4 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
            {title}
        </h4>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>
            {description}
        </p>
    </motion.div>
);

// Component: Step Card
const StepCard = ({ number, title, description }) => (
    <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 24,
            padding: 32,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16,
        }}
    >
        <div style={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #2962ff, #00c6ff)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
        }}>
            {number}
        </div>
        <div>
            <h4 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                {title}
            </h4>
            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6 }}>
                {description}
            </p>
        </div>
    </motion.div>
);

export default Landing;
