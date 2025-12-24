// src/components/charts/TradingVueWrapper.jsx
// Trading-Vue-JS wrapper - Simple and stable
import { useEffect, useRef, memo, useState, useMemo } from 'react';
import Vue from 'vue';
import TradingVue from 'trading-vue-js';
import LoadingSpinner from '../shared/LoadingSpinner';
import { calcEMA, calcPivots, calcRSI } from '../../lib/indicators';

Vue.use(TradingVue);

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
 * Generate overlays
 */
const generateOverlays = (candles) => {
    if (!candles || candles.length === 0) return { onchart: [], offchart: [] };

    const closes = candles.map(c => parseFloat(c.close));
    const times = candles.map(c => (c.time || Math.floor(new Date(c.timestamp).getTime() / 1000)) * 1000);

    const onchart = [];

    // EMA
    const ema = calcEMA(closes, 12);
    onchart.push({
        name: 'EMA 12',
        type: 'Spline',
        data: times.map((t, i) => ema[i] !== null ? [t, ema[i]] : null).filter(Boolean),
        settings: { color: '#f7931a', lineWidth: 1.5 },
    });

    // Pivots
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

    return { onchart, offchart: [] };
};

const TradingVueWrapper = memo(({
    data = [],
    height = 500,
}) => {
    const containerRef = useRef(null);
    const vueInstanceRef = useRef(null);
    const isInitialized = useRef(false);

    const hasData = data && data.length > 0;

    // Build chart data
    const chartData = useMemo(() => {
        if (!hasData) return null;

        const ohlcv = formatDataForTradingVue(data);
        const overlays = generateOverlays(data);

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
    }, [data, hasData]);

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
                        :data="chartData"
                        :width="width"
                        :height="height"
                        :color-back="'#0b0e11'"
                        :color-grid="'rgba(42, 46, 57, 0.5)'"
                        :color-text="'#787b86'"
                        :color-text-hl="'#d1d4dc'"
                        :color-scale="'#2a2e39'"
                        :toolbar="false"
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

    // Update data without recreating instance (preserves zoom)
    useEffect(() => {
        if (vueInstanceRef.current && chartData) {
            vueInstanceRef.current.chartData = chartData;
        }
    }, [chartData]);

    if (!hasData) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0e11' }}>
                <LoadingSpinner text="Cargando datos de mercado..." />
            </div>
        );
    }

    return (
        <div style={{ height, width: '100%', background: '#0b0e11', position: 'relative' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
});

TradingVueWrapper.displayName = 'TradingVueWrapper';

export default TradingVueWrapper;
