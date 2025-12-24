// src/components/charts/TradingVueWrapper.jsx
// Trading-Vue-JS wrapper - Full screen, no borders, step-line pivots
import { useEffect, useRef, memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Vue from 'vue';
import TradingVue from 'trading-vue-js';
import LoadingSpinner from '../shared/LoadingSpinner';
import IndicatorSettings from './IndicatorSettings';
import { calcEMA, calcVWAP, calcPivots, calcRSI, defaultIndicatorSettings } from '../../lib/indicators';

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
 * Generate step-line data for pivots (horizontal lines with jumps)
 * This creates the TradingView-style step lines without diagonal connections
 */
const generateStepLineData = (times, values) => {
    const result = [];
    let lastValidValue = null;

    for (let i = 0; i < times.length; i++) {
        if (values[i] !== null) {
            // If value changed, we create a step by not connecting diagonally
            if (lastValidValue !== null && values[i] !== lastValidValue) {
                // Add the last value at current time to create horizontal line
                result.push([times[i], lastValidValue]);
            }
            result.push([times[i], values[i]]);
            lastValidValue = values[i];
        }
    }
    return result;
};

/**
 * Generate overlay data from indicator calculations
 */
const generateOverlays = (candles, settings, proposal) => {
    if (!candles || candles.length === 0) return { onchart: [], offchart: [] };

    const closes = candles.map(c => parseFloat(c.close));
    const times = candles.map(c => (c.time || Math.floor(new Date(c.timestamp).getTime() / 1000)) * 1000);

    const onchart = [];
    const offchart = [];

    // EMA Indicator
    if (settings.ema.enabled) {
        const ema = calcEMA(closes, settings.ema.length);
        onchart.push({
            name: `EMA ${settings.ema.length}`,
            type: 'Spline',
            data: times.map((t, i) => ema[i] !== null ? [t, ema[i]] : null).filter(Boolean),
            settings: {
                color: settings.ema.color,
                lineWidth: settings.ema.lineWidth,
            },
        });
    }

    // HFT Combo
    if (settings.hft.enabled) {
        const hftEma = calcEMA(closes, settings.hft.ema.length);
        onchart.push({
            name: `HFT EMA ${settings.hft.ema.length}`,
            type: 'Spline',
            data: times.map((t, i) => hftEma[i] !== null ? [t, hftEma[i]] : null).filter(Boolean),
            settings: { color: settings.hft.ema.color, lineWidth: 2 },
        });

        if (settings.hft.vwap.enabled) {
            const vwap = calcVWAP(candles);
            onchart.push({
                name: 'VWAP',
                type: 'Spline',
                data: times.map((t, i) => vwap[i] !== null ? [t, vwap[i]] : null).filter(Boolean),
                settings: { color: settings.hft.vwap.color, lineWidth: 2 },
            });
        }
    }

    // Main Pivots with STEP LINES (horizontal with jumps - like TradingView)
    if (settings.pivots.enabled) {
        const pivots = calcPivots(candles, settings.pivots.period);

        // Create step-line data for resistance
        const resistanceStepData = generateStepLineData(times, pivots.resistance);
        onchart.push({
            name: `Resistencia ${settings.pivots.period}m`,
            type: 'Spline',
            data: resistanceStepData,
            settings: {
                color: settings.pivots.resistanceColor,
                lineWidth: settings.pivots.lineWidth,
            },
        });

        // Create step-line data for support
        const supportStepData = generateStepLineData(times, pivots.support);
        onchart.push({
            name: `Soporte ${settings.pivots.period}m`,
            type: 'Spline',
            data: supportStepData,
            settings: {
                color: settings.pivots.supportColor,
                lineWidth: settings.pivots.lineWidth,
            },
        });
    }

    // RSI (offchart panel)
    if (settings.rsi.enabled) {
        const rsi = calcRSI(closes, settings.rsi.length);
        offchart.push({
            name: `RSI ${settings.rsi.length}`,
            type: 'RSI',
            data: times.map((t, i) => rsi[i] !== null ? [t, rsi[i]] : null).filter(Boolean),
            settings: {
                color: settings.rsi.color,
                upper: settings.rsi.overbought,
                lower: settings.rsi.oversold,
                backColor: '#7E57C220',
            },
        });
    }

    return { onchart, offchart };
};

const TradingVueWrapper = memo(({
    data = [],
    height = 500,
    proposal = null,
}) => {
    const containerRef = useRef(null);
    const vueInstanceRef = useRef(null);
    const [showSettings, setShowSettings] = useState(false);
    const [indicatorSettings, setIndicatorSettings] = useState(defaultIndicatorSettings);

    const hasData = data && data.length > 0;

    const chartData = useMemo(() => {
        if (!hasData) return null;

        const ohlcv = formatDataForTradingVue(data);
        const overlays = generateOverlays(data, indicatorSettings, proposal);

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
    }, [data, indicatorSettings, hasData, proposal]);

    useEffect(() => {
        if (!containerRef.current || !hasData || !chartData) return;

        if (vueInstanceRef.current) {
            try { vueInstanceRef.current.$destroy(); } catch (e) { }
            vueInstanceRef.current = null;
        }

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
            :toolbar="true"
            :legend-buttons="['display', 'settings', 'remove']"
          />
        `,
            });

            vueInstanceRef.current = vm;
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
            }
        };
    }, [chartData, height, hasData]);

    useEffect(() => {
        if (vueInstanceRef.current && chartData) {
            vueInstanceRef.current.chartData = chartData;
        }
    }, [chartData]);

    if (!hasData) {
        return (
            <div
                style={{
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0b0e11',
                }}
            >
                <LoadingSpinner text="Cargando datos de mercado..." />
            </div>
        );
    }

    return (
        <>
            {/* Chart container - NO BORDERS, NO PADDING */}
            <div
                style={{
                    height,
                    width: '100%',
                    background: '#0b0e11',
                    position: 'relative',
                }}
            >
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            </div>

            {/* Settings Modal */}
            <IndicatorSettings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={indicatorSettings}
                onSettingsChange={setIndicatorSettings}
            />
        </>
    );
});

TradingVueWrapper.displayName = 'TradingVueWrapper';

export default TradingVueWrapper;
