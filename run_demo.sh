#!/bin/bash
set -e

# Ensure local loopback health checks bypass any proxy settings
unset http_proxy https_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY
export no_proxy="*" NO_PROXY="*"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
BACKEND_LOG="/tmp/veritrust-backend.log"
FRONTEND_LOG="/tmp/veritrust-frontend.log"

echo "================================================================="
echo "  🛡️  VeriTrust AI — Dual-Agent Hallucination Guardrail System  "
echo "  GDG on Campus GRIET — AI & Machine Learning Track              "
echo "================================================================="

# ── 0. Kill anything already on our ports ──────────────────────────
echo -e "\n0. Cleaning up stale processes on ports 8000 / 5173..."
lsof -ti:8000,5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Trap to kill child processes on exit
trap 'echo -e "\n🛑 Shutting down VeriTrust AI servers..."; kill $(jobs -p) 2>/dev/null; exit' SIGINT SIGTERM

# ── 1. Backend ─────────────────────────────────────────────────────
echo -e "\n1. Starting FastAPI Backend (Port 8000)..."
cd "$DIR/backend"
if [ ! -d ".venv" ]; then
    echo "   Creating python virtualenv..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

# Copy .env from example if missing
if [ ! -f ".env" ]; then
    echo "   Creating .env from .env.example..."
    cp .env.example .env
fi

.venv/bin/uvicorn app.main:app --port 8000 --host 0.0.0.0 > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Wait up to 15 seconds for backend to respond
echo -n "   Waiting for backend to respond"
for i in $(seq 1 15); do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "\n\n❌  Backend process (PID $BACKEND_PID) died on startup."
        echo "────────────────── backend log ──────────────────"
        cat "$BACKEND_LOG"
        echo "─────────────────────────────────────────────────"
        exit 1
    fi
    if curl -sf --noproxy "*" http://127.0.0.1:8000/docs > /dev/null 2>&1; then
        echo -e " ✅  (${i}s)"
        break
    fi
    echo -n "."
    sleep 1
done

# Final check — did it actually answer?
if ! curl -sf --noproxy "*" http://127.0.0.1:8000/docs > /dev/null 2>&1; then
    echo -e "\n\n❌  Backend started but never responded to HTTP after 15 s."
    echo "────────────────── backend log ──────────────────"
    cat "$BACKEND_LOG"
    echo "─────────────────────────────────────────────────"
    kill "$BACKEND_PID" 2>/dev/null
    exit 1
fi

# ── 2. Frontend ────────────────────────────────────────────────────
echo -e "\n2. Starting React + Vite Frontend (Port 5173)..."
cd "$DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    npm install
fi

npm run dev -- --host 0.0.0.0 > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Wait up to 15 seconds for frontend to respond
echo -n "   Waiting for frontend to respond"
for i in $(seq 1 15); do
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "\n\n❌  Frontend process (PID $FRONTEND_PID) died on startup."
        echo "────────────────── frontend log ──────────────────"
        cat "$FRONTEND_LOG"
        echo "──────────────────────────────────────────────────"
        kill "$BACKEND_PID" 2>/dev/null
        exit 1
    fi
    if curl -sf --noproxy "*" http://127.0.0.1:5173/ > /dev/null 2>&1; then
        echo -e " ✅  (${i}s)"
        break
    fi
    echo -n "."
    sleep 1
done

# Final check — did it actually answer?
if ! curl -sf --noproxy "*" http://127.0.0.1:5173/ > /dev/null 2>&1; then
    echo -e "\n\n❌  Frontend started but never responded to HTTP after 15 s."
    echo "────────────────── frontend log ──────────────────"
    cat "$FRONTEND_LOG"
    echo "──────────────────────────────────────────────────"
    kill "$BACKEND_PID" 2>/dev/null
    kill "$FRONTEND_PID" 2>/dev/null
    exit 1
fi

# ── 3. Both LIVE and CONFIRMED ─────────────────────────────────────
echo ""
echo "================================================================="
echo "  ✅ VeriTrust AI is LIVE and CONFIRMED responding!"
echo ""
echo "  🌐 Frontend Dashboard:       http://127.0.0.1:5173"
echo "  ⚙️  FastAPI Swagger Docs:     http://127.0.0.1:8000/docs"
echo "  🧑‍⚖️ Human Review Queue:       http://127.0.0.1:5173/review"
echo "  🛍️  Storefront Simulator:     http://127.0.0.1:5173/integration"
echo "  📊 Telemetry & Drift:        http://127.0.0.1:5173/metrics"
echo "  🎯 Attack Mode:              http://127.0.0.1:5173 (toggle)"
echo ""
echo "  📄 Backend log:  $BACKEND_LOG"
echo "  📄 Frontend log: $FRONTEND_LOG"
echo "================================================================="
echo "Press Ctrl+C to stop all servers."

wait
