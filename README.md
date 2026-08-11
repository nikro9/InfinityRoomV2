# Kublai Trading Platform (InfinityRoomV2) 📈🤖

> **Note:** This is a personal, work-in-progress (WIP) project. It is actively being developed as a proof-of-concept for an AI-driven trading infrastructure. Some features might be in active development, experimental, or not yet 100% functional.

Kublai is an AI-powered cryptocurrency trading and market analysis platform. It leverages multiple LLMs (Large Language Models) to analyze market structure, simulate deterministic trading strategies, and provide a unified dashboard for real-time monitoring of crypto assets.

## 🎯 What Problem Does It Solve?

Automated trading bots often rely on rigid, hardcoded mathematical rules (e.g., RSI crosses). Kublai aims to introduce **contextual AI analysis** into the loop. By providing market data (OHLCV, indicators) to LLMs, the system attempts to build a consensus-based decision-making pipeline. It helps answer the question: *"Can AI analyze raw market structure and technical indicators to make profitable, risk-managed trading decisions?"*

## 🛠️ Technical Stack

- **Backend:** Python 3.12+, FastAPI, Uvicorn, CCXT (for exchange data).
- **Frontend:** React 19, Vite, TailwindCSS, Lightweight Charts.
- **AI / Inference:** Groq, Google Gemini, OpenAI, DeepSeek (via direct API or TogetherAI).
- **Databases & State:** Upstash Redis (for fast, ephemeral state, pub/sub, and persistent logging).
- **Infrastructure:** Render (Backend API + Embedded Workers), Netlify (Frontend).

## 🏗️ Architecture

The system is designed with a unified architecture to keep infrastructure costs minimal while maintaining high performance:

1. **API Layer (FastAPI):** Serves the frontend requests, exposes endpoints for chart data, backtesting, and AI chat.
2. **Embedded Workers:** The trading bots (`infinity_worker.py` and `altcoin_worker.py`) run as non-blocking daemon threads within the main FastAPI process. This eliminates the need for separate paid worker dynos/services.
3. **Data Layer (Upstash Redis):** Used as the central nervous system. Workers write real-time signals, consensus data, and status updates to Redis, which the API then serves to the frontend.
4. **Frontend Dashboard (React):** A sleek, modern dashboard that connects to both the FastAPI backend (for historical and AI data) and Binance WebSockets (for live price action).

## 🧠 AI Approach & Trading Logic

The core of Kublai relies on a **multi-agent consensus model** executing a specific deterministic logic known as the **"PUPU 5m Strategy"**. 

### The Strategy (PUPU 5m)
- **Data Aggregation:** The system fetches 5-minute historical data via CCXT and computes specific indicators: **EMA 12**, **RSI 14**, **ATR 14**, and **Donchian Channels (400 periods)** to identify true liquidity sweeps.
- **Execution Logic:** The bot looks for the price to sweep the 400-period Donchian Low (for Longs) or High (for Shorts) and waits for a confirming 5m candle close across the EMA 12 within a specific 20-candle validity window.

### The 4-Agent Consensus Pipeline
Once the mathematical criteria are near triggering, the data is passed to the AI committee:
1. **Liquidity Analyst (Llama 3 70B):** Analyzes raw Order Flow and Delta to ensure institutional backing.
2. **Setup Analyst (Llama 3 70B):** Validates the mathematical setup (Donchian sweep + EMA crossover timeframe).
3. **Momentum Analyst (Llama 3 8B):** Confirms if the trigger candle has enough decisive momentum.
4. **Risk Manager (Llama 3 8B):** The final filter. Purely quantitative. Calculates precise Stop Loss based on ATR and enforces a strict 1:1.7 Risk/Reward ratio.

A trade proposal is only generated if all 4 agents reach a positive consensus.

## 🚀 Current Status

### Functional Parts (Working)
- ✅ **Backend API & Routing:** Endpoints for BTC and Altcoins status, charts, and activity logs.
- ✅ **Embedded Workers:** Daemon threads successfully pull data, invoke the AI models, and write to Redis.
- ✅ **Frontend Dashboard:** Real-time Binance WebSocket integration, interactive charts, and live AI status monitoring.
- ✅ **Telegram Integration:** Alerting system for executed trades and important market shifts.
- ✅ **Deployment:** Fully dockerized backend on Render and static frontend on Netlify.

### Incomplete / In Development
- 🚧 **Live Order Execution:** Currently operates in a "paper-trading" or signal-only mode. Live execution via Binance API is still being heavily tested.
- 🚧 **Backtesting Engine:** The deterministic backtesting lab is functional but being refactored for better accuracy with funding rates and slippage.
- 🚧 **Altcoin Rotation:** The altcoin worker is functional but the selection logic is still being fine-tuned.

## 💻 Local Development

### Prerequisites
- Python 3.12 or higher.
- Node.js 18+ and npm.
- A free Upstash Redis database.

### 1. Setup Backend
```bash
# Clone the repository
git clone https://github.com/nikro9/InfinityRoomV2.git
cd InfinityRoomV2

# Create a virtual environment and install dependencies
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r backend-requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys and Redis URL
```

### 2. Setup Frontend
```bash
cd infinity-room-frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

### 3. Run the Application
Start the backend server (which automatically spawns the trading workers if `ENABLE_WORKERS=true`):
```bash
# From the root directory
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
The API will be available at `http://localhost:8000/api` and the frontend at `http://localhost:5173`.

## 🔐 Environment Variables

You need to define the following variables in a `.env` file at the root of the project. See `.env.example` for the complete list.
- **AI Keys:** `GROQ_API_KEY`, `GOOGLE_API_KEY`, etc.
- **Databases:** `REDIS_URL`
- **Bot Config:** `ENABLE_WORKERS=true`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

---
*Kublai is an ongoing experiment in autonomous trading architecture.*
