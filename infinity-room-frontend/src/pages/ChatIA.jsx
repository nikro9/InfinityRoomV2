// src/pages/ChatIA.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlowCard, LoadingSpinner, StatusBadge } from '../components/shared';
import { useChatLogs } from '../hooks/useMockData';
import { MessageSquare, Trash2, RefreshCw } from 'lucide-react';

const CHAT_CHANNELS = [
    { id: 'btc', name: 'Consejo Infinity (BTC)' },
    { id: 'eth', name: 'Altcoins (ETHUSDT)' },
    { id: 'sol', name: 'Altcoins (SOLUSDT)' },
];

// Parse and format AI analysis messages
const formatAnalysis = (content) => {
    const parts = [];

    // Split by analyst sections
    const sections = content.split(/(\*\*Analista.*?\*\*|\*\*DECISIÓN FINAL.*?\*\*)/);

    sections.forEach((section, idx) => {
        if (!section.trim()) return;

        if (section.startsWith('**Analista') || section.startsWith('**DECISIÓN')) {
            parts.push({ type: 'header', content: section.replace(/\*\*/g, '') });
        } else {
            // Try to parse JSON
            const jsonMatch = section.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[0]);
                    parts.push({ type: 'json', data });
                } catch {
                    parts.push({ type: 'text', content: section.trim() });
                }
            } else if (section.trim()) {
                parts.push({ type: 'text', content: section.trim() });
            }
        }
    });

    return parts;
};

const AnalysisCard = ({ data }) => {
    const keys = Object.keys(data);

    return (
        <div
            className="card mb-sm"
            style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-md)' }}
        >
            <div className="grid grid-cols-2 gap-sm">
                {data.sentiment && (
                    <div>
                        <span className="text-muted text-xs">Sentimiento:</span>
                        <StatusBadge
                            status={data.sentiment.toLowerCase()}
                            text={data.sentiment}
                        />
                    </div>
                )}
                {data.signal && (
                    <div>
                        <span className="text-muted text-xs">Señal:</span>
                        <span className="text-mono" style={{
                            color: data.signal === 'LONG' ? 'var(--success)' :
                                data.signal === 'SHORT' ? 'var(--danger)' : 'var(--warning)'
                        }}>
                            {` ${data.signal}`}
                        </span>
                    </div>
                )}
                {data.confirmation && (
                    <div>
                        <span className="text-muted text-xs">Confirmación:</span>
                        <span style={{ color: data.confirmation === 'CONFIRMED' ? 'var(--success)' : 'var(--danger)' }}>
                            {data.confirmation === 'CONFIRMED' ? ' ✅' : ' ❌'} {data.confirmation}
                        </span>
                    </div>
                )}
                {data.confidence && (
                    <div>
                        <span className="text-muted text-xs">Confianza:</span>
                        <span>{` ${data.confidence}`}</span>
                    </div>
                )}
                {data.trigger_price && (
                    <div>
                        <span className="text-muted text-xs">Precio Activación:</span>
                        <span className="text-mono">{` $${data.trigger_price}`}</span>
                    </div>
                )}
            </div>
            {data.reasoning && (
                <p className="text-sm text-muted mt-sm" style={{ fontStyle: 'italic' }}>
                    {data.reasoning}
                </p>
            )}
        </div>
    );
};

const ChatMessage = ({ entry }) => {
    const lines = entry.content.split('\n\n');
    const header = lines[0];
    const body = lines.slice(1).join('\n\n');
    const parts = formatAnalysis(body);

    return (
        <motion.div
            className="card mb-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ borderLeft: '3px solid var(--accent-primary)' }}
        >
            <div className="flex items-center gap-md mb-md">
                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                <div>
                    <p className="text-sm text-muted" style={{ fontStyle: 'italic' }}>{header}</p>
                </div>
            </div>

            {parts.map((part, idx) => {
                if (part.type === 'header') {
                    return (
                        <h4 key={idx} className="text-display mt-md mb-sm" style={{ fontSize: '1rem' }}>
                            {part.content}
                        </h4>
                    );
                }
                if (part.type === 'json') {
                    return <AnalysisCard key={idx} data={part.data} />;
                }
                if (part.type === 'text') {
                    return (
                        <div
                            key={idx}
                            className="card mb-sm"
                            style={{
                                background: 'rgba(73, 115, 255, 0.1)',
                                borderColor: 'var(--accent-primary)',
                                padding: 'var(--space-md)'
                            }}
                        >
                            <p className="text-sm">{part.content}</p>
                        </div>
                    );
                }
                return null;
            })}
        </motion.div>
    );
};

const ChatIA = () => {
    const [selectedChannel, setSelectedChannel] = useState('btc');
    const { logs, isLoading } = useChatLogs();

    const handleClearChat = () => {
        // Will call API when connected
        console.log('Clearing chat for channel:', selectedChannel);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="text-display aurora-text" style={{ fontSize: '2rem' }}>
                        💬 Chat con IA
                    </h1>
                    <p className="text-muted">Revisa el razonamiento conversacional de los diferentes workers</p>
                </div>
            </div>

            {/* Channel Selector */}
            <GlowCard className="mb-lg">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-md">
                        <MessageSquare size={20} style={{ color: 'var(--accent-primary)' }} />
                        <select
                            className="input select"
                            value={selectedChannel}
                            onChange={(e) => setSelectedChannel(e.target.value)}
                            style={{ width: 'auto', minWidth: '250px' }}
                        >
                            {CHAT_CHANNELS.map(channel => (
                                <option key={channel.id} value={channel.id}>{channel.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={handleClearChat}
                    >
                        <Trash2 size={16} />
                        Limpiar Chat
                    </button>
                </div>
            </GlowCard>

            {/* Chat Messages */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {isLoading ? (
                    <LoadingSpinner text="Cargando mensajes..." />
                ) : logs.length === 0 ? (
                    <motion.div
                        className="card text-center p-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p className="text-muted">No hay mensajes en este canal.</p>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        {logs.map((entry, idx) => (
                            <ChatMessage key={idx} entry={entry} />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
};

export default ChatIA;
