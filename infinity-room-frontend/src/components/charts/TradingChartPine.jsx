// src/components/charts/TradingChartPine.jsx
// Enhanced Trading Chart with PineScript indicator support
import { useEffect, useRef, memo, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { motion } from 'framer-motion';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useSimpleIndicators } from '../../hooks/usePineScript';

const INDICATOR_COLORS = {
    ema12: '#ffeb3b',
    ema26: '#ff9800',
    smlHigh: '#00c853',
    smlLow: '#ff5252',
};

const TradingChartPine = memo(({
    data = [],
    height = 500,
    showIndicators = true,
    proposal = null,
}) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const [chartReady, setChartReady] = useState(false);

    // Get calculated indicators
    const indicators = useSimpleIndicators(data);

    const hasData = data && data.length > 0;

    useEffect(() => {
        if (!chartContainerRef.current || !hasData) {
            return;
        }

        // Clean up any existing chart
        if (chartRef.current) {
            try {
                chartRef.current.remove();
            } catch (e) {
                // Chart may already be disposed
            }
            chartRef.current = null;
        }

        let chart = null;

        try {
            // Create chart with TradingView-like styling
            chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: height - 40,
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'JetBrains Mono', monospace",
                },
                grid: {
                    vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                    horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
                },
                crosshair: {
                    mode: 1,
                    vertLine: {
                        color: 'rgba(73, 115, 255, 0.5)',
                        width: 1,
                        style: 2,
                        labelBackgroundColor: '#4973ff',
                    },
                    horzLine: {
                        color: 'rgba(73, 115, 255, 0.5)',
                        width: 1,
                        style: 2,
                        labelBackgroundColor: '#4973ff',
                    },
                },
                rightPriceScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.2,
                    },
                },
                timeScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    timeVisible: true,
                    secondsVisible: false,
                    barSpacing: 8,
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                },
                handleScale: {
                    mouseWheel: true,
                    pinch: true,
                },
            });

            chartRef.current = chart;

            // Add candlestick series with TradingView-like colors
            const candlestickSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#26a69a',
                downColor: '#ef5350',
                borderUpColor: '#26a69a',
                borderDownColor: '#ef5350',
                wickUpColor: '#26a69a',
                wickDownColor: '#ef5350',
            });

            // Format and set candlestick data
            const formattedData = data
                .map(item => ({
                    time: item.time || Math.floor(new Date(item.timestamp).getTime() / 1000),
                    open: parseFloat(item.open),
                    high: parseFloat(item.high),
                    low: parseFloat(item.low),
                    close: parseFloat(item.close),
                }))
                .sort((a, b) => a.time - b.time);

            candlestickSeries.setData(formattedData);

            // Add indicators if enabled
            if (showIndicators) {
                // EMA 12 (fast)
                if (indicators.ema12.length > 0) {
                    const ema12Series = chart.addSeries(LineSeries, {
                        color: INDICATOR_COLORS.ema12,
                        lineWidth: 1,
                        crosshairMarkerVisible: false,
                        priceLineVisible: false,
                        lastValueVisible: false,
                    });
                    ema12Series.setData(indicators.ema12.sort((a, b) => a.time - b.time));
                }

                // EMA 26 (slow)
                if (indicators.ema26.length > 0) {
                    const ema26Series = chart.addSeries(LineSeries, {
                        color: INDICATOR_COLORS.ema26,
                        lineWidth: 1,
                        crosshairMarkerVisible: false,
                        priceLineVisible: false,
                        lastValueVisible: false,
                    });
                    ema26Series.setData(indicators.ema26.sort((a, b) => a.time - b.time));
                }

                // SML High (resistance)
                if (indicators.smlHigh.length > 0) {
                    const smlHighSeries = chart.addSeries(LineSeries, {
                        color: INDICATOR_COLORS.smlHigh,
                        lineWidth: 2,
                        lineStyle: 2, // Dashed
                        crosshairMarkerVisible: false,
                        priceLineVisible: false,
                        lastValueVisible: false,
                    });
                    smlHighSeries.setData(indicators.smlHigh.sort((a, b) => a.time - b.time));
                }

                // SML Low (support)
                if (indicators.smlLow.length > 0) {
                    const smlLowSeries = chart.addSeries(LineSeries, {
                        color: INDICATOR_COLORS.smlLow,
                        lineWidth: 2,
                        lineStyle: 2, // Dashed
                        crosshairMarkerVisible: false,
                        priceLineVisible: false,
                        lastValueVisible: false,
                    });
                    smlLowSeries.setData(indicators.smlLow.sort((a, b) => a.time - b.time));
                }
            }

            // Draw trade proposal if present
            if (proposal?.entry_price) {
                candlestickSeries.createPriceLine({
                    price: proposal.entry_price,
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineWidth: 1,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: `Entry`,
                });

                if (proposal.stop_loss) {
                    candlestickSeries.createPriceLine({
                        price: proposal.stop_loss,
                        color: '#ff5252',
                        lineWidth: 1,
                        lineStyle: 0,
                        axisLabelVisible: true,
                        title: 'SL',
                    });
                }

                if (proposal.take_profit) {
                    candlestickSeries.createPriceLine({
                        price: proposal.take_profit,
                        color: '#00c853',
                        lineWidth: 1,
                        lineStyle: 0,
                        axisLabelVisible: true,
                        title: 'TP',
                    });
                }
            }

            chart.timeScale().fitContent();
            setChartReady(true);

        } catch (err) {
            console.error('Chart creation error:', err);
        }

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                try {
                    chartRef.current.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                    });
                } catch (e) {
                    // Chart may be disposed
                }
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                try {
                    chartRef.current.remove();
                } catch (e) {
                    // Chart may already be removed
                }
                chartRef.current = null;
            }
        };
    }, [data, proposal, height, hasData, indicators, showIndicators]);

    // Show loading spinner when no data
    if (!hasData) {
        return (
            <motion.div
                className="chart-container flex items-center justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ height }}
            >
                <LoadingSpinner text="Cargando datos de mercado..." />
            </motion.div>
        );
    }

    return (
        <motion.div
            className="chart-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ height, position: 'relative' }}
        >
            {/* Indicator Legend */}
            {showIndicators && (
                <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 10,
                    display: 'flex',
                    gap: '12px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                }}>
                    <span style={{ color: INDICATOR_COLORS.ema12 }}>● EMA 12</span>
                    <span style={{ color: INDICATOR_COLORS.ema26 }}>● EMA 26</span>
                    <span style={{ color: INDICATOR_COLORS.smlHigh }}>⬤ SML High</span>
                    <span style={{ color: INDICATOR_COLORS.smlLow }}>⬤ SML Low</span>
                </div>
            )}
            <div
                ref={chartContainerRef}
                style={{ width: '100%', height: '100%' }}
            />
        </motion.div>
    );
});

TradingChartPine.displayName = 'TradingChartPine';

export default TradingChartPine;
