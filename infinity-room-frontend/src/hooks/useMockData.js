// src/hooks/useMockData.js
// Hook to provide mock data for development/demo purposes
// Will be replaced with real API calls when backend is connected

import { useState, useEffect } from 'react';

// Generate mock candlestick data
const generateMockCandles = (count = 100, basePrice = 100000) => {
    const candles = [];
    let currentPrice = basePrice;
    const now = Math.floor(Date.now() / 1000);
    const interval = 300; // 5 minutes

    for (let i = count - 1; i >= 0; i--) {
        const volatility = currentPrice * 0.002;
        const open = currentPrice;
        const change = (Math.random() - 0.5) * volatility * 2;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;

        candles.push({
            time: now - (i * interval),
            timestamp: new Date((now - (i * interval)) * 1000).toISOString(),
            open,
            high,
            low,
            close,
            volume: Math.random() * 1000000,
            ema_fast: open + (Math.random() - 0.5) * volatility * 0.5,
            sml_high: basePrice * 1.015,
            sml_low: basePrice * 0.985,
            rsi: 30 + Math.random() * 40,
        });

        currentPrice = close;
    }

    return candles;
};

// Mock status data
const generateMockStatus = (symbol = 'BTC/USDT') => ({
    symbol,
    reasoning: `Análisis en curso para ${symbol}. Detectando niveles de soporte y resistencia basados en la estructura de mercado.`,
    timestamp: new Date().toISOString(),
    proposal: Math.random() > 0.5 ? {
        type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        entry_price: 100000 + (Math.random() - 0.5) * 2000,
        stop_loss: 99000 + (Math.random() - 0.5) * 1000,
        take_profit: 102000 + (Math.random() - 0.5) * 1000,
    } : null,
});

// Mock chat logs
const generateMockChatLogs = () => [
    {
        timestamp: new Date().toISOString(),
        content: `Análisis de BTC/USDT a las ${new Date().toLocaleTimeString()}

**Analista Técnico:**
{"sentiment": "BULLISH", "signal": "LONG", "confidence": "HIGH", "reasoning": "Precio rebotando en zona de soporte SML"}

**Analista de Momentum:**
{"confirmation": "CONFIRMED", "trigger_price": 100500, "reasoning": "RSI mostrando divergencia alcista"}

**DECISIÓN FINAL:**
Señal LONG detectada con alta confluencia. Punto de entrada propuesto en $100,500.`
    },
    {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        content: `Análisis de ETH/USDT a las ${new Date(Date.now() - 300000).toLocaleTimeString()}

**Analista Técnico:**
{"sentiment": "NEUTRAL", "signal": "WAIT", "confidence": "MEDIUM", "reasoning": "Consolidación dentro del rango"}

**DECISIÓN FINAL:**
Sin señal clara. Esperando ruptura del rango actual.`
    }
];

// Mock trades
const generateMockTrades = () => [
    { timestamp: '2024-12-20 14:30', type: 'BUY', entry_price: 99500, stop_loss: 98800, take_profit: 101000 },
    { timestamp: '2024-12-19 10:15', type: 'SELL', entry_price: 102000, stop_loss: 102800, take_profit: 100500 },
    { timestamp: '2024-12-18 09:45', type: 'BUY', entry_price: 97000, stop_loss: 96200, take_profit: 98500 },
];

// Hook implementations
export const useBitcoinData = () => {
    const [data, setData] = useState({ candles: [], status: null, isLoading: true });

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => {
            setData({
                candles: generateMockCandles(100, 100000),
                status: generateMockStatus('BTC/USDT'),
                isLoading: false,
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return data;
};

export const useAltcoinData = (symbol = 'ETH/USDT') => {
    const [data, setData] = useState({ candles: [], status: null, isLoading: true });

    useEffect(() => {
        setData(prev => ({ ...prev, isLoading: true }));

        const basePrice = {
            'ETH/USDT': 3500,
            'XRP/USDT': 2.2,
            'BNB/USDT': 700,
            'SOL/USDT': 200,
            'DOGE/USDT': 0.35,
            'TRX/USDT': 0.25,
            'ADA/USDT': 1.0,
            'LTC/USDT': 110,
            'BCH/USDT': 500,
            'LINK/USDT': 25,
        }[symbol] || 100;

        const timer = setTimeout(() => {
            setData({
                candles: generateMockCandles(100, basePrice),
                status: generateMockStatus(symbol),
                isLoading: false,
            });
        }, 800);

        return () => clearTimeout(timer);
    }, [symbol]);

    return data;
};

export const useChatLogs = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLogs(generateMockChatLogs());
            setIsLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    return { logs, isLoading };
};

export const useTrades = () => {
    const [trades, setTrades] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTrades(generateMockTrades());
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    return { trades, isLoading };
};

export const usePerformance = (capital = 10000) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            // Simulate performance projection
            const periods = [30, 60, 90, 180, 365];
            const projections = periods.map(days => {
                const monthlyReturn = 0.05 + Math.random() * 0.03;
                const months = days / 30;
                const finalCapital = capital * Math.pow(1 + monthlyReturn, months);
                return {
                    days,
                    finalCapital,
                    growth: (finalCapital - capital) / capital,
                };
            });

            setData(projections);
            setIsLoading(false);
        }, 700);

        return () => clearTimeout(timer);
    }, [capital]);

    return { data, isLoading };
};
