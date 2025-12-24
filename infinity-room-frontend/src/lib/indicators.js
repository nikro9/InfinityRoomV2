// src/lib/indicators.js
// PineScript-style indicator calculations for Trading-Vue
// Converted from user's PineScript indicators

/**
 * Calculate EMA (Exponential Moving Average)
 * Based on: EMA15 CLEAN.txt
 * @param {number[]} data - Close prices
 * @param {number} period - EMA period (12 or 15)
 * @returns {number[]} - EMA values
 */
export const calcEMA = (data, period = 15) => {
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

/**
 * Calculate VWAP (Volume Weighted Average Price)
 * Based on: HFT 1M EMA + VWAP + TSR.txt
 * @param {Object[]} candles - OHLCV data
 * @returns {number[]} - VWAP values
 */
export const calcVWAP = (candles) => {
    let cumVolume = 0;
    let cumVWAP = 0;

    return candles.map((c, idx) => {
        const typicalPrice = (c.high + c.low + c.close) / 3;
        const volume = c.volume || 1;

        // Reset daily (simplified - reset every 288 candles for 5min)
        if (idx % 288 === 0) {
            cumVolume = 0;
            cumVWAP = 0;
        }

        cumVolume += volume;
        cumVWAP += typicalPrice * volume;

        return cumVolume > 0 ? cumVWAP / cumVolume : null;
    });
};

/**
 * Calculate Pivot Levels (Support/Resistance)
 * Based on: Indicador Pivotes.txt
 * @param {Object[]} candles - OHLCV data
 * @param {number} period - Lookback period (400 or 800 minutes)
 * @returns {Object} - {resistance: number[], support: number[]}
 */
export const calcPivots = (candles, period = 400) => {
    // Convert period from minutes to bars (assuming 5min candles)
    const lookback = Math.floor(period / 5);

    const resistance = [];
    const support = [];

    for (let i = 0; i < candles.length; i++) {
        if (i < lookback) {
            resistance.push(null);
            support.push(null);
        } else {
            const slice = candles.slice(i - lookback, i + 1);
            const high = Math.max(...slice.map(c => c.high));
            const low = Math.min(...slice.map(c => c.low));
            resistance.push(high);
            support.push(low);
        }
    }

    return { resistance, support };
};

/**
 * Calculate RSI (Relative Strength Index)
 * Based on: RSI.txt
 * @param {number[]} closes - Close prices
 * @param {number} period - RSI period (default 14)
 * @returns {number[]} - RSI values (0-100)
 */
export const calcRSI = (closes, period = 14) => {
    const result = [];

    for (let i = 0; i < closes.length; i++) {
        if (i < period) {
            result.push(null);
            continue;
        }

        let gains = 0;
        let losses = 0;

        for (let j = i - period + 1; j <= i; j++) {
            const change = closes[j] - closes[j - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;

        if (avgLoss === 0) {
            result.push(100);
        } else if (avgGain === 0) {
            result.push(0);
        } else {
            const rs = avgGain / avgLoss;
            result.push(100 - (100 / (1 + rs)));
        }
    }

    return result;
};

/**
 * Detect Market Structure (HH, HL, LL, LH, BOS, CHoCH)
 * Based on: market structure.txt
 * @param {Object[]} candles - OHLCV data
 * @param {number} swingSize - Swing detection length
 * @returns {Object} - {swings: Array, bosLines: Array}
 */
export const calcMarketStructure = (candles, swingSize = 20) => {
    const swings = [];
    const bosLines = [];

    let prevHigh = null;
    let prevLow = null;
    let prevHighIndex = null;
    let prevLowIndex = null;
    let highActive = false;
    let lowActive = false;
    let prevBreakoutDir = 0;

    // Find pivot points
    for (let i = swingSize; i < candles.length - swingSize; i++) {
        // Check for pivot high
        let isPivotHigh = true;
        let isPivotLow = true;

        const currentHigh = candles[i].high;
        const currentLow = candles[i].low;

        for (let j = 1; j <= swingSize; j++) {
            if (candles[i - j].high >= currentHigh || candles[i + j].high >= currentHigh) {
                isPivotHigh = false;
            }
            if (candles[i - j].low <= currentLow || candles[i + j].low <= currentLow) {
                isPivotLow = false;
            }
        }

        // Process pivot high
        if (isPivotHigh) {
            let type = 'HH';
            if (prevHigh !== null && currentHigh < prevHigh) {
                type = 'LH';
            }
            swings.push({
                index: i,
                price: currentHigh,
                type,
                isHigh: true,
            });

            prevHigh = currentHigh;
            prevHighIndex = i;
            highActive = true;
        }

        // Process pivot low
        if (isPivotLow) {
            let type = 'HL';
            if (prevLow !== null && currentLow < prevLow) {
                type = 'LL';
            }
            swings.push({
                index: i,
                price: currentLow,
                type,
                isHigh: false,
            });

            prevLow = currentLow;
            prevLowIndex = i;
            lowActive = true;
        }

        // Check for BOS (Break of Structure)
        if (highActive && prevHigh !== null && candles[i].close > prevHigh) {
            bosLines.push({
                startIndex: prevHighIndex,
                endIndex: i,
                price: prevHigh,
                direction: 'up',
                type: prevBreakoutDir === -1 ? 'CHoCH' : 'BOS',
            });
            highActive = false;
            prevBreakoutDir = 1;
        }

        if (lowActive && prevLow !== null && candles[i].close < prevLow) {
            bosLines.push({
                startIndex: prevLowIndex,
                endIndex: i,
                price: prevLow,
                direction: 'down',
                type: prevBreakoutDir === 1 ? 'CHoCH' : 'BOS',
            });
            lowActive = false;
            prevBreakoutDir = -1;
        }
    }

    return { swings, bosLines };
};

/**
 * Default indicator settings
 */
export const defaultIndicatorSettings = {
    ema: {
        enabled: true,
        length: 12,
        color: '#ffffff',
        lineWidth: 2,
        stepMode: true, // Modo escalera
    },
    hft: {
        enabled: false,
        ema: {
            length: 15,
            color: '#2962FF',
        },
        vwap: {
            enabled: true,
            color: '#2962FF',
        },
        pivots: {
            enabled: true,
            period: 100,
        },
    },
    marketStructure: {
        enabled: true,
        swingSize: 20,
        showSwings: true,
        showBOS: true,
        showCHoCH: true,
        bosColor: '#707276',
    },
    pivots: {
        enabled: true,
        period: 400, // 400 or 800
        resistanceColor: '#ff5252',
        supportColor: '#00c853',
        lineWidth: 2,
    },
    rsi: {
        enabled: true,
        length: 14,
        overbought: 70,
        oversold: 30,
        color: '#7E57C2',
    },
};

export default {
    calcEMA,
    calcVWAP,
    calcPivots,
    calcRSI,
    calcMarketStructure,
    defaultIndicatorSettings,
};
