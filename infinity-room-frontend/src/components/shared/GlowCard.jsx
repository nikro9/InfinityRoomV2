// src/components/shared/GlowCard.jsx
import { motion } from 'framer-motion';

const GlowCard = ({
    children,
    title,
    icon,
    className = '',
    delay = 0,
    onClick,
    href
}) => {
    const cardContent = (
        <motion.div
            className={`card glow ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{
                scale: 1.01,
                boxShadow: '0 0 30px rgba(73, 115, 255, 0.4)'
            }}
            onClick={onClick}
            style={{ cursor: onClick || href ? 'pointer' : 'default' }}
        >
            {(title || icon) && (
                <div className="card-header">
                    {icon && <span className="card-icon">{icon}</span>}
                    {title && <h3 className="card-title">{title}</h3>}
                </div>
            )}
            {children}
        </motion.div>
    );

    if (href) {
        return (
            <a href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                {cardContent}
            </a>
        );
    }

    return cardContent;
};

export default GlowCard;
