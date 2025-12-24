// src/components/charts/KublaiChart.jsx
// 100% React Native Chart - No Vue dependency
// Animated candlesticks, countdown timer, smooth transitions

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

// ============================================================
// CONFIGURATION
// ============================================================
const CHART_CONFIG = {
    candleWidth: 8,
    candleGap: 3,
    wickWidth: 1,
    colors: {
        up: '#26a69a',
        down: '#ef5350',
        upWick: '#26a69a',
        downWick: '#ef5350',
        background: '#0b0e11',
        grid: 'rgba(42, 46, 57, 0.5)',
        text: '#787b86',
        textHighlight: '#d1d4dc',
        priceLine: '#2962ff',
        ema: '#f7931a',
    },
    padding: { top: 20, right: 60, bottom: 30, left: 10 },
    minVisibleCandles: 30,
    maxVisibleCandles: 200,
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const formatPrice = (price) => {
    if (price >= 10000) return price.toFixed(0);
    if (price >= 1000) return price.toFixed(1);
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(6);
};

const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const calculateEMA = (data, period) => {
    const k = 2 / (period + 1);
    let ema = data[0];
    return data.map((val, i) => {
        if (i === 0) return ema;
        ema = val * k + ema * (1 - k);
        return ema;
    });
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const KublaiChart = ({
    candles = [],
    height = 400,
    timeframe = '5m',
    showEMA = true,
    emaPeriod = 12,
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const [dimensions, setDimensions] = useState({ width: 800, height });
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
    const [countdown, setCountdown] = useState('--:--');
    const [hoverInfo, setHoverInfo] = useState(null);
    const [animatedPrice, setAnimatedPrice] = useState(null);

    // Parse timeframe to seconds
    const timeframeSec = useMemo(() => {
        const num = parseInt(timeframe);
        if (timeframe.includes('m')) return num * 60;
        if (timeframe.includes('h')) return num * 3600;
        if (timeframe.includes('d')) return num * 86400;
        return 300; // default 5m
    }, [timeframe]);

    // Calculate visible candles range
    useEffect(() => {
        if (candles.length === 0) return;

        const candleFullWidth = CHART_CONFIG.candleWidth + CHART_CONFIG.candleGap;
        const chartWidth = dimensions.width - CHART_CONFIG.padding.left - CHART_CONFIG.padding.right;
        const maxVisible = Math.min(
            Math.floor(chartWidth / candleFullWidth),
            candles.length,
            CHART_CONFIG.maxVisibleCandles
        );

        const end = candles.length;
        const start = Math.max(0, end - maxVisible);

        setVisibleRange({ start, end });
    }, [candles.length, dimensions.width]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: height,
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [height]);

    // Countdown timer
    useEffect(() => {
        if (candles.length === 0) return;

        const updateCountdown = () => {
            const now = Date.now();
            const lastCandleTime = candles[candles.length - 1]?.time * 1000 || now;
            const nextCandleTime = lastCandleTime + (timeframeSec * 1000);
            const remaining = Math.max(0, nextCandleTime - now);

            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [candles, timeframeSec]);

    // Animate price changes
    useEffect(() => {
        if (candles.length === 0) return;
        const currentPrice = candles[candles.length - 1]?.close;

        if (animatedPrice === null) {
            setAnimatedPrice(currentPrice);
            return;
        }

        // Smooth animation
        const startPrice = animatedPrice;
        const endPrice = currentPrice;
        const duration = 300;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic

            const interpolated = startPrice + (endPrice - startPrice) * eased;
            setAnimatedPrice(interpolated);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [candles.length > 0 ? candles[candles.length - 1]?.close : null]);

    // Calculate chart data
    const chartData = useMemo(() => {
        if (candles.length === 0) return null;

        const visibleCandles = candles.slice(visibleRange.start, visibleRange.end);
        if (visibleCandles.length === 0) return null;

        const highs = visibleCandles.map(c => c.high);
        const lows = visibleCandles.map(c => c.low);
        const maxPrice = Math.max(...highs);
        const minPrice = Math.min(...lows);
        const priceRange = maxPrice - minPrice || 1;

        // Add 5% padding to price range
        const paddedMax = maxPrice + priceRange * 0.05;
        const paddedMin = minPrice - priceRange * 0.05;
        const paddedRange = paddedMax - paddedMin;

        // Calculate EMA
        const closes = visibleCandles.map(c => c.close);
        const ema = showEMA ? calculateEMA(closes, emaPeriod) : [];

        return {
            candles: visibleCandles,
            maxPrice: paddedMax,
            minPrice: paddedMin,
            priceRange: paddedRange,
            ema,
            currentPrice: candles[candles.length - 1]?.close,
        };
    }, [candles, visibleRange, showEMA, emaPeriod]);

    // Draw chart on canvas
    useEffect(() => {
        if (!canvasRef.current || !chartData) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { width, height } = dimensions;
        const { padding, candleWidth, candleGap, wickWidth, colors } = CHART_CONFIG;

        // Set canvas resolution for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);

        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Helper to convert price to Y coordinate
        const priceToY = (price) => {
            const ratio = (chartData.maxPrice - price) / chartData.priceRange;
            return padding.top + ratio * chartHeight;
        };

        // Draw grid lines
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 0.5;

        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (chartHeight / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }

        // Calculate candle positions
        const candleFullWidth = candleWidth + candleGap;
        const totalCandlesWidth = chartData.candles.length * candleFullWidth;
        const startX = width - padding.right - totalCandlesWidth + candleGap;

        // Draw EMA line
        if (showEMA && chartData.ema.length > 0) {
            ctx.strokeStyle = colors.ema;
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            chartData.ema.forEach((val, i) => {
                const x = startX + i * candleFullWidth + candleWidth / 2;
                const y = priceToY(val);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        }

        // Draw candles
        chartData.candles.forEach((candle, i) => {
            const x = startX + i * candleFullWidth;
            const isUp = candle.close >= candle.open;

            const bodyTop = priceToY(Math.max(candle.open, candle.close));
            const bodyBottom = priceToY(Math.min(candle.open, candle.close));
            const bodyHeight = Math.max(1, bodyBottom - bodyTop);

            const wickTop = priceToY(candle.high);
            const wickBottom = priceToY(candle.low);

            // Draw wick
            ctx.fillStyle = isUp ? colors.upWick : colors.downWick;
            ctx.fillRect(
                x + (candleWidth - wickWidth) / 2,
                wickTop,
                wickWidth,
                wickBottom - wickTop
            );

            // Draw body
            ctx.fillStyle = isUp ? colors.up : colors.down;
            ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
        });

        // Draw current price line
        if (animatedPrice) {
            const priceY = priceToY(animatedPrice);

            // Dashed line
            ctx.strokeStyle = chartData.candles[chartData.candles.length - 1]?.close >=
                chartData.candles[chartData.candles.length - 1]?.open
                ? colors.up : colors.down;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(padding.left, priceY);
            ctx.lineTo(width - padding.right, priceY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Price label
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fillRect(width - padding.right, priceY - 10, padding.right, 20);
            ctx.fillStyle = '#fff';
            ctx.font = '11px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(formatPrice(animatedPrice), width - padding.right + 4, priceY + 4);
        }

        // Draw price scale
        ctx.fillStyle = colors.text;
        ctx.font = '10px system-ui';
        ctx.textAlign = 'right';

        for (let i = 0; i <= gridLines; i++) {
            const price = chartData.maxPrice - (chartData.priceRange / gridLines) * i;
            const y = padding.top + (chartHeight / gridLines) * i;
            ctx.fillText(formatPrice(price), width - 5, y + 3);
        }

        // Draw time scale
        ctx.textAlign = 'center';
        const timeLabels = 4;
        const candlesPerLabel = Math.floor(chartData.candles.length / timeLabels);

        for (let i = 0; i <= timeLabels; i++) {
            const idx = Math.min(i * candlesPerLabel, chartData.candles.length - 1);
            const candle = chartData.candles[idx];
            if (candle) {
                const x = startX + idx * candleFullWidth + candleWidth / 2;
                ctx.fillText(formatTime(candle.time * 1000), x, height - 8);
            }
        }

    }, [chartData, dimensions, animatedPrice, showEMA]);

    // Handle mouse move for hover info
    const handleMouseMove = useCallback((e) => {
        if (!chartData || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;

        const { padding, candleWidth, candleGap } = CHART_CONFIG;
        const candleFullWidth = candleWidth + candleGap;
        const chartWidth = dimensions.width - padding.left - padding.right;
        const totalCandlesWidth = chartData.candles.length * candleFullWidth;
        const startX = dimensions.width - padding.right - totalCandlesWidth + candleGap;

        const candleIndex = Math.floor((x - startX) / candleFullWidth);

        if (candleIndex >= 0 && candleIndex < chartData.candles.length) {
            setHoverInfo({
                candle: chartData.candles[candleIndex],
                x: startX + candleIndex * candleFullWidth + candleWidth / 2,
            });
        } else {
            setHoverInfo(null);
        }
    }, [chartData, dimensions]);

    if (candles.length === 0) {
        return (
            <div
                style={{
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: CHART_CONFIG.colors.background,
                    color: CHART_CONFIG.colors.text,
                }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <RefreshCw size={24} />
                </motion.div>
                <span style={{ marginLeft: 12 }}>Cargando datos...</span>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                height,
                background: CHART_CONFIG.colors.background,
                overflow: 'hidden',
            }}
        >
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverInfo(null)}
            />

            {/* Countdown Timer */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    position: 'absolute',
                    top: 8,
                    left: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(19, 23, 34, 0.9)',
                    backdropFilter: 'blur(10px)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <span style={{ fontSize: 11, color: '#787b86' }}>Cierre en</span>
                <motion.span
                    key={countdown}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#ED3237',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    {countdown}
                </motion.span>
            </motion.div>

            {/* Current Price Badge */}
            <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                    position: 'absolute',
                    top: 8,
                    right: CHART_CONFIG.padding.right + 8,
                    background: chartData?.candles[chartData.candles.length - 1]?.close >=
                        chartData?.candles[chartData.candles.length - 1]?.open
                        ? 'rgba(38, 166, 154, 0.2)' : 'rgba(239, 83, 80, 0.2)',
                    border: `1px solid ${chartData?.candles[chartData.candles.length - 1]?.close >=
                        chartData?.candles[chartData.candles.length - 1]?.open
                        ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'}`,
                    padding: '6px 12px',
                    borderRadius: 8,
                }}
            >
                <motion.span
                    key={animatedPrice}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: chartData?.candles[chartData.candles.length - 1]?.close >=
                            chartData?.candles[chartData.candles.length - 1]?.open
                            ? '#26a69a' : '#ef5350',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    ${animatedPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                </motion.span>
            </motion.div>

            {/* Hover Tooltip */}
            <AnimatePresence>
                {hoverInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            left: Math.min(hoverInfo.x, dimensions.width - 150),
                            top: CHART_CONFIG.padding.top + 10,
                            background: 'rgba(19, 23, 34, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: 10,
                            minWidth: 120,
                            zIndex: 10,
                        }}
                    >
                        <div style={{ fontSize: 10, color: '#787b86', marginBottom: 6 }}>
                            {formatTime(hoverInfo.candle.time * 1000)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11 }}>
                            <span style={{ color: '#787b86' }}>O:</span>
                            <span style={{ color: '#d1d4dc', fontFamily: "'JetBrains Mono', monospace" }}>
                                {formatPrice(hoverInfo.candle.open)}
                            </span>
                            <span style={{ color: '#787b86' }}>H:</span>
                            <span style={{ color: '#26a69a', fontFamily: "'JetBrains Mono', monospace" }}>
                                {formatPrice(hoverInfo.candle.high)}
                            </span>
                            <span style={{ color: '#787b86' }}>L:</span>
                            <span style={{ color: '#ef5350', fontFamily: "'JetBrains Mono', monospace" }}>
                                {formatPrice(hoverInfo.candle.low)}
                            </span>
                            <span style={{ color: '#787b86' }}>C:</span>
                            <span style={{
                                color: hoverInfo.candle.close >= hoverInfo.candle.open ? '#26a69a' : '#ef5350',
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>
                                {formatPrice(hoverInfo.candle.close)}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KublaiChart;
