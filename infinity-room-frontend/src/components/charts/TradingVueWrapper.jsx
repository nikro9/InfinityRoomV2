// src/components/charts/TradingVueWrapper.jsx
// Trading-Vue-JS wrapper with zoom preservation and overlays
import { useEffect, useRef, memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Vue from 'vue';
import TradingVue from 'trading-vue-js';
import LoadingSpinner from '../shared/LoadingSpinner';
import { calcEMA, calcVWAP, calcPivots, calcRSI } from '../../lib/indicators';
import { ChevronDown, Settings } from 'lucide-react';

Vue.use(TradingVue);

// Timeframes
const TIMEFRAMES = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
];

// Default indicator settings
const defaultSettings = {
    ema: { enabled: true, length: 12, color: '#f7931a' },
    pivots: { enabled: true, period: 80, resistanceColor: '#ef5350', supportColor: '#26a69a' },
    rsi: { enabled: false, length: 14, color: '#7E57C2' },
};

/**
 * Convert OHLCV data to trading-vue format
 */
const formatDataForTradingVue = (candles) => {
    if (!candles || candles.length === 0) return [];
    return candles.map(c => [
        (c.time || Math.floor(new Date(c.timestamp).getTime() / 1000)) * 1000,
        parseFloat(c.open),
        parseFloat(c.high),
        parseFloat(c.low),
        parseFloat(c.close),
        parseFloat(c.volume || 0),
    ]).sort((a, b) => a[0] - b[0]);
};

/**
 * Generate step-line data for pivots
 */
const generateStepLineData = (times, values) => {
    const result = [];
    let lastValidValue = null;
    for (let i = 0; i < times.length; i++) {
        if (values[i] !== null) {
            if (lastValidValue !== null && values[i] !== lastValidValue) {
                result.push([times[i], lastValidValue]);
            }
            result.push([times[i], values[i]]);
            lastValidValue = values[i];
        }
    }
    return result;
};

/**
 * Generate overlays from indicator settings
 */
const generateOverlays = (candles, settings) => {
    if (!candles || candles.length === 0) return { onchart: [], offchart: [] };

    const closes = candles.map(c => parseFloat(c.close));
    const times = candles.map(c => (c.time || Math.floor(new Date(c.timestamp).getTime() / 1000)) * 1000);

    const onchart = [];
    const offchart = [];

    // EMA
    if (settings.ema.enabled) {
        const ema = calcEMA(closes, settings.ema.length);
        onchart.push({
            name: `EMA ${settings.ema.length}`,
            type: 'Spline',
            data: times.map((t, i) => ema[i] !== null ? [t, ema[i]] : null).filter(Boolean),
            settings: { color: settings.ema.color, lineWidth: 1.5 },
        });
    }

    // Pivots
    if (settings.pivots.enabled) {
        const pivots = calcPivots(candles, settings.pivots.period);
        onchart.push({
            name: 'R',
            type: 'Spline',
            data: generateStepLineData(times, pivots.resistance),
            settings: { color: settings.pivots.resistanceColor, lineWidth: 1 },
        });
        onchart.push({
            name: 'S',
            type: 'Spline',
            data: generateStepLineData(times, pivots.support),
            settings: { color: settings.pivots.supportColor, lineWidth: 1 },
        });
    }

    // RSI
    if (settings.rsi.enabled) {
        const rsi = calcRSI(closes, settings.rsi.length);
        offchart.push({
            name: `RSI`,
            type: 'RSI',
            data: times.map((t, i) => rsi[i] !== null ? [t, rsi[i]] : null).filter(Boolean),
            settings: { color: settings.rsi.color, upper: 70, lower: 30 },
        });
    }

    return { onchart, offchart };
};

