"""
main.py  –  CropGuard FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.scan import router as scan_router

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
