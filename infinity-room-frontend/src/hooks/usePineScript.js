// src/hooks/usePineScript.js
// Hook for executing PineScript code using PineTS runtime
// and returning plot data for rendering with lightweight-charts

import { useState, useEffect, useCallback, useRef } from 'react';
import { PineTS } from 'pinets';

/**
 * Convert OHLCV array to PineTS format
 * @param {Array} candles - Array of {time, open, high, low, close, volume}
 * @returns {Array} PineTS formatted data
 */
const formatCandlesForPineTS = (candles) => {
    return candles.map(c => ({
        openTime: c.time * 1000, // PineTS uses milliseconds
        closeTime: (c.time + 300) * 1000, // 5 min candles
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume || 0,
    }));
};

/**
 * Default PineScript indicators for the app
 */
export const defaultPineScript = `
//@version=5
indicator("Infinity Room Pivots")

// EMAs for trend
ema_fast = ta.ema(close, 12)
ema_slow = ta.ema(close, 26)

// SML Lines (Structure Market Levels)
sml_high = ta.highest(high, 20)
sml_low = ta.lowest(low, 20)

// RSI
rsi = ta.rsi(close, 14)

// Plots
plot(ema_fast, title="EMA 12", color=color.yellow)
plot(ema_slow, title="EMA 26", color=color.orange)
plot(sml_high, title="SML High", color=color.green)
plot(sml_low, title="SML Low", color=color.red)
`;

/**
 * Hook to run PineScript code on OHLCV data
 * @param {Array} candles - OHLCV data array
 * @param {string} pineScript - PineScript code to execute
 * @returns {Object} { plots, isLoading, error, rerun }
 */
export const usePineScript = (candles = [], pineScript = defaultPineScript) => {
    const [plots, setPlots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const pineTSRef = useRef(null);

    const runPineScript = useCallback(async () => {
        if (!candles || candles.length === 0) {
            setPlots([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Format candles for PineTS
            const formattedData = formatCandlesForPineTS(candles);

            // Create PineTS instance with our data
            const pineTS = new PineTS(formattedData);
            pineTSRef.current = pineTS;

            // Wait for ready
            await pineTS.ready();

            // Run the PineScript code
            const context = await pineTS.run(pineScript);

            // Extract plot data from context
            const plotResults = [];

            if (context.plots && typeof context.plots === 'object') {
                // If plots are available from the context
                for (const [plotName, plotData] of Object.entries(context.plots)) {
                    plotResults.push({
                        name: plotName,
                        data: Array.isArray(plotData.data) ? plotData.data : [],
                        color: plotData.color || '#ffffff',
                        lineWidth: plotData.lineWidth || 1,
                    });
                }
            } else if (context.result && typeof context.result === 'object') {
                // Fallback: use result object
                for (const [key, values] of Object.entries(context.result)) {
                    if (Array.isArray(values)) {
                        plotResults.push({
                            name: key,
                            data: values.map((val, idx) => ({
                                time: candles[idx]?.time,
                                value: val,
                            })).filter(d => d.time && typeof d.value === 'number'),
                            color: getDefaultColor(key),
                            lineWidth: 1,
                        });
                    }
                }
            }

            setPlots(plotResults);
        } catch (err) {
            console.error('PineScript execution error:', err);
            setError(err.message || 'Error executing PineScript');
        } finally {
            setIsLoading(false);
        }
    }, [candles, pineScript]);

    // Run on mount and when dependencies change
    useEffect(() => {
        runPineScript();
    }, [runPineScript]);

    return { plots, isLoading, error, rerun: runPineScript };
};

/**
 * Get default color for indicator by name
 */
const getDefaultColor = (name) => {
    const lowername = name.toLowerCase();
    if (lowername.includes('ema_fast') || lowername.includes('ema12')) return '#ffeb3b';
    if (lowername.includes('ema_slow') || lowername.includes('ema26')) return '#ff9800';
    if (lowername.includes('sml_high')) return '#00c853';
    if (lowername.includes('sml_low')) return '#ff5252';
    if (lowername.includes('rsi')) return '#9c27b0';
    if (lowername.includes('macd')) return '#2196f3';
    return 'rgba(255, 255, 255, 0.6)';
};

/**
 * Simplified hook that just calculates indicators without full PineTS
 * Useful as a fallback if PineTS has issues
 */
export const useSimpleIndicators = (candles = []) => {
    const [indicators, setIndicators] = useState({
        ema12: [],
        ema26: [],
        smlHigh: [],
        smlLow: [],
    });

    useEffect(() => {
        if (!candles || candles.length === 0) return;

        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);

        // Calculate EMA
        const calcEMA = (data, period) => {
            const result = [];
            const multiplier = 2 / (period + 1);
            let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

            for (let i = 0; i < data.length; i++) {
                if (i < period - 1) {
                    result.push(null);
                } else if (i === period - 1) {
                    result.push(ema);
                } else {
                    ema = (data[i] - ema) * multiplier + ema;
                    result.push(ema);
                }
            }
            return result;
        };

        // Calculate Highest/Lowest (SML)
        const calcHighest = (data, period) => {
            return data.map((_, idx) => {
                if (idx < period - 1) return null;
                const slice = data.slice(idx - period + 1, idx + 1);
                return Math.max(...slice);
            });
        };

        const calcLowest = (data, period) => {
            return data.map((_, idx) => {
                if (idx < period - 1) return null;
                const slice = data.slice(idx - period + 1, idx + 1);
                return Math.min(...slice);
            });
        };

        setIndicators({
            ema12: calcEMA(closes, 12).map((val, idx) => ({
                time: candles[idx]?.time,
                value: val,
            })).filter(d => d.value !== null),
            ema26: calcEMA(closes, 26).map((val, idx) => ({
                time: candles[idx]?.time,
                value: val,
            })).filter(d => d.value !== null),
            smlHigh: calcHighest(highs, 20).map((val, idx) => ({
                time: candles[idx]?.time,
                value: val,
            })).filter(d => d.value !== null),
            smlLow: calcLowest(lows, 20).map((val, idx) => ({
                time: candles[idx]?.time,
                value: val,
            })).filter(d => d.value !== null),
        });
    }, [candles]);

    return indicators;
};

export default usePineScript;
