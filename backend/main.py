"""
main.py  –  CropGuard FastAPI application entry point
"""


import os
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from db import init_db, DB_PATH
from db_mongo import get_db
from routes.scan import router as scan_router
from routes.gov import router as gov_router
from routes.auth import router as auth_router
from routes.farm import router as farm_router
from routes.notifications import router as notif_router
from routes.feedback import router as feedback_router
from routes.history import router as history_router
from routes.advisory_risk import router as advisory_risk_router


# Base upload directory
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialise the SQLite database on startup
    init_db()
    # Connect and initialise MongoDB
    get_db()
    
    # Model discovery
    import logging
    logger = logging.getLogger("main")
    from ml.registry import get_model_status
    status = get_model_status()
    for crop, info in status.items():
        if info.get("available"):
            logger.info(f"[MODEL] {crop.title()} -> {info.get('source')} -> loaded")
        else:
            logger.info(f"[MODEL] {crop.title()} -> model unavailable")
            
    yield


app = FastAPI(
    title="CropGuard API",
    description=(
        "AI-powered crop disease detection and scan history backend.\n\n"
        "Phase 1: Upload validation + image quality analysis.\n"
        "Phase 2: Plant/crop relevance validation.\n"
        "Phase 3A: Real crop species identification.\n"
        "Phase 3B: Crop disease detection, severity assessment, and expert advisory.\n"
        "Phase 4: Persistent SQLite scan history & farm telemetry sync."
    ),
    version="2.4.0",
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
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Uploads Mounting ───────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

from routes.translation import router as translation_router

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(farm_router, prefix="/api", tags=["Farm"])
app.include_router(scan_router, prefix="/api", tags=["Scan"])
app.include_router(history_router, prefix="/api", tags=["Scan History"])
app.include_router(notif_router, prefix="/api", tags=["Notifications"])
app.include_router(feedback_router, prefix="/api", tags=["Feedback"])
app.include_router(advisory_risk_router, prefix="/api", tags=["Risk & Advisory"])
app.include_router(gov_router, prefix="/api", tags=["Government Dashboard"])
app.include_router(translation_router, prefix="/api", tags=["Translation"])



# ── Health endpoints ──────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "service": "CropGuard API",
        "version": "2.4.0",
        "status":  "running",
        "docs":    "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


@app.get("/api/health", tags=["Health"])
def api_health():
    """Detailed health check endpoint listing all 20 supported Maharashtra crops."""
    from data.canonical_mapping import CANONICAL_CROPS, get_display_crop_name
    db_status = "connected" if os.path.exists(DB_PATH) else "disconnected"
    return {
        "status": "ok",
        "modelLoaded": True,
        "modelVersion": "2.4.0",
        "database": db_status,
        "supportedCrops": [get_display_crop_name(c) for c in CANONICAL_CROPS]
    }


@app.get("/api/download/crops-dataset-directory-pdf", tags=["Download"])
def download_crops_directory_pdf():
    """Serves the official 20 Maharashtra Crops Dataset & Resource Directory PDF for download."""
    pdf_path = Path(__file__).resolve().parent.parent / "public" / "CropGuard_Maharashtra_20_Crops_Dataset_Directory.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Directory PDF document not found.")
    return FileResponse(
        path=str(pdf_path),
        filename="CropGuard_Maharashtra_20_Crops_Dataset_Directory.pdf",
        media_type="application/pdf",
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
