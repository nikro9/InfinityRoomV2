# api/main.py
# Kublai Trading Platform — Unified API + Workers
# All workers run as background threads inside the API process
# This avoids the need for paid Render background workers
import os, json, asyncio, threading, time, sys
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import redis

# --- REDIS CONNECTION ---
REDIS_URL = os.getenv("REDIS_URL")
if REDIS_URL:
    r = redis.from_url(REDIS_URL, decode_responses=True)
else:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Test Redis connection (don't crash if offline during development)
REDIS_AVAILABLE = False
try:
    r.ping()
    REDIS_AVAILABLE = True
    print("✅ Redis connection established")
except Exception as e:
    print(f"⚠️ Redis not available: {e}. Running in offline mode.")

app = FastAPI(title="Kublai Trading API", version="2.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:3000",
        "https://*.netlify.app",
        os.getenv("FRONTEND_URL", "*"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REDIS KEY PREFIXES ---
# MUST match what the workers write in config.py
BTC_PREFIX = "infinity_room:btc_pivots"
ALTS_PREFIX = "infinity_room:alt_pivots"

ALTCOIN_ASSETS = [
    "ETH/USDT", "XRP/USDT", "BNB/USDT", "SOL/USDT", "DOGE/USDT",
    "TRX/USDT", "ADA/USDT", "LTC/USDT", "BCH/USDT", "LINK/USDT"
]


def _get(key: str):
    if not REDIS_AVAILABLE:
        return None
    val = r.get(key)
    if val is None:
        return None
    try:
        return json.loads(val)
    except json.JSONDecodeError:
        return val

def _get_or_404(key: str):
    val = _get(key)
    if val is None:
        raise HTTPException(404, f"No data available yet for key: {key}")
    return val

def _list(key: str, count: int = 50):
    if not REDIS_AVAILABLE:
        return []
    items = r.lrange(key, 0, count - 1) or []
    return items


# ============================================
# BTC Endpoints
# ============================================
@app.get("/api/btc/status")
def btc_status():
    data = _get(f"{BTC_PREFIX}:status")
    if data is None:
        return {"status": "OFFLINE", "reasoning": "Worker no conectado. Esperando datos...", "proposal": None}
    return data

@app.get("/api/btc/chart")
def btc_chart():
    return _get_or_404(f"{BTC_PREFIX}:chart_data")

@app.get("/api/btc/chat")
def btc_chat(limit: int = 30):
    return {"items": _list(f"{BTC_PREFIX}:chat_log", limit)}


# ============================================
# Altcoins Endpoints
# ============================================
def _alt_prefix(symbol: str) -> str:
    clean = symbol.upper().replace("/", "")
    return f"{ALTS_PREFIX}:{clean}"

@app.get("/api/altcoins/assets")
def alt_assets():
    return {"assets": ALTCOIN_ASSETS}

@app.get("/api/altcoins/{symbol}/status")
def alt_status(symbol: str):
    data = _get(f"{_alt_prefix(symbol)}:status")
    if data is None:
        return {"status": "OFFLINE", "reasoning": "Worker no conectado.", "proposal": None}
    return data

@app.get("/api/altcoins/{symbol}/chart")
def alt_chart(symbol: str):
    return _get_or_404(f"{_alt_prefix(symbol)}:chart_data")

@app.get("/api/altcoins/{symbol}/chat")
def alt_chat(symbol: str, limit: int = 30):
    return {"items": _list(f"{_alt_prefix(symbol)}:chat_log", limit)}


# ============================================
# Chat / AI Logs
# ============================================
@app.get("/api/chat/{channel}/logs")
def chat_logs(channel: str, limit: int = 30):
    if channel.lower() == "btc":
        key = f"{BTC_PREFIX}:chat_log"
    else:
        key = f"{_alt_prefix(channel)}:chat_log"
    return {"items": _list(key, limit)}

@app.get("/api/chat/channels")
def chat_channels():
    channels = ["btc"] + [a.replace("/USDT", "").lower() for a in ALTCOIN_ASSETS]
    return {"channels": channels}


# ============================================
# Trades / Activity Log
# ============================================
@app.get("/api/trades")
def get_trades():
    trades = []
    btc_data = _get(f"{BTC_PREFIX}:status")
    if btc_data and btc_data.get("proposal"):
        trades.append({"asset": "BTC/USDT", **btc_data["proposal"]})
    for asset in ALTCOIN_ASSETS:
        clean = asset.replace("/", "")
        alt_data = _get(f"{ALTS_PREFIX}:{clean}:status")
        if alt_data and alt_data.get("proposal"):
            trades.append({"asset": asset, **alt_data["proposal"]})
    return {"trades": trades}

@app.get("/api/trades/log")
def get_activity_log():
    log = []
    btc_logs = _list(f"{BTC_PREFIX}:log", 20)
    for entry in btc_logs:
        log.append({"asset": "BTC/USDT", "entry": entry})
    for asset in ALTCOIN_ASSETS:
        clean = asset.replace("/", "")
        alt_logs = _list(f"{ALTS_PREFIX}:{clean}:log", 5)
        for entry in alt_logs:
            log.append({"asset": asset, "entry": entry})
    return {"log": log}


# ============================================
# Backtest (placeholder)
# ============================================
@app.post("/api/backtest/run")
def run_backtest(params: dict = {}):
    return {"status": "not_implemented", "message": "Backtesting runs client-side. Server-side coming soon."}

@app.get("/api/backtest/results/{result_id}")
def get_backtest_results(result_id: str):
    return _get_or_404(f"backtest:results:{result_id}")


# ============================================
# Performance
# ============================================
@app.get("/api/performance/trades")
def get_perf_trades():
    data = _get("performance:trades")
    return data or {"trades": []}

@app.get("/api/performance/equity")
def get_equity_curve():
    data = _get("performance:equity")
    return data or {"curve": []}

@app.post("/api/performance/simulate")
def simulate_performance(params: dict = {}):
    capital = params.get("capital", 1000)
    days = params.get("days", 30)
    return {"projected_capital": capital, "growth": 0, "message": "Connect workers to generate real data."}


# ============================================
# SSE Chat Stream
# ============================================
@app.get("/api/stream/chat")
async def stream_chat(key: str, poll_ms: int = 1200):
    async def event_gen():
        last_seen = None
        while True:
            msgs = r.lrange(key, 0, 0) if REDIS_AVAILABLE else []
            latest = msgs[0] if msgs else None
            if latest and latest != last_seen:
                last_seen = latest
                yield f"data: {json.dumps({'item': latest})}\n\n"
            await asyncio.sleep(poll_ms / 1000.0)
    return StreamingResponse(event_gen(), media_type="text/event-stream")


# ============================================
# Health & Keep-Alive
# ============================================
@app.get("/health")
def health():
    redis_ok = False
    if REDIS_AVAILABLE:
        try:
            r.ping()
            redis_ok = True
        except Exception:
            pass
    return {
        "status": "healthy" if redis_ok else "degraded",
        "redis": redis_ok,
        "workers": {
            "btc": bool(_get(f"{BTC_PREFIX}:status")) if redis_ok else False,
            "alts": bool(_get(f"{ALTS_PREFIX}:ETHUSDT:status")) if redis_ok else False,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/ping")
def ping():
    """Ultra-lightweight endpoint for keep-alive services like UptimeRobot."""
    return {"pong": True}


# ============================================
# EMBEDDED WORKERS (run as background threads)
# This allows running everything in a single Render web service
# ============================================
ENABLE_EMBEDDED_WORKERS = os.getenv("ENABLE_WORKERS", "false").lower() == "true"

def _run_btc_worker():
    """BTC Worker running as a background thread inside the API process."""
    if not REDIS_AVAILABLE:
        print("⚠️ BTC Worker: Redis not available, skipping.")
        return
    
    # Import worker dependencies
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    try:
        from src import config
        from src.market_data import get_historical_data
        from src.indicators import calculate_ema, calculate_rsi, calculate_donchian_channel, calculate_atr
        from src.ai_model import get_infinity_room_decision
        from src.notifications import send_telegram_message
        import pandas as pd
    except ImportError as e:
        print(f"❌ BTC Worker: Import error: {e}")
        return

    STRATEGY_CONFIG = config.STRATEGIES["BITCOIN_PIVOTS"]
    REDIS_PREFIX = STRATEGY_CONFIG["redis_prefix"]
    SYMBOL = STRATEGY_CONFIG["symbol"]

    print(f"▶️ Embedded BTC Worker started for {SYMBOL}")

    while True:
        try:
            data = get_historical_data(symbol=SYMBOL, timeframe=STRATEGY_CONFIG["timeframe_operativa"], days=15)
            if data:
                df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                df.set_index('timestamp', inplace=True)

                # Calculate indicators
                required = 405
                if len(df) >= required:
                    df['ema_12'] = calculate_ema(df['close'], period=config.EMA_FAST_PERIOD)
                    df['rsi_14'] = calculate_rsi(df['close'], period=config.RSI_PERIOD)
                    
                    df = calculate_donchian_channel(df, period=400)
                    df['atr_14'] = calculate_atr(df, period=14)
                    
                    df_merged = df.dropna().copy()

                    if len(df_merged) >= 40:
                        mock_order_flow = {"buy_volume": 0, "sell_volume": 0, "delta": 0, "trade_count": 0}
                        timestamp_utc = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
                        
                        proposal, reasoning, full_analysis = get_infinity_room_decision(df_merged, mock_order_flow)

                        status_update = {"status": "PROPOSAL" if proposal else "IDLE", "reasoning": reasoning, "proposal": proposal}
                        r.set(f"{REDIS_PREFIX}:status", json.dumps(status_update))

                        log_entry = f"[{timestamp_utc}] - {reasoning}"
                        r.lpush(f"{REDIS_PREFIX}:log", log_entry)
                        r.ltrim(f"{REDIS_PREFIX}:log", 0, 99)

                        # Chat log
                        chat_entry = f"**Analisis BTC {timestamp_utc}:**\n\n"
                        for analyst, analysis in full_analysis.items():
                            chat_entry += f"**{analyst}:** {json.dumps(analysis)}\n"
                        if proposal:
                            chat_entry += f"\n**DECISION:** Trade APROBADO. {reasoning}"
                        else:
                            chat_entry += f"\n**DECISION:** {reasoning}"
                        r.lpush(f"{REDIS_PREFIX}:chat_log", chat_entry)
                        r.ltrim(f"{REDIS_PREFIX}:chat_log", 0, 49)

                        # Chart data
                        df_chart = df_merged.tail(200).reset_index().rename(columns={'ema_12': 'ema_fast', 'rsi_14': 'rsi'})
                        chart_json = json.loads(df_chart.to_json(orient='split'))
                        r.set(f"{REDIS_PREFIX}:chart_data", json.dumps(chart_json))

                        # Telegram
                        if proposal:
                            try:
                                msg = (
                                    f"🚨 *SEÑAL - {SYMBOL}*\n\n"
                                    f"📌 {proposal.get('type', 'N/A')}\n"
                                    f"💰 Entry: `{proposal.get('entry_price', 'N/A')}`\n"
                                    f"🛑 SL: `{proposal.get('stop_loss', 'N/A')}`\n"
                                    f"🎯 TP: `{proposal.get('take_profit', 'N/A')}`"
                                )
                                send_telegram_message(msg)
                            except Exception as e:
                                print(f"Telegram error: {e}")

                        print(f"[BTC] Cycle done: {reasoning[:80]}")

            # Wait for next candle
            now = datetime.utcnow()
            minutes_to_next = 5 - (now.minute % 5)
            seconds_to_wait = (minutes_to_next - 1) * 60 + (60 - now.second)
            time.sleep(max(30, seconds_to_wait))

        except Exception as e:
            print(f"❌ BTC Worker error: {e}")
            time.sleep(60)


def _run_altcoin_worker():
    """Altcoin Worker running as a background thread inside the API process."""
    if not REDIS_AVAILABLE:
        print("⚠️ Altcoin Worker: Redis not available, skipping.")
        return
    
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    try:
        from src import config
        from src.market_data import get_historical_data
        from src.indicators import calculate_ema, calculate_rsi, calculate_donchian_channel, calculate_atr
        from src.ai_model import get_infinity_room_decision
        from src.notifications import send_telegram_message
        import pandas as pd
    except ImportError as e:
        print(f"❌ Altcoin Worker: Import error: {e}")
        return

    STRATEGY_CONFIG = config.STRATEGIES["ALTCOIN_PIVOTS"]
    print(f"▶️ Embedded Altcoin Worker started for {STRATEGY_CONFIG['asset_list']}")

    while True:
        try:
            for asset in STRATEGY_CONFIG["asset_list"]:
                redis_prefix = f"{STRATEGY_CONFIG['redis_prefix']}:{asset.replace('/', '')}"

                data = get_historical_data(symbol=asset, timeframe=STRATEGY_CONFIG["timeframe_operativa"], days=15)
                if not data:
                    continue

                df = pd.DataFrame(data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                df.set_index('timestamp', inplace=True)

                required = 405
                if len(df) < required:
                    continue

                df['ema_12'] = calculate_ema(df['close'], period=config.EMA_FAST_PERIOD)
                df['rsi_14'] = calculate_rsi(df['close'], period=config.RSI_PERIOD)
                
                df = calculate_donchian_channel(df, period=400)
                df['atr_14'] = calculate_atr(df, period=14)

                df_merged = df.dropna().copy()
                if len(df_merged) < 40:
                    continue

                mock_flow = {"buy_volume": 0, "sell_volume": 0, "delta": 0, "trade_count": 0}
                timestamp_utc = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')

                proposal, reasoning, full_analysis = get_infinity_room_decision(df_merged, mock_flow)

                status_update = {"status": "PROPOSAL" if proposal else "IDLE", "reasoning": reasoning, "proposal": proposal}
                r.set(f"{redis_prefix}:status", json.dumps(status_update))

                log_entry = f"[{timestamp_utc}] - {reasoning}"
                r.lpush(f"{redis_prefix}:log", log_entry)
                r.ltrim(f"{redis_prefix}:log", 0, 99)

                chat_entry = f"**{asset} {timestamp_utc}:**\n{reasoning}"
                r.lpush(f"{redis_prefix}:chat_log", chat_entry)
                r.ltrim(f"{redis_prefix}:chat_log", 0, 49)

                df_chart = df_merged.tail(200).reset_index().rename(columns={'ema_12': 'ema_fast', 'rsi_14': 'rsi'})
                chart_json = json.loads(df_chart.to_json(orient='split'))
                r.set(f"{redis_prefix}:chart_data", json.dumps(chart_json))

                if proposal:
                    try:
                        msg = f"🚨 *SEÑAL - {asset}*\n📌 {proposal.get('type')}\n💰 Entry: `{proposal.get('entry_price')}`"
                        send_telegram_message(msg)
                    except Exception:
                        pass

                print(f"[{asset}] Cycle done")
                time.sleep(10)  # Small delay between assets to avoid rate limiting

            print(f"[ALTS] All assets analyzed. Next cycle in 5 min.")
            time.sleep(300)

        except Exception as e:
            print(f"❌ Altcoin Worker error: {e}")
            time.sleep(60)


@app.on_event("startup")
async def startup_event():
    """Start embedded workers as daemon threads if enabled."""
    if ENABLE_EMBEDDED_WORKERS and REDIS_AVAILABLE:
        print("🚀 Starting embedded workers...")
        btc_thread = threading.Thread(target=_run_btc_worker, daemon=True)
        btc_thread.start()
        
        # Stagger alt worker start to avoid simultaneous API calls
        alt_thread = threading.Thread(target=_run_altcoin_worker, daemon=True)
        alt_thread.start()
        print("✅ Workers started as background threads")
    elif ENABLE_EMBEDDED_WORKERS and not REDIS_AVAILABLE:
        print("⚠️ Workers requested but Redis is offline. Workers NOT started.")
    else:
        print("ℹ️ Embedded workers disabled. Set ENABLE_WORKERS=true to activate.")
