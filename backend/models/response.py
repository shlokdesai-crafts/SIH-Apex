from pydantic import BaseModel
from typing import Optional, List, Any


class ValidationResult(BaseModel):
    passed: bool
    errors: List[str]
    warnings: List[str]


class ImageQuality(BaseModel):
    brightness_score: float   # 0-255 mean gray value
    blur_score: float          # Laplacian variance – higher = sharper
    resolution: str            # e.g. "1920x1080"
    file_size_mb: float
    is_bright_enough: bool
    is_sharp_enough: bool


class ScanResponse(BaseModel):
    """
    Structured response for the /api/scan endpoint.
    Fields marked 'future' will be populated in later phases when ML models are integrated.
    """
    status: str                          # "valid" | "invalid"
    message: str                         # Human-readable primary message
    validation: ValidationResult
    image_quality: Optional[ImageQuality] = None

    # ── Future ML modules (Phase 2+) ──────────────────────────────────────────
    crop_analysis: Optional[Any] = None      # Crop type identification
    disease_detection: Optional[Any] = None  # Disease name + confidence score
    severity: Optional[Any] = None           # Severity level (Mild/Moderate/Severe)
    risk_score: Optional[Any] = None         # 0-100 risk index
    advisory: Optional[Any] = None           # Treatment recommendations
