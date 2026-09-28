"""
VeriTrust AI — FastAPI Backend
Hardened Dual-Agent Maker & Judge Hallucination Guardrail System
"""

from dotenv import load_dotenv
load_dotenv()

import time
import logging
from collections import defaultdict
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException, Security, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from app.config import settings
from app.routes import chat, metrics, knowledge, review, workspaces
import app.knowledge.loader as loader

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("veritrust")

# Rate limiting data structure (IP -> list of timestamps)
RATE_LIMIT_BUCKET = defaultdict(list)

# Admin API Key header definition
API_KEY_HEADER = APIKeyHeader(name="X-Admin-API-Key", auto_error=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load knowledge base on startup."""
    logger.info(f"Starting {settings.APP_NAME}...")
    loader.load_and_embed_documents()
    logger.info(f"Knowledge base loaded. Demo mode: {settings.DEMO_MODE}")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    description="Dual-Agent Maker & Judge Hallucination Guardrail System",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG or settings.EXPOSE_DOCS else None,
    redoc_url=None,
    lifespan=lifespan
)


# 1. Rate Limiting Middleware (Proxy & Cloudflare aware)
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    elif request.headers.get("CF-Connecting-IP"):
        client_ip = request.headers.get("CF-Connecting-IP")
    else:
        client_ip = request.client.host if request.client else "127.0.0.1"

    now = time.time()
    window = 60.0  # 1 minute sliding window

    # Clean old timestamps
    RATE_LIMIT_BUCKET[client_ip] = [
        ts for ts in RATE_LIMIT_BUCKET[client_ip] if now - ts < window
    ]

    if len(RATE_LIMIT_BUCKET[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return JSONResponse(
            status_code=429,
            content={
                "error": "Too Many Requests",
                "message": f"Rate limit exceeded. Maximum {settings.RATE_LIMIT_PER_MINUTE} requests per minute allowed."
            }
        )

    RATE_LIMIT_BUCKET[client_ip].append(now)
    response = await call_next(request)
    return response


# 2. Security Headers Middleware (Strict CSP, Clickjacking & MIME Protection)
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "script-src 'self'; "
        "img-src 'self' data:; "
        "connect-src 'self' https://veritrust-ai-271n.onrender.com wss://veritrust-ai-271n.onrender.com;"
    )
    return response


# 3. Global Exception Handler (No Stack Traces)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Guardrail Error",
            "message": "An unexpected error occurred while verifying the request. Please try again.",
            "code": "VERIFICATION_ENGINE_ERROR"
        }
    )


# 4. CORS Configuration
cors_origins = settings.ALLOWED_ORIGINS if not settings.PERMISSIVE_CORS else ["*"]
allow_creds = not settings.PERMISSIVE_CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_creds,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Route Mounting
app.include_router(workspaces.router, prefix="/api", tags=["Workspaces"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(metrics.router, prefix="/api", tags=["Metrics"])
app.include_router(knowledge.router, prefix="/api", tags=["Knowledge Base"])
app.include_router(review.router, prefix="/api", tags=["Human Review"])


# Admin security verification helper
async def verify_admin_key(api_key: str = Security(API_KEY_HEADER)):
    if not settings.ADMIN_API_KEY:
        if settings.DEMO_MODE:
            return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access disabled: ADMIN_API_KEY environment variable is not configured."
        )
    if not api_key or api_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing Admin API Key."
        )
    return True


@app.get("/api/admin/status")
async def admin_status(authorized: bool = Security(verify_admin_key)):
    return {
        "status": "online",
        "guardrail_state": "active",
        "rate_limiting": "enabled",
        "demo_mode": settings.DEMO_MODE,
        "security_headers": "enforced"
    }


FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/favicon.svg")
    async def favicon():
        fav = FRONTEND_DIST / "favicon.svg"
        if fav.exists():
            return FileResponse(fav)
        raise HTTPException(status_code=404)

    @app.get("/og-image.svg")
    async def og_image():
        img = FRONTEND_DIST / "og-image.svg"
        if img.exists():
            return FileResponse(img)
        raise HTTPException(status_code=404)


@app.get("/")
async def root(request: Request):
    accept = request.headers.get("accept", "")
    # If opened by a browser, serve the full dashboard web application
    if "text/html" in accept and FRONTEND_DIST.exists():
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
    # Otherwise return API metadata
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "description": "Dual-Agent Maker & Judge Hallucination Guardrail System",
        "demo_mode": settings.DEMO_MODE,
        "endpoints": {
            "chat": "/api/chat",
            "compare": "/api/chat/compare",
            "maker_only": "/api/chat/maker-only",
            "metrics": "/api/metrics",
            "documents": "/api/knowledge/documents",
            "search": "/api/knowledge/search",
            "websocket": "/api/ws",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": time.time()}


@app.get("/api/health/llm")
async def llm_health():
    """Check LLM provider availability and configuration."""
    import httpx
    from app.config import settings
    
    results = {}
    
    # Check OpenAI
    if settings.OPENAI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
                )
                results["openai"] = {
                    "available": resp.status_code == 200,
                    "model": settings.OPENAI_MODEL,
                    "status": "configured" if resp.status_code == 200 else f"error: {resp.status_code}"
                }
        except Exception as e:
            results["openai"] = {
                "available": False,
                "model": settings.OPENAI_MODEL,
                "status": f"error: {str(e)[:100]}"
            }
    else:
        results["openai"] = {
            "available": False,
            "model": settings.OPENAI_MODEL,
            "status": "not_configured"
        }
    
    # Check Anthropic
    if settings.ANTHROPIC_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": settings.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01"
                    }
                )
                results["anthropic"] = {
                    "available": resp.status_code in (200, 405),  # 405 means auth worked but method not allowed
                    "model": settings.ANTHROPIC_MODEL,
                    "status": "configured" if resp.status_code in (200, 405) else f"error: {resp.status_code}"
                }
        except Exception as e:
            results["anthropic"] = {
                "available": False,
                "model": settings.ANTHROPIC_MODEL,
                "status": f"error: {str(e)[:100]}"
            }
    else:
        results["anthropic"] = {
            "available": False,
            "model": settings.ANTHROPIC_MODEL,
            "status": "not_configured"
        }
    
    # Check Gemini
    if settings.GEMINI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "contents": [{"parts": [{"text": "Say OK"}]}],
                    "generationConfig": {"maxOutputTokens": 10}
                }
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    results["gemini"] = {
                        "available": True,
                        "model": settings.GEMINI_MODEL,
                        "status": "online_verified"
                    }
                else:
                    results["gemini"] = {
                        "available": False,
                        "model": settings.GEMINI_MODEL,
                        "status": f"api_error: {resp.status_code}"
                    }
        except Exception as e:
            results["gemini"] = {
                "available": False,
                "model": settings.GEMINI_MODEL,
                "status": f"error: {str(e)[:100]}"
            }
    else:
        results["gemini"] = {
            "available": False,
            "model": settings.GEMINI_MODEL,
            "status": "not_configured"
        }
    
    # Check Ollama
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            ollama_available = resp.status_code == 200
            models = []
            if ollama_available:
                models = [m.get("name", "") for m in resp.json().get("models", [])]
            results["ollama"] = {
                "available": ollama_available,
                "model": settings.OLLAMA_MODEL,
                "status": "running" if ollama_available else "unreachable",
                "models_available": models
            }
    except Exception as e:
        results["ollama"] = {
            "available": False,
            "model": settings.OLLAMA_MODEL,
            "status": f"error: {str(e)[:100]}",
            "models_available": []
        }
    
    overall_healthy = any(r.get("available", False) for r in results.values())
    
    return {
        "status": "healthy" if overall_healthy else "degraded",
        "providers": results,
        "default_provider": settings.DEFAULT_LLM_PROVIDER,
        "note": "Ollama requires local installation at http://localhost:11434. See https://ollama.ai for setup."
    }


if FRONTEND_DIST.exists():
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not catch API, docs, or health routes
        if full_path.startswith("api") or full_path in ("docs", "openapi.json", "health", "ws"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Page not found")
