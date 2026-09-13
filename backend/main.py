"""
main.py  –  CropGuard FastAPI application entry point
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import init_db
from routes.scan import router as scan_router
from routes.gov import router as gov_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialise the SQLite database on startup
    init_db()
    yield


app = FastAPI(
    title="CropGuard API",
    description=(
        "AI-powered crop disease detection backend.\n\n"
        "Phase 1: Upload validation + image quality analysis.\n"
        "Phase 2+: Crop identification, disease detection, severity scoring, advisory."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow Vite dev server (ports 5173-5175) and any localhost origin during dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(scan_router, prefix="/api", tags=["Scan"])
app.include_router(gov_router, prefix="/api", tags=["Government Dashboard"])


# ── Health endpoints ──────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "service": "CropGuard API",
        "version": "1.0.0",
        "status":  "running",
        "docs":    "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


@app.get("/api/health", tags=["Health"])
def api_health():
    """Health-check accessible via the Vite /api proxy."""
    return {"status": "healthy"}
