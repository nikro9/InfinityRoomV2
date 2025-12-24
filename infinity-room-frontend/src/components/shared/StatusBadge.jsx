// src/components/shared/StatusBadge.jsx
import { motion } from 'framer-motion';

const StatusBadge = ({ status, text }) => {
    const statusConfig = {
        bullish: {
            className: 'status-bullish',
            icon: '📈',
            label: text || 'BULLISH'
        },
        bearish: {
            className: 'status-bearish',
            icon: '📉',
            label: text || 'BEARISH'
        },
        neutral: {
            className: 'status-neutral',
            icon: '↔️',
            label: text || 'NEUTRAL'
        },
        active: {
            className: 'status-bullish',
            icon: '🟢',
            label: text || 'ACTIVE'
        },
        inactive: {
            className: 'status-neutral',
            icon: '⚪',
            label: text || 'INACTIVE'
        },
        confirmed: {
            className: 'status-bullish',
            icon: '✅',
            label: text || 'CONFIRMED'
        },
        pending: {
            className: 'status-neutral',
            icon: '⏳',
            label: text || 'PENDING'
        }
    };

    const config = statusConfig[status] || statusConfig.neutral;

    return (
        <motion.span
            className={`status-indicator ${config.className}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
        >
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </motion.span>
    );
};

export default StatusBadge;
