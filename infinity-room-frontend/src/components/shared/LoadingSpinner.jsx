// src/components/shared/LoadingSpinner.jsx
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 40, text = 'Cargando...' }) => {
    return (
        <div
            className="flex flex-col items-center justify-center gap-md"
            style={{ padding: 'var(--space-xl)' }}
        >
            <motion.div
                style={{
                    width: size,
                    height: size,
                    border: '3px solid var(--bg-tertiary)',
                    borderTopColor: 'var(--accent-primary)',
                    borderRadius: '50%'
                }}
                animate={{ rotate: 360 }}
                transition={{
                    repeat: Infinity,
                    duration: 1,
                    ease: 'linear'
                }}
            />
            {text && (
                <motion.p
                    className="text-muted text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
};

export default LoadingSpinner;
