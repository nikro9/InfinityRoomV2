// src/components/shared/MetricCard.jsx
import { motion } from 'framer-motion';

const MetricCard = ({
    label,
    value,
    delta,
    deltaType = 'neutral', // 'positive', 'negative', 'neutral'
    icon,
    delay = 0
}) => {
    return (
        <motion.div
            className="metric-card glow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
        >
            {icon && (
                <div style={{
                    fontSize: '1.5rem',
                    marginBottom: 'var(--space-sm)',
                    opacity: 0.8
                }}>
                    {icon}
                </div>
            )}
            <p className="metric-label">{label}</p>
            <motion.p
                className="metric-value"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200 }}
            >
                {value}
            </motion.p>
            {delta && (
                <p className={`metric-delta ${deltaType}`}>
                    {deltaType === 'positive' && '↑ '}
                    {deltaType === 'negative' && '↓ '}
                    {delta}
                </p>
            )}
        </motion.div>
    );
};

export default MetricCard;
