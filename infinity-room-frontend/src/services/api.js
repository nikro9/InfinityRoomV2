// src/services/api.js
import axios from 'axios';

// API Base URL - will be configured for Render deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add any authentication headers here if needed
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

// ============================================
// Bitcoin Pivots API
// ============================================
export const bitcoinApi = {
    getStatus: () => api.get('/btc/status'),
    getChartData: () => api.get('/btc/chart'),
};

// ============================================
// Altcoins Pivots API
// ============================================
export const altcoinsApi = {
    getStatus: (symbol) => api.get(`/altcoins/${symbol}/status`),
    getChartData: (symbol) => api.get(`/altcoins/${symbol}/chart`),
    getAvailableAssets: () => api.get('/altcoins/assets'),
};

// ============================================
// Chat / AI Logs API
// ============================================
export const chatApi = {
    getLogs: (channel) => api.get(`/chat/${channel}/logs`),
    getAvailableChannels: () => api.get('/chat/channels'),
    clearChannel: (channel) => api.delete(`/chat/${channel}`),
};

// ============================================
// Trades / Activity Log API
// ============================================
export const tradesApi = {
    getTrades: () => api.get('/trades'),
    getActivityLog: () => api.get('/trades/log'),
};

// ============================================
// Backtest API
// ============================================
export const backtestApi = {
    runBacktest: (params) => api.post('/backtest/run', params),
    getResults: (id) => api.get(`/backtest/results/${id}`),
};

// ============================================
// Performance / Simulator API
// ============================================
export const performanceApi = {
    getHistoricalTrades: () => api.get('/performance/trades'),
    getEquityCurve: () => api.get('/performance/equity'),
    simulate: (capital, days) => api.post('/performance/simulate', { capital, days }),
};

export default api;
