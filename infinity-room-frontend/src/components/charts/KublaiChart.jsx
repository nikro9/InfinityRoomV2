// src/components/charts/KublaiChart.jsx
// KublaiChart PRO - TradingView-style professional charting
// 100% React Native - No Vue dependency

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Eye, EyeOff, ChevronDown, ChevronUp,
    ZoomIn, ZoomOut, Maximize2, RotateCcw
} from 'lucide-react';

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
        grid: 'rgba(42, 46, 57, 0.3)',
        text: '#787b86',
        textHighlight: '#d1d4dc',
        priceLine: 'rgba(41, 98, 255, 0.8)',
        ema: 'rgba(247, 147, 26, 0.8)',
        vwap: '#2962ff',
        pivotResistance: '#ef5350',
        pivotSupport: '#26a69a',
        rsiLine: '#7E57C2',
        rsiOverbought: 'rgba(239, 83, 80, 0.3)',
        rsiOversold: 'rgba(38, 166, 154, 0.3)',
        volumeUp: 'rgba(38, 166, 154, 0.4)',
        volumeDown: 'rgba(239, 83, 80, 0.4)',
        bos: '#707276',
        choch: '#f7931a',
    },
    padding: { top: 10, right: 60, bottom: 25, left: 5 },
    rsiHeight: 70,
    volumeHeight: 40,
};

const TIMEFRAMES = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const formatPrice = (price) => {
    if (!price) return '-';
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
    if (!data || data.length === 0) return [];
    const k = 2 / (period + 1);
    let ema = data[0];
    return data.map((val, i) => {
        if (i === 0) return ema;
        ema = val * k + ema * (1 - k);
        return ema;
    });
};

const calculateRSI = (closes, period = 14) => {
    if (!closes || closes.length < period + 1) return [];

    const rsi = [];
    let gains = 0;
    let losses = 0;

    // Initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change >= 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = 0; i < period; i++) {
        rsi.push(null);
    }

    // Calculate RSI
    for (let i = period; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        const gain = change >= 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        if (avgLoss === 0) {
            rsi.push(100);
        } else {
            const rs = avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
        }
    }

    return rsi;
};

// Calculate VWAP (Volume Weighted Average Price)
const calculateVWAP = (candles) => {
    if (!candles || candles.length === 0) return [];

    let cumVolume = 0;
    let cumVWAP = 0;

    return candles.map((c, idx) => {
        const typicalPrice = (c.high + c.low + c.close) / 3;
        const volume = c.volume || 1;

        // Reset daily (every 288 5min candles)
        if (idx % 288 === 0) {
            cumVolume = 0;
            cumVWAP = 0;
        }

        cumVolume += volume;
        cumVWAP += typicalPrice * volume;

        return cumVolume > 0 ? cumVWAP / cumVolume : null;
    });
};

// Calculate Pivot Levels (Support/Resistance)
const calculatePivots = (candles, period = 80) => {
    if (!candles || candles.length === 0) return { resistance: [], support: [] };

    const resistance = [];
    const support = [];

    for (let i = 0; i < candles.length; i++) {
        if (i < period) {
            resistance.push(null);
            support.push(null);
        } else {
            const slice = candles.slice(i - period, i + 1);
            const high = Math.max(...slice.map(c => c.high));
            const low = Math.min(...slice.map(c => c.low));
            resistance.push(high);
            support.push(low);
        }
    }

    return { resistance, support };
};

