"""
routes/scan.py
──────────────
POST /api/scan  –  Phase 1: Upload validation + image quality gate.

Phase 2+ hooks (crop_analysis, disease_detection, severity, risk_score,
advisory) are wired in the response model but return null until the
respective ML service modules are implemented.
"""

from fastapi import APIRouter, File, UploadFile

from services.validation   import validate_upload
from services.image_quality import analyze_quality, quality_errors
from models.response        import ImageQuality, ScanResponse, ValidationResult

router = APIRouter()


@router.post("/scan", response_model=ScanResponse, summary="Validate and analyse a crop image")
async def scan_crop(file: UploadFile = File(..., description="JPG or PNG crop image, max 10 MB")):
    """
    Phase 1 pipeline:
    1. File-type, size, and resolution validation
    2. OpenCV brightness & blur/sharpness analysis
    3. Structured JSON response (ML hooks are null placeholders)
    """

    # ── Step 1: upload validation ─────────────────────────────────────────────
    val_errors, val_warnings, contents = await validate_upload(file)

    # Hard stop – file is unusable
    if val_errors and not contents:
        return ScanResponse(
            status="invalid",
            message=val_errors[0],
            validation=ValidationResult(
                passed=False, errors=val_errors, warnings=val_warnings
            ),
        )

    # ── Step 2: image quality analysis ───────────────────────────────────────
    qual_metrics = analyze_quality(contents) if contents else {}
    qual_errs    = quality_errors(qual_metrics) if qual_metrics else []

    all_errors = val_errors + qual_errs
    passed     = len(all_errors) == 0

    size_mb = round(len(contents) / (1024 * 1024), 3) if contents else 0.0

    image_quality: ImageQuality | None = None
    if qual_metrics and not qual_metrics.get("decode_error"):
        image_quality = ImageQuality(
            brightness_score = qual_metrics["brightness_score"],
            blur_score       = qual_metrics["blur_score"],
            resolution       = qual_metrics["resolution"],
            file_size_mb     = size_mb,
            is_bright_enough = qual_metrics["is_bright_enough"],
            is_sharp_enough  = qual_metrics["is_sharp_enough"],
        )

    # ── Step 3: build response ────────────────────────────────────────────────
    if passed:
        message = (
            "Image quality checks passed. "
            "Crop and disease analysis will be available in Phase 2."
        )
    else:
        message = all_errors[0]   # surface the most critical error first

    return ScanResponse(
        status        = "valid" if passed else "invalid",
        message       = message,
        validation    = ValidationResult(
            passed   = passed,
            errors   = all_errors,
            warnings = val_warnings,
        ),
        image_quality    = image_quality,
        # ── Phase 2+ placeholders ──────────────────────────────────────────
        crop_analysis    = None,
        disease_detection= None,
        severity         = None,
        risk_score       = None,
        advisory         = None,
    )
