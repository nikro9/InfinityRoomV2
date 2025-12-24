// src/components/charts/TradingChart.jsx
// Updated for lightweight-charts v5+ API
import { useEffect, useRef, memo } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { motion } from 'framer-motion';
import LoadingSpinner from '../shared/LoadingSpinner';

const TradingChart = memo(({
    data = [],
    height = 500,
    showVolume = false,
    proposal = null,
    indicators = []
}) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    // Show loading if no data
    const hasData = data && data.length > 0;

    useEffect(() => {
        // Don't create chart if no container or no data
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
            // Create chart
            chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: height - 40,
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: 'rgba(255, 255, 255, 0.7)',
                },
                grid: {
                    vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                    horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
                },
                crosshair: {
                    mode: 1,
                    vertLine: {
                        color: 'rgba(73, 115, 255, 0.5)',
                        width: 1,
                        style: 2,
                    },
                    horzLine: {
                        color: 'rgba(73, 115, 255, 0.5)',
                        width: 1,
                        style: 2,
                    },
                },
                rightPriceScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                timeScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    timeVisible: true,
                    secondsVisible: false,
                },
                handleScroll: true,
                handleScale: true,
            });

            chartRef.current = chart;

            // Add candlestick series using v5 API
            const candlestickSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#00c853',
                downColor: '#ff5252',
                borderUpColor: '#00c853',
                borderDownColor: '#ff5252',
                wickUpColor: '#00c853',
                wickDownColor: '#ff5252',
            });

            // Transform and set data - ensure proper sorting
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

            // Add EMA indicator if present
            if (indicators.includes('ema') && data[0]?.ema_fast) {
                const emaSeries = chart.addSeries(LineSeries, {
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineWidth: 1,
                    crosshairMarkerVisible: false,
                });
                const emaData = data
                    .filter(d => d.ema_fast != null)
                    .map(d => ({
                        time: d.time || Math.floor(new Date(d.timestamp).getTime() / 1000),
                        value: parseFloat(d.ema_fast),
                    }))
                    .sort((a, b) => a.time - b.time);

                if (emaData.length > 0) {
                    emaSeries.setData(emaData);
                }
            }

            // Add SML lines if present
            if (data[0]?.sml_high && data[0]?.sml_low) {
                const smlHighSeries = chart.addSeries(LineSeries, {
                    color: 'rgba(0, 200, 83, 0.7)',
                    lineWidth: 2,
                    crosshairMarkerVisible: false,
                });
                const smlLowSeries = chart.addSeries(LineSeries, {
                    color: 'rgba(255, 82, 82, 0.7)',
                    lineWidth: 2,
                    crosshairMarkerVisible: false,
                });

                const smlHighData = data
                    .filter(d => d.sml_high != null)
                    .map(d => ({
                        time: d.time || Math.floor(new Date(d.timestamp).getTime() / 1000),
                        value: parseFloat(d.sml_high),
                    }))
                    .sort((a, b) => a.time - b.time);

                const smlLowData = data
                    .filter(d => d.sml_low != null)
                    .map(d => ({
                        time: d.time || Math.floor(new Date(d.timestamp).getTime() / 1000),
                        value: parseFloat(d.sml_low),
                    }))
                    .sort((a, b) => a.time - b.time);

                if (smlHighData.length > 0) smlHighSeries.setData(smlHighData);
                if (smlLowData.length > 0) smlLowSeries.setData(smlLowData);
            }

            // Draw trade proposal if present
            if (proposal?.entry_price) {
                candlestickSeries.createPriceLine({
                    price: proposal.entry_price,
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineWidth: 1,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: 'Entry',
                });

                if (proposal.stop_loss) {
                    candlestickSeries.createPriceLine({
                        price: proposal.stop_loss,
                        color: '#ff5252',
                        lineWidth: 1,
                        lineStyle: 2,
                        axisLabelVisible: true,
                        title: 'SL',
                    });
                }

                if (proposal.take_profit) {
                    candlestickSeries.createPriceLine({
                        price: proposal.take_profit,
                        color: '#00c853',
                        lineWidth: 1,
                        lineStyle: 2,
                        axisLabelVisible: true,
                        title: 'TP',
                    });
                }
            }

            chart.timeScale().fitContent();

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
    }, [data, proposal, indicators, height, hasData]);

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
                <LoadingSpinner text="Cargando gráfico..." />
            </motion.div>
        );
    }

    return (
        <motion.div
            className="chart-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ height }}
        >
            <div
                ref={chartContainerRef}
                style={{ width: '100%', height: '100%' }}
            />
        </motion.div>
    );
});

TradingChart.displayName = 'TradingChart';

export default TradingChart;
