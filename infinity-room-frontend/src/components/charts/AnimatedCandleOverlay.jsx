// src/components/charts/AnimatedCandleOverlay.jsx
// Smooth CSS-animated candle overlay for real-time price updates
import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Animated overlay that shows the current forming candle with smooth transitions
 * This sits on top of the chart and provides fluid animations
 */
const AnimatedCandleOverlay = memo(({
    currentCandle,
    previousClose,
    containerWidth = 800,
    containerHeight = 400,
    priceRange = { min: 0, max: 100000 },
}) => {
    if (!currentCandle) return null;

    const { open, high, low, close } = currentCandle;
    const isGreen = close >= open;

    // Calculate pixel positions
    const priceToY = (price) => {
        const range = priceRange.max - priceRange.min;
        if (range === 0) return containerHeight / 2;
        return containerHeight - ((price - priceRange.min) / range) * containerHeight;
    };

    const bodyTop = priceToY(Math.max(open, close));
    const bodyBottom = priceToY(Math.min(open, close));
    const bodyHeight = Math.max(bodyBottom - bodyTop, 2);
    const wickTop = priceToY(high);
    const wickBottom = priceToY(low);

    const candleWidth = 12;
    const candleX = containerWidth - 50; // Position near right edge

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 5,
            }}
        >
            {/* Current Price Line */}
            <motion.div
                animate={{ y: priceToY(close) }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 60,
                    height: 1,
                    background: isGreen
                        ? 'linear-gradient(90deg, transparent, rgba(38, 166, 154, 0.5), #26a69a)'
                        : 'linear-gradient(90deg, transparent, rgba(239, 83, 80, 0.5), #ef5350)',
                }}
            />

            {/* Price Label */}
            <motion.div
                animate={{
                    y: priceToY(close) - 10,
                    backgroundColor: isGreen ? '#26a69a' : '#ef5350',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                    position: 'absolute',
                    right: 0,
                    padding: '4px 8px',
                    borderRadius: 4,
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    minWidth: 70,
                    textAlign: 'center',
                }}
            >
                {close?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </motion.div>

            {/* Animated Candle Wick */}
            <motion.div
                animate={{
                    top: wickTop,
                    height: wickBottom - wickTop,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                style={{
                    position: 'absolute',
                    left: candleX + candleWidth / 2 - 1,
                    width: 2,
                    background: isGreen ? '#26a69a' : '#ef5350',
                    borderRadius: 1,
                }}
            />

            {/* Animated Candle Body */}
            <motion.div
                animate={{
                    top: bodyTop,
                    height: bodyHeight,
                    backgroundColor: isGreen ? '#26a69a' : '#ef5350',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                style={{
                    position: 'absolute',
                    left: candleX,
                    width: candleWidth,
                    borderRadius: 2,
                    boxShadow: isGreen
                        ? '0 0 10px rgba(38, 166, 154, 0.5)'
                        : '0 0 10px rgba(239, 83, 80, 0.5)',
                }}
            />

            {/* Flash effect on price change */}
            <AnimatePresence>
                <motion.div
                    key={close}
                    initial={{ opacity: 0.8, scale: 1.5 }}
                    animate={{ opacity: 0, scale: 2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        position: 'absolute',
                        left: candleX + candleWidth / 2,
                        top: priceToY(close),
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: isGreen ? '#26a69a' : '#ef5350',
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            </AnimatePresence>
        </div>
    );
});

AnimatedCandleOverlay.displayName = 'AnimatedCandleOverlay';

export default AnimatedCandleOverlay;
