// src/hooks/useBinanceWebSocket.js
// Real-time Binance WebSocket connection for live candle data
import { useState, useEffect, useRef, useCallback } from 'react';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

/**
 * Hook to connect to Binance WebSocket for real-time kline/candle data
 * @param {string} symbol - Trading pair (e.g., 'btcusdt')
 * @param {string} interval - Candle interval (e.g., '1m', '5m', '15m')
 * @returns {object} - { candles, currentPrice, priceChange, isConnected }
 */
export const useBinanceWebSocket = (symbol = 'btcusdt', interval = '5m') => {
    const [candles, setCandles] = useState([]);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [priceChange, setPriceChange] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Fetch initial historical data
    const fetchHistoricalData = useCallback(async () => {
        try {
            const response = await fetch(
                `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=200`
            );
            const data = await response.json();

            const formatted = data.map(k => ({
                time: k[0] / 1000, // Convert to seconds
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5]),
            }));

            setCandles(formatted);

            if (formatted.length > 0) {
                const lastCandle = formatted[formatted.length - 1];
                setCurrentPrice(lastCandle.close);

                if (formatted.length > 1) {
                    const prevCandle = formatted[formatted.length - 2];
                    const change = ((lastCandle.close - prevCandle.close) / prevCandle.close) * 100;
                    setPriceChange(change);
                }
            }
        } catch (error) {
            console.error('Error fetching historical data:', error);
        }
    }, [symbol, interval]);

    // Connect to WebSocket (kline + aggTrade for tick-by-tick updates)
    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        // Combined stream: klines for candles + aggTrade for tick-by-tick price
        const streams = [
            `${symbol.toLowerCase()}@kline_${interval}`,
            `${symbol.toLowerCase()}@aggTrade`
        ].join('/');

        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

        ws.onopen = () => {
            console.log(`[Binance WS] Connected to ${symbol} (kline + aggTrade)`);
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const data = message.data;
            if (!data) return;

            // Handle aggTrade (tick-by-tick updates - every trade!)
            if (data.e === 'aggTrade') {
                const price = parseFloat(data.p);
                setCurrentPrice(price);

                // Update the last candle's close price in real-time
                setCandles(prevCandles => {
                    if (prevCandles.length === 0) return prevCandles;
                    const lastCandle = { ...prevCandles[prevCandles.length - 1] };

                    // Calculate price change
                    if (prevCandles.length > 1) {
                        const prevClosedCandle = prevCandles[prevCandles.length - 2];
                        const change = ((price - prevClosedCandle.close) / prevClosedCandle.close) * 100;
                        setPriceChange(change);
                    }

                    // Update last candle with new close, high, low
                    lastCandle.close = price;
                    lastCandle.high = Math.max(lastCandle.high, price);
                    lastCandle.low = Math.min(lastCandle.low, price);

                    return [...prevCandles.slice(0, -1), lastCandle];
                });
                return;
            }

            // Handle kline (candle updates)
            if (data.e === 'kline') {
                const kline = data.k;
                const newCandle = {
                    time: kline.t / 1000,
                    open: parseFloat(kline.o),
                    high: parseFloat(kline.h),
                    low: parseFloat(kline.l),
                    close: parseFloat(kline.c),
                    volume: parseFloat(kline.v),
                    isClosed: kline.x,
                };

                setCurrentPrice(newCandle.close);

                setCandles(prevCandles => {
                    if (prevCandles.length === 0) return [newCandle];

                    const lastCandle = prevCandles[prevCandles.length - 1];

                    // Calculate price change
                    if (prevCandles.length > 1) {
                        const prevClosedCandle = prevCandles[prevCandles.length - 2];
                        const change = ((newCandle.close - prevClosedCandle.close) / prevClosedCandle.close) * 100;
                        setPriceChange(change);
                    }

                    // If same candle (same open time), update it
                    if (lastCandle.time === newCandle.time) {
                        return [...prevCandles.slice(0, -1), newCandle];
                    }

                    // New candle started
                    return [...prevCandles, newCandle].slice(-200);
                });
            }
        };

        ws.onerror = (error) => {
            console.error('[Binance WS] Error:', error);
            setIsConnected(false);
        };

        ws.onclose = () => {
            console.log('[Binance WS] Disconnected, reconnecting in 3s...');
            setIsConnected(false);

            // Auto-reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                connectWebSocket();
            }, 3000);
        };

        wsRef.current = ws;
    }, [symbol, interval]);

    // Initialize
    useEffect(() => {
        fetchHistoricalData();
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [fetchHistoricalData, connectWebSocket]);

    return {
        candles,
        currentPrice,
        priceChange,
        isConnected,
    };
};

/**
 * Hook for multiple symbols (for altcoin selector)
 */
export const useMultiSymbolPrice = (symbols = ['BTCUSDT', 'ETHUSDT']) => {
    const [prices, setPrices] = useState({});
    const wsRef = useRef(null);

    useEffect(() => {
        const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.data) {
                const ticker = data.data;
                setPrices(prev => ({
                    ...prev,
                    [ticker.s]: {
                        price: parseFloat(ticker.c),
                        change: parseFloat(ticker.P),
                    }
                }));
            }
        };

        wsRef.current = ws;

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [symbols.join(',')]);

    return prices;
};

export default useBinanceWebSocket;