const TradingVueWrapper = memo(({
    data = [],
    height = 500,
    timeframe = '5m',
    onTimeframeChange,
}) => {
    const containerRef = useRef(null);
    const vueInstanceRef = useRef(null);
    const isInitialized = useRef(false);

    const [indicatorSettings, setIndicatorSettings] = useState(defaultSettings);
    const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
    const [hoverCandle, setHoverCandle] = useState(null);

    const hasData = data && data.length > 0;

    // Get current price and last candle for overlay
    const lastCandle = useMemo(() => {
        if (!hasData) return null;
        return data[data.length - 1];
    }, [data, hasData]);

    // Calculate countdown
    const [countdown, setCountdown] = useState('--:--');
    useEffect(() => {
        if (!lastCandle) return;

        const timeframeSec = {
            '1m': 60, '5m': 300, '15m': 900,
            '1h': 3600, '4h': 14400, '1d': 86400
        }[timeframe] || 300;

        const updateCountdown = () => {
            const candleStart = (lastCandle.time || Math.floor(new Date(lastCandle.timestamp).getTime() / 1000));
            const candleEnd = candleStart + timeframeSec;
            const remaining = candleEnd - Math.floor(Date.now() / 1000);
            if (remaining <= 0) {
                setCountdown('00:00');
            } else {
                const min = Math.floor(remaining / 60);
                const sec = remaining % 60;
                setCountdown(`${min}:${sec.toString().padStart(2, '0')}`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [lastCandle, timeframe]);

    // Build chart data
    const chartData = useMemo(() => {
        if (!hasData) return null;

        const ohlcv = formatDataForTradingVue(data);
        const overlays = generateOverlays(data, indicatorSettings);

        return {
            chart: {
                type: 'Candles',
                data: ohlcv,
                settings: {
                    colorUp: '#26a69a',
                    colorDw: '#ef5350',
                    colorVolUp: 'rgba(38, 166, 154, 0.3)',
                    colorVolDw: 'rgba(239, 83, 80, 0.3)',
                },
            },
            onchart: overlays.onchart,
            offchart: overlays.offchart,
        };
    }, [data, indicatorSettings, hasData]);

    // Initialize Vue instance ONCE (not on data change)
    useEffect(() => {
        if (!containerRef.current || !hasData || !chartData || isInitialized.current) return;

        containerRef.current.innerHTML = '';
        const mountEl = document.createElement('div');
        containerRef.current.appendChild(mountEl);

        try {
            const vm = new Vue({
                el: mountEl,
                components: { TradingVue },
                data() {
                    return {
                        chartData,
                        width: containerRef.current.clientWidth,
                        height: height,
                    };
                },
                template: `
                    <trading-vue
                        :data="chartData"
                        :width="width"
                        :height="height"
                        :color-back="'#0b0e11'"
                        :color-grid="'rgba(42, 46, 57, 0.5)'"
                        :color-text="'#787b86'"
                        :color-text-hl="'#d1d4dc'"
                        :color-scale="'#2a2e39'"
                        :toolbar="false"
                        :legend-buttons="[]"
                        :legend="false"
                        title-txt=""
                    />
                `,
            });

            vueInstanceRef.current = vm;
            isInitialized.current = true;
        } catch (err) {
            console.error('TradingVue mount error:', err);
        }

        const handleResize = () => {
            if (vueInstanceRef.current && containerRef.current) {
                vueInstanceRef.current.width = containerRef.current.clientWidth;
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (vueInstanceRef.current) {
                try { vueInstanceRef.current.$destroy(); } catch (e) { }
                vueInstanceRef.current = null;
                isInitialized.current = false;
            }
        };
    }, [hasData, height]); // Note: removed chartData from deps

    // Update data without recreating instance (preserves zoom)
    useEffect(() => {
        if (vueInstanceRef.current && chartData) {
            vueInstanceRef.current.chartData = chartData;
        }
    }, [chartData]);

    // Toggle indicator
    const toggleIndicator = useCallback((key) => {
        setIndicatorSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: !prev[key].enabled }
        }));
    }, []);

    if (!hasData) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0e11' }}>
                <LoadingSpinner text="Cargando datos de mercado..." />
            </div>
        );
    }

    const currentPrice = lastCandle?.close;
    const priceChange = lastCandle ? ((lastCandle.close - lastCandle.open) / lastCandle.open * 100) : 0;
    const isUp = priceChange >= 0;

    return (
        <div style={{ height, width: '100%', background: '#0b0e11', position: 'relative' }}>
            {/* Chart */}
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* Top Left Controls */}
            <div style={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(19, 23, 34, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                {/* Timeframe Selector */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 8px',
                            background: 'rgba(237, 50, 55, 0.2)',
                            border: '1px solid rgba(237, 50, 55, 0.3)',
                            borderRadius: 4,
                            color: '#ED3237',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
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
                                    background: 'rgba(19, 23, 34, 0.98)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    zIndex: 100,
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

                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />

                {/* Indicator Toggles */}
                <button
                    onClick={() => toggleIndicator('ema')}
                    style={{
                        padding: '3px 6px',
                        background: indicatorSettings.ema.enabled ? 'rgba(247, 147, 26, 0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: 3,
                        color: indicatorSettings.ema.enabled ? '#f7931a' : '#787b86',
                        fontSize: 10,
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    EMA
                </button>

                <button
                    onClick={() => toggleIndicator('pivots')}
                    style={{
                        padding: '3px 6px',
                        background: indicatorSettings.pivots.enabled ? 'rgba(38, 166, 154, 0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: 3,
                        color: indicatorSettings.pivots.enabled ? '#26a69a' : '#787b86',
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
                        background: indicatorSettings.rsi.enabled ? 'rgba(126, 87, 194, 0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: 3,
                        color: indicatorSettings.rsi.enabled ? '#7E57C2' : '#787b86',
                        fontSize: 10,
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    RSI
                </button>
            </div>

            {/* Top Left OHLC Data */}
            {lastCandle && (
                <div style={{
                    position: 'absolute',
                    top: 44,
                    left: 8,
                    zIndex: 15,
                    fontSize: 10,
                    color: '#787b86',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    <span>O</span><span style={{ color: isUp ? '#26a69a' : '#ef5350', marginLeft: 2 }}>{parseFloat(lastCandle.open).toFixed(2)}</span>
                    <span style={{ marginLeft: 8 }}>H</span><span style={{ color: isUp ? '#26a69a' : '#ef5350', marginLeft: 2 }}>{parseFloat(lastCandle.high).toFixed(2)}</span>
                    <span style={{ marginLeft: 8 }}>L</span><span style={{ color: isUp ? '#26a69a' : '#ef5350', marginLeft: 2 }}>{parseFloat(lastCandle.low).toFixed(2)}</span>
                    <span style={{ marginLeft: 8 }}>C</span><span style={{ color: isUp ? '#26a69a' : '#ef5350', marginLeft: 2 }}>{parseFloat(lastCandle.close).toFixed(2)}</span>
                </div>
            )}

            {/* Price + Countdown Label (TradingView style) - Right side */}
            {currentPrice && (
                <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '40%',
                    transform: 'translateY(-50%)',
                    zIndex: 20,
                    background: isUp ? '#26a69a' : '#ef5350',
                    padding: '6px 8px',
                    borderRadius: '4px 0 0 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                }}>
                    <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'white',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        {parseFloat(currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span style={{
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.8)',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        {countdown}
                    </span>
                </div>
            )}
        </div>
    );
});

TradingVueWrapper.displayName = 'TradingVueWrapper';

export default TradingVueWrapper;
