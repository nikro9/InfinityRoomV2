# api/main.py
import os, json, asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import redis

REDIS_URL = os.getenv("REDIS_URL")
r = redis.from_url(REDIS_URL, decode_responses=True) if REDIS_URL else redis.Redis(host="redis", port=6379, decode_responses=True)

app = FastAPI(title="NEXUS Trading API", version="1.0")

# CORS - Allow Netlify frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.netlify.app",
        os.getenv("FRONTEND_URL", "*"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get(key: str):
    val = r.get(key)
    if val is None:
        raise HTTPException(404, f"Key not found: {key}")
    return json.loads(val)

def _list(key: str, count: int = 50):
    items = r.lrange(key, 0, count-1) or []
    return items

# --- BTC ---
BTC_PREFIX = os.getenv("BTC_REDIS_PREFIX", "IR:BTC")

@app.get("/api/btc/status")
def btc_status():
    return _get(f"{BTC_PREFIX}:status")

@app.get("/api/btc/chart")
def btc_chart():
    return _get(f"{BTC_PREFIX}:chart_data")

@app.get("/api/btc/chat")
def btc_chat(limit: int = 30):
    return {"items": _list(f"{BTC_PREFIX}:chat_log", limit)}

# --- ALTS ---
ALTS_PREFIX = os.getenv("ALTS_REDIS_PREFIX", "IR:ALTS")

def _alt_prefix(symbol: str) -> str:
    # workers guardan {prefix}:{SYMBOLSINSLASH}
    return f"{ALTS_PREFIX}:{symbol.upper()}"

@app.get("/api/alts/{symbol}/status")
def alt_status(symbol: str):
    return _get(f"{_alt_prefix(symbol)}:status")

@app.get("/api/alts/{symbol}/chart")
def alt_chart(symbol: str):
    return _get(f"{_alt_prefix(symbol)}:chart_data")

@app.get("/api/alts/{symbol}/chat")
def alt_chat(symbol: str, limit: int = 30):
    return {"items": _list(f"{_alt_prefix(symbol)}:chat_log", limit)}

# --- SSE: stream del chat (BTC o ALT) ---
@app.get("/api/stream/chat")
async def stream_chat(key: str, poll_ms: int = 1200):
    async def event_gen():
        last_seen = None
        while True:
            msgs = r.lrange(key, 0, 0)
            latest = msgs[0] if msgs else None
            if latest and latest != last_seen:
                last_seen = latest
                yield f"data: {json.dumps({'item': latest})}\n\n"
            await asyncio.sleep(poll_ms / 1000.0)
    return StreamingResponse(event_gen(), media_type="text/event-stream")

@app.get("/health")
def health():
    try:
        r.ping()
        return {"status": "healthy", "redis": True}
    except Exception as e:
        return {"status": "degraded", "redis": False, "error": str(e)}

