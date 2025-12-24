// src/components/charts/TradingVueWrapper.jsx
// Trading-Vue-JS wrapper - PRO VERSION with all enhancements
import { useEffect, useRef, memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Vue from 'vue';
import TradingVue from 'trading-vue-js';
import LoadingSpinner from '../shared/LoadingSpinner';
import { calcEMA, calcVWAP, calcPivots, calcRSI } from '../../lib/indicators';
import { ChevronDown, RotateCcw } from 'lucide-react';

Vue.use(TradingVue);

// Timeframes
const TIMEFRAMES = [
    { value: '1m', label: '1m', sec: 60 },
    { value: '5m', label: '5m', sec: 300 },
    { value: '15m', label: '15m', sec: 900 },
    { value: '1h', label: '1H', sec: 3600 },
    { value: '4h', label: '4H', sec: 14400 },
    { value: '1d', label: '1D', sec: 86400 },
];

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
 * Generate overlays based on settings
 */
const generateOverlays = (candles, settings) => {
    if (!candles || candles.length === 0) return { onchart: [], offchart: [] };

    const closes = candles.map(c => parseFloat(c.close));
    const times = candles.map(c => (c.time || Math.floor(new Date(c.timestamp).getTime() / 1000)) * 1000);

    const onchart = [];
    const offchart = [];

    // EMA
    if (settings.ema) {
        const ema = calcEMA(closes, 12);
        onchart.push({
            name: 'EMA 12',
            type: 'Spline',
            data: times.map((t, i) => ema[i] !== null ? [t, ema[i]] : null).filter(Boolean),
            settings: { color: '#f7931a', lineWidth: 1.5 },
        });
    }

    // VWAP
    if (settings.vwap) {
        const vwap = calcVWAP(candles);
        onchart.push({
            name: 'VWAP',
            type: 'Spline',
            data: times.map((t, i) => vwap[i] !== null ? [t, vwap[i]] : null).filter(Boolean),
            settings: { color: '#2962ff', lineWidth: 1.5 },
        });
    }

    // Pivots
    if (settings.pivots) {
        const pivots = calcPivots(candles, 80);
        onchart.push({
            name: 'Resistencia',
            type: 'Spline',
            data: generateStepLineData(times, pivots.resistance),
            settings: { color: '#ef5350', lineWidth: 1 },
        });
        onchart.push({
            name: 'Soporte',
            type: 'Spline',
            data: generateStepLineData(times, pivots.support),
            settings: { color: '#26a69a', lineWidth: 1 },
        });
    }

    // RSI
    if (settings.rsi) {
        const rsi = calcRSI(closes, 14);
        offchart.push({
            name: 'RSI',
            type: 'RSI',
            data: times.map((t, i) => rsi[i] !== null ? [t, rsi[i]] : null).filter(Boolean),
            settings: { color: '#7E57C2', upper: 70, lower: 30 },
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
    const chartRangeRef = useRef(null); // Store range to preserve zoom

    // Indicator toggles
    const [indicators, setIndicators] = useState({
        ema: true,
        vwap: false,
        pivots: true,
        rsi: false,
    });

    const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
    const [countdown, setCountdown] = useState('--:--');

    const hasData = data && data.length > 0;

    // Get last candle info
    const lastCandle = useMemo(() => {
        if (!hasData) return null;
        return data[data.length - 1];
    }, [data, hasData]);

    // Countdown timer
    useEffect(() => {
        if (!lastCandle) return;
        const tf = TIMEFRAMES.find(t => t.value === timeframe);
        const sec = tf?.sec || 300;

        const updateCountdown = () => {
            const candleStart = lastCandle.time || Math.floor(new Date(lastCandle.timestamp).getTime() / 1000);
            const candleEnd = candleStart + sec;
            const remaining = candleEnd - Math.floor(Date.now() / 1000);
            if (remaining <= 0) {
                setCountdown('00:00');
            } else {
                const min = Math.floor(remaining / 60);
                const s = remaining % 60;
                setCountdown(`${min}:${s.toString().padStart(2, '0')}`);
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
        const overlays = generateOverlays(data, indicators);

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
    }, [data, indicators, hasData]);

    // Initialize Vue instance ONCE
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
                        ref="chart"
                        :data="chartData"
                        :width="width"
                        :height="height"
                        :color-back="'#0b0e11'"
                        :color-grid="'rgba(42, 46, 57, 0.5)'"
                        :color-text="'#787b86'"
                        :color-text-hl="'#d1d4dc'"
                        :color-scale="'#2a2e39'"
                        :toolbar="false"
                        :legend="true"
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
    }, [hasData, height]);

    // Update data reactively (preserves zoom)
    useEffect(() => {
        if (vueInstanceRef.current && chartData) {
            vueInstanceRef.current.chartData = chartData;
        }
    }, [chartData]);

    // Toggle indicator
    const toggleIndicator = useCallback((key) => {
        setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    if (!hasData) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0e11' }}>
                <LoadingSpinner text="Cargando datos de mercado..." />
            </div>
        );
    }

    const currentPrice = lastCandle?.close;
    const isUp = lastCandle ? lastCandle.close >= lastCandle.open : true;

    return (
        <div style={{ height, width: '100%', background: '#0b0e11', position: 'relative' }}>
            {/* TradingVue Chart */}
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* TOP LEFT: Controls Panel */}
            <div style={{
                position: 'absolute',
                top: 50,
                left: 8,
                zIndex: 30,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
            }}>
                {/* Timeframe Selector */}
                {onTimeframeChange && (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '5px 10px',
                                background: 'rgba(237, 50, 55, 0.15)',
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
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        zIndex: 100,
                                        minWidth: 60,
                                    }}
                                >
                                    {TIMEFRAMES.map(tf => (
                                        <button
                                            key={tf.value}
                                            onClick={() => {
                                                onTimeframeChange(tf.value);
                                                setShowTimeframeMenu(false);
                                            }}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: '6px 12px',
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
                )}

                {/* Indicator Toggles */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    background: 'rgba(19, 23, 34, 0.9)',
                    borderRadius: 4,
                    padding: 4,
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    {[
                        { key: 'ema', label: 'EMA', color: '#f7931a' },
                        { key: 'vwap', label: 'VWAP', color: '#2962ff' },
                        { key: 'pivots', label: 'S/R', color: '#26a69a' },
                        { key: 'rsi', label: 'RSI', color: '#7E57C2' },
                    ].map(ind => (
                        <button
                            key={ind.key}
                            onClick={() => toggleIndicator(ind.key)}
                            style={{
                                padding: '4px 8px',
                                background: indicators[ind.key] ? `${ind.color}20` : 'transparent',
                                border: 'none',
                                borderRadius: 3,
                                color: indicators[ind.key] ? ind.color : '#787b86',
                                fontSize: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            {ind.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* PRICE LABEL with Countdown - Right side, same row as current price */}
            {currentPrice && (
                <div style={{
                    position: 'absolute',
                    right: 60,
                    top: '35%',
                    zIndex: 25,
                    background: isUp ? '#26a69a' : '#ef5350',
                    padding: '4px 10px',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                    <span style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'white',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        {parseFloat(currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.85)',
                        fontFamily: "'JetBrains Mono', monospace",
                        background: 'rgba(0,0,0,0.2)',
                        padding: '2px 4px',
                        borderRadius: 2,
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