const lerp = (start, end, t) => start + (end - start) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// ============================================================
// MAIN COMPONENT
// ============================================================
const KublaiChart = ({
    candles = [],
    height = 400,
    currentTick = null, // Real-time tick price
    timeframe = '5m',
    onTimeframeChange,
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const animationRef = useRef(null);

    const [dimensions, setDimensions] = useState({ width: 800, height });
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
    const [countdown, setCountdown] = useState('--:--');
    const [hoverInfo, setHoverInfo] = useState(null);
    const [animatedCandle, setAnimatedCandle] = useState(null);
    const [controlsMinimized, setControlsMinimized] = useState(false);
    const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);

    // Pan & Zoom state
    const [panOffset, setPanOffset] = useState(0); // candles to offset from end
    const [zoomLevel, setZoomLevel] = useState(1); // 1 = normal, >1 = zoomed in
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
    const [crosshair, setCrosshair] = useState(null); // { x, y }

    // Indicator visibility
    const [indicators, setIndicators] = useState({
        ema: { enabled: true, period: 12 },
        vwap: { enabled: false },
        pivots: { enabled: true, period: 80 },
        rsi: { enabled: false, period: 14 },
        volume: { enabled: true },
    });

    // Parse timeframe to seconds
    const timeframeSec = useMemo(() => {
        const num = parseInt(timeframe);
        if (timeframe.includes('m')) return num * 60;
        if (timeframe.includes('h')) return num * 3600;
        if (timeframe.includes('d')) return num * 86400;
        return 300;
    }, [timeframe]);

    // Calculate chart areas
    const chartAreas = useMemo(() => {
        const { padding, rsiHeight, volumeHeight } = CHART_CONFIG;
        const totalHeight = height;

        let mainHeight = totalHeight - padding.top - padding.bottom;
        let rsiTop = 0;
        let volumeTop = 0;

        if (indicators.rsi.enabled) {
            mainHeight -= rsiHeight + 10;
        }
        if (indicators.volume.enabled) {
            mainHeight -= volumeHeight;
        }

        const mainTop = padding.top;
        const mainBottom = mainTop + mainHeight;

        volumeTop = mainBottom + 5;
        rsiTop = indicators.volume.enabled ? volumeTop + volumeHeight + 5 : mainBottom + 5;

        return { mainTop, mainHeight, mainBottom, volumeTop, rsiTop };
    }, [height, indicators]);

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

    // Calculate visible candles range with pan/zoom
    useEffect(() => {
        if (candles.length === 0) return;

        const baseWidth = CHART_CONFIG.candleWidth + CHART_CONFIG.candleGap;
        const candleFullWidth = baseWidth * zoomLevel;
        const chartWidth = dimensions.width - CHART_CONFIG.padding.left - CHART_CONFIG.padding.right;
        const maxVisible = Math.min(Math.floor(chartWidth / candleFullWidth), candles.length, 200);

        // Apply pan offset (clamped)
        const clampedOffset = Math.max(0, Math.min(panOffset, candles.length - maxVisible));
        const end = candles.length - clampedOffset;
        const start = Math.max(0, end - maxVisible);

        setVisibleRange({ start, end });
    }, [candles.length, dimensions.width, panOffset, zoomLevel]);

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

    // Animate last candle on tick updates
    useEffect(() => {
        if (candles.length === 0) return;

        const lastCandle = candles[candles.length - 1];
        if (!lastCandle) return;

        // Start animation from previous state to new state
        const startCandle = animatedCandle || lastCandle;
        const startTime = Date.now();
        const duration = 200; // 200ms smooth transition

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);

            setAnimatedCandle({
                ...lastCandle,
                close: lerp(startCandle.close, lastCandle.close, eased),
                high: Math.max(startCandle.high, lerp(startCandle.high, lastCandle.high, eased)),
                low: Math.min(startCandle.low, lerp(startCandle.low, lastCandle.low, eased)),
            });

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [candles.length > 0 ? candles[candles.length - 1]?.close : null]);

    // Calculate chart data
    const chartData = useMemo(() => {
        if (candles.length === 0) return null;

        const visibleCandles = candles.slice(visibleRange.start, visibleRange.end);
        if (visibleCandles.length === 0) return null;

        // Replace last candle with animated version
        const displayCandles = animatedCandle
            ? [...visibleCandles.slice(0, -1), animatedCandle]
            : visibleCandles;

        const highs = displayCandles.map(c => c.high);
        const lows = displayCandles.map(c => c.low);
        const maxPrice = Math.max(...highs);
        const minPrice = Math.min(...lows);
        const priceRange = maxPrice - minPrice || 1;

        const paddedMax = maxPrice + priceRange * 0.03;
        const paddedMin = minPrice - priceRange * 0.03;
        const paddedRange = paddedMax - paddedMin;

        const closes = displayCandles.map(c => c.close);
        const volumes = displayCandles.map(c => c.volume || 0);
        const maxVolume = Math.max(...volumes) || 1;

        // Calculate pivot levels
        const pivots = indicators.pivots.enabled
            ? calculatePivots(displayCandles, indicators.pivots.period)
            : { resistance: [], support: [] };

        return {
            candles: displayCandles,
            maxPrice: paddedMax,
            minPrice: paddedMin,
            priceRange: paddedRange,
            ema: indicators.ema.enabled ? calculateEMA(closes, indicators.ema.period) : [],
            vwap: indicators.vwap.enabled ? calculateVWAP(displayCandles) : [],
            pivots,
            rsi: indicators.rsi.enabled ? calculateRSI(closes, indicators.rsi.period) : [],
            volumes,
            maxVolume,
            currentPrice: animatedCandle?.close || candles[candles.length - 1]?.close,
        };
    }, [candles, visibleRange, animatedCandle, indicators]);

    // Draw chart
    useEffect(() => {
        if (!canvasRef.current || !chartData) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { width } = dimensions;
        const totalHeight = height;
        const { padding, candleWidth, candleGap, wickWidth, colors, rsiHeight, volumeHeight } = CHART_CONFIG;
        const { mainTop, mainHeight, mainBottom, volumeTop, rsiTop } = chartAreas;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = totalHeight * dpr;
        ctx.scale(dpr, dpr);

        // Clear
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, totalHeight);

        const chartWidth = width - padding.left - padding.right;

        // Helpers
        const priceToY = (price) => {
            const ratio = (chartData.maxPrice - price) / chartData.priceRange;
            return mainTop + ratio * mainHeight;
        };

        const rsiToY = (rsi) => {
            return rsiTop + ((100 - rsi) / 100) * rsiHeight;
        };

        // Draw grid
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 0.5;

        for (let i = 0; i <= 4; i++) {
            const y = mainTop + (mainHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }

        // Candle positioning with zoom
        const scaledCandleWidth = candleWidth * zoomLevel;
        const scaledGap = candleGap * zoomLevel;
        const candleFullWidth = scaledCandleWidth + scaledGap;
        const totalCandlesWidth = chartData.candles.length * candleFullWidth;
        const startX = width - padding.right - totalCandlesWidth + scaledGap;

        // Draw volume bars
        if (indicators.volume.enabled) {
            chartData.candles.forEach((candle, i) => {
                const x = startX + i * candleFullWidth;
                const isUp = candle.close >= candle.open;
                const barHeight = (candle.volume / chartData.maxVolume) * volumeHeight;

                ctx.fillStyle = isUp ? colors.volumeUp : colors.volumeDown;
                ctx.fillRect(x, volumeTop + volumeHeight - barHeight, scaledCandleWidth, barHeight);
            });
        }

        // Draw EMA
        if (indicators.ema.enabled && chartData.ema.length > 0) {
            ctx.strokeStyle = colors.ema;
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            chartData.ema.forEach((val, i) => {
                if (val === null) return;
                const x = startX + i * candleFullWidth + scaledCandleWidth / 2;
                const y = priceToY(val);
                if (i === 0 || chartData.ema[i - 1] === null) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        }

        // Draw VWAP
        if (indicators.vwap.enabled && chartData.vwap.length > 0) {
            ctx.strokeStyle = colors.vwap;
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            chartData.vwap.forEach((val, i) => {
                if (val === null) return;
                const x = startX + i * candleFullWidth + scaledCandleWidth / 2;
                const y = priceToY(val);
                if (i === 0 || chartData.vwap[i - 1] === null) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        }

        // Draw Pivot levels (horizontal lines for support/resistance)
        if (indicators.pivots.enabled && chartData.pivots.resistance.length > 0) {
            const lastIdx = chartData.candles.length - 1;
            const resistance = chartData.pivots.resistance[lastIdx];
            const support = chartData.pivots.support[lastIdx];

            if (resistance) {
                const y = priceToY(resistance);
                ctx.strokeStyle = colors.pivotResistance;
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 3]);
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
                ctx.setLineDash([]);

                // Label
                ctx.fillStyle = colors.pivotResistance;
                ctx.font = '9px system-ui';
                ctx.textAlign = 'left';
                ctx.fillText(`R ${formatPrice(resistance)}`, padding.left + 5, y - 3);
            }

            if (support) {
                const y = priceToY(support);
                ctx.strokeStyle = colors.pivotSupport;
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 3]);
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
                ctx.setLineDash([]);

                // Label
                ctx.fillStyle = colors.pivotSupport;
                ctx.font = '9px system-ui';
                ctx.textAlign = 'left';
                ctx.fillText(`S ${formatPrice(support)}`, padding.left + 5, y + 10);
            }
        }

        // Draw candles
        chartData.candles.forEach((candle, i) => {
            const x = startX + i * candleFullWidth;
            const isUp = candle.close >= candle.open;
            const isLast = i === chartData.candles.length - 1;

            const bodyTop = priceToY(Math.max(candle.open, candle.close));
            const bodyBottom = priceToY(Math.min(candle.open, candle.close));
            const bodyHeight = Math.max(1, bodyBottom - bodyTop);

            const wickTop = priceToY(candle.high);
            const wickBottom = priceToY(candle.low);

            // Wick
            ctx.fillStyle = isUp ? colors.upWick : colors.downWick;
            ctx.fillRect(x + (scaledCandleWidth - wickWidth) / 2, wickTop, wickWidth, wickBottom - wickTop);

            // Body with glow for last candle
            if (isLast) {
                ctx.shadowColor = isUp ? colors.up : colors.down;
                ctx.shadowBlur = 8;
            }
            ctx.fillStyle = isUp ? colors.up : colors.down;
            ctx.fillRect(x, bodyTop, scaledCandleWidth, bodyHeight);
            ctx.shadowBlur = 0;
        });

        // Draw current price line
        if (chartData.currentPrice) {
            const priceY = priceToY(chartData.currentPrice);
            const isUp = chartData.candles[chartData.candles.length - 1]?.close >=
                chartData.candles[chartData.candles.length - 1]?.open;

            ctx.strokeStyle = isUp ? colors.up : colors.down;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(padding.left, priceY);
            ctx.lineTo(width - padding.right, priceY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Price label on right - TradingView style with countdown
            const labelWidth = 55;
            const labelHeight = 28; // Taller to fit countdown
            ctx.fillStyle = isUp ? colors.up : colors.down;
            ctx.fillRect(width - padding.right, priceY - labelHeight / 2, labelWidth, labelHeight);

            // Price
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(formatPrice(chartData.currentPrice), width - padding.right + 3, priceY - 2);

            // Countdown below price
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText(countdown, width - padding.right + 3, priceY + 10);
        }

        // Draw RSI panel
        if (indicators.rsi.enabled && chartData.rsi.length > 0) {
            // RSI separator line
            ctx.strokeStyle = colors.grid;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, rsiTop - 5);
            ctx.lineTo(width - padding.right, rsiTop - 5);
            ctx.stroke();

            // RSI background
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(padding.left, rsiTop, chartWidth, rsiHeight);

            // RSI zones - more subtle
            ctx.fillStyle = 'rgba(239, 83, 80, 0.15)';
            ctx.fillRect(padding.left, rsiTop, chartWidth, rsiHeight * 0.3);
            ctx.fillStyle = 'rgba(38, 166, 154, 0.15)';
            ctx.fillRect(padding.left, rsiTop + rsiHeight * 0.7, chartWidth, rsiHeight * 0.3);

            // RSI zone lines (70 and 30)
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 0.5;
            ctx.setLineDash([2, 2]);
            [0.3, 0.5, 0.7].forEach(pct => {
                const y = rsiTop + rsiHeight * pct;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
            });
            ctx.setLineDash([]);

            // RSI line
            ctx.strokeStyle = colors.rsiLine;
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            chartData.rsi.forEach((val, i) => {
                if (val === null) return;
                const x = startX + i * candleFullWidth + candleWidth / 2;
                const y = rsiToY(val);
                if (chartData.rsi.slice(0, i).every(v => v === null)) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // RSI labels
            ctx.fillStyle = colors.text;
            ctx.font = '9px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText('70', width - 5, rsiTop + rsiHeight * 0.3);
            ctx.fillText('30', width - 5, rsiTop + rsiHeight * 0.7);
        }

        // Draw price scale
        ctx.fillStyle = colors.text;
        ctx.font = '10px system-ui';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 4; i++) {
            const price = chartData.maxPrice - (chartData.priceRange / 4) * i;
            const y = mainTop + (mainHeight / 4) * i;
            ctx.fillText(formatPrice(price), width - 5, y + 3);
        }

        // Draw time scale
        ctx.textAlign = 'center';
        const timeLabels = Math.min(5, chartData.candles.length);
        const step = Math.floor(chartData.candles.length / timeLabels);

        for (let i = 0; i < timeLabels; i++) {
            const idx = i * step;
            const candle = chartData.candles[idx];
            if (candle) {
                const x = startX + idx * candleFullWidth + candleWidth / 2;
                ctx.fillText(formatTime(candle.time * 1000), x, totalHeight - 8);
            }
        }

    }, [chartData, dimensions, height, chartAreas, indicators, zoomLevel, countdown]);

    // Mouse handlers
    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return; // Only left click
        setIsDragging(true);
        setDragStart({ x: e.clientX, offset: panOffset });
    }, [panOffset]);

    const handleMouseMove = useCallback((e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Update crosshair
        setCrosshair({ x, y });

        // Handle drag pan
        if (isDragging) {
            const dx = e.clientX - dragStart.x;
            const candleFullWidth = (CHART_CONFIG.candleWidth + CHART_CONFIG.candleGap) * zoomLevel;
            const candlesMoved = Math.round(dx / candleFullWidth);
            const newOffset = Math.max(0, dragStart.offset + candlesMoved);
            setPanOffset(newOffset);
        }

        // Hover info
        if (chartData) {
            const { padding, candleWidth, candleGap } = CHART_CONFIG;
            const candleFullWidth = (candleWidth + candleGap) * zoomLevel;
            const totalCandlesWidth = chartData.candles.length * candleFullWidth;
            const startX = dimensions.width - padding.right - totalCandlesWidth + candleGap;

            const candleIndex = Math.floor((x - startX) / candleFullWidth);

            if (candleIndex >= 0 && candleIndex < chartData.candles.length) {
                setHoverInfo({
                    candle: chartData.candles[candleIndex],
                    x: startX + candleIndex * candleFullWidth + candleWidth / 2,
                    index: candleIndex,
                });
            } else {
                setHoverInfo(null);
            }
        }
    }, [chartData, dimensions, isDragging, dragStart, zoomLevel]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
        setCrosshair(null);
        setHoverInfo(null);
    }, []);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }, []);

    // Reset pan when new candles arrive (to stay at latest)
    useEffect(() => {
        if (panOffset === 0) return; // Already at end
        // Don't auto-reset, let user control
    }, [candles.length]);

    // Toggle indicator
    const toggleIndicator = (key) => {
        setIndicators(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: !prev[key].enabled }
        }));
    };

    // Double-click to reset view
    const handleDoubleClick = useCallback(() => {
        setPanOffset(0);
        setZoomLevel(1);
    }, []);

    if (candles.length === 0) {
        return (
            <div style={{
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: CHART_CONFIG.colors.background,
                color: CHART_CONFIG.colors.text,
            }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ marginRight: 12 }}
                >
                    <RotateCcw size={20} />
                </motion.div>
                Conectando a Binance...
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
                style={{
                    width: dimensions.width,
                    height: height,
                    display: 'block',
                    cursor: isDragging ? 'grabbing' : 'crosshair',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
                onDoubleClick={handleDoubleClick}
            />

            {/* Controls - Top Left (Minimizable) */}
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 20,
                }}
            >
                <motion.div
                    animate={{ width: controlsMinimized ? 36 : 'auto' }}
                    style={{
                        background: 'rgba(19, 23, 34, 0.85)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.08)',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: controlsMinimized ? 8 : '6px 10px',
                        gap: controlsMinimized ? 0 : 6,
                    }}>
                        {/* Minimize button */}
                        <button
                            onClick={() => setControlsMinimized(!controlsMinimized)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#787b86',
                                cursor: 'pointer',
                                padding: 2,
                                display: 'flex',
                            }}
                        >
                            {controlsMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>

                        {!controlsMinimized && (
                            <>
                                {/* Timeframe selector */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
                                        style={{
                                            padding: '4px 8px',
                                            background: 'rgba(237, 50, 55, 0.15)',
                                            border: '1px solid rgba(237, 50, 55, 0.3)',
                                            borderRadius: 4,
                                            color: '#ED3237',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        {timeframe.toUpperCase()}
                                        <ChevronDown size={12} />
                                    </button>

                                    <AnimatePresence>
                                        {showTimeframeMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    marginTop: 4,
                                                    background: 'rgba(19, 23, 34, 0.95)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: 6,
                                                    overflow: 'hidden',
                                                    zIndex: 30,
                                                }}
                                            >
                                                {TIMEFRAMES.map(tf => (
                                                    <button
                                                        key={tf.value}
                                                        onClick={() => {
                                                            onTimeframeChange?.(tf.value);
                                                            setShowTimeframeMenu(false);
                                                        }}
                                                        style={{
                                                            display: 'block',
                                                            width: '100%',
                                                            padding: '6px 16px',
                                                            background: timeframe === tf.value ? 'rgba(237, 50, 55, 0.2)' : 'transparent',
                                                            border: 'none',
                                                            color: timeframe === tf.value ? '#ED3237' : '#d1d4dc',
                                                            fontSize: 11,
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                        }}
                                                    >
                                                        {tf.label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Divider */}
                                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />

                                {/* Indicator toggles */}
                                <button
                                    onClick={() => toggleIndicator('ema')}
                                    style={{
                                        padding: '3px 6px',
                                        background: indicators.ema.enabled ? 'rgba(247, 147, 26, 0.2)' : 'transparent',
                                        border: 'none',
                                        borderRadius: 3,
                                        color: indicators.ema.enabled ? '#f7931a' : '#787b86',
                                        fontSize: 10,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    EMA
                                </button>

                                <button
                                    onClick={() => toggleIndicator('vwap')}
                                    style={{
                                        padding: '3px 6px',
                                        background: indicators.vwap.enabled ? 'rgba(41, 98, 255, 0.2)' : 'transparent',
                                        border: 'none',
                                        borderRadius: 3,
                                        color: indicators.vwap.enabled ? '#2962ff' : '#787b86',
                                        fontSize: 10,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    VWAP
                                </button>

                                <button
                                    onClick={() => toggleIndicator('pivots')}
                                    style={{
                                        padding: '3px 6px',
                                        background: indicators.pivots.enabled ? 'rgba(38, 166, 154, 0.2)' : 'transparent',
                                        border: 'none',
                                        borderRadius: 3,
                                        color: indicators.pivots.enabled ? '#26a69a' : '#787b86',
                                        fontSize: 10,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    S/R
                                </button>

                                <button
                                    onClick={() => toggleIndicator('rsi')}
                                    style={{
                                        padding: '3px 6px',
                                        background: indicators.rsi.enabled ? 'rgba(126, 87, 194, 0.2)' : 'transparent',
                                        border: 'none',
                                        borderRadius: 3,
                                        color: indicators.rsi.enabled ? '#7E57C2' : '#787b86',
                                        fontSize: 10,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    RSI
                                </button>

                                <button
                                    onClick={() => toggleIndicator('volume')}
                                    style={{
                                        padding: '3px 6px',
                                        background: indicators.volume.enabled ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        border: 'none',
                                        borderRadius: 3,
                                        color: indicators.volume.enabled ? '#d1d4dc' : '#787b86',
                                        fontSize: 10,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    VOL
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
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
                            left: Math.min(Math.max(hoverInfo.x - 60, 10), dimensions.width - 140),
                            top: chartAreas.mainTop + 30,
                            background: 'rgba(19, 23, 34, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: '8px 10px',
                            zIndex: 30,
                            minWidth: 110,
                        }}
                    >
                        <div style={{ fontSize: 9, color: '#787b86', marginBottom: 4 }}>
                            {formatTime(hoverInfo.candle.time * 1000)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: 10 }}>
                            <span style={{ color: '#787b86' }}>O</span>
                            <span style={{ color: '#d1d4dc', fontFamily: "'JetBrains Mono'" }}>{formatPrice(hoverInfo.candle.open)}</span>
                            <span style={{ color: '#787b86' }}>H</span>
                            <span style={{ color: '#26a69a', fontFamily: "'JetBrains Mono'" }}>{formatPrice(hoverInfo.candle.high)}</span>
                            <span style={{ color: '#787b86' }}>L</span>
                            <span style={{ color: '#ef5350', fontFamily: "'JetBrains Mono'" }}>{formatPrice(hoverInfo.candle.low)}</span>
                            <span style={{ color: '#787b86' }}>C</span>
                            <span style={{
                                color: hoverInfo.candle.close >= hoverInfo.candle.open ? '#26a69a' : '#ef5350',
                                fontFamily: "'JetBrains Mono'"
                            }}>{formatPrice(hoverInfo.candle.close)}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KublaiChart;
