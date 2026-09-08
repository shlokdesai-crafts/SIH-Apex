"""
routes/scan.py
──────────────
POST /api/scan  –  Phase 1: Upload validation + image quality gate.

Phase 2+ hooks (crop_analysis, disease_detection, severity, risk_score,
advisory) are wired in the response model but return null until the
respective ML service modules are implemented.
"""

from fastapi import APIRouter, File, UploadFile

from services.validation import validate_upload
from services.image_quality import analyze_quality, quality_errors
from services.crop_relevance import validate_crop_relevance
from models.response import ImageQuality, ScanResponse, ValidationResult, CropAnalysis

router = APIRouter()


@router.post("/scan", response_model=ScanResponse, summary="Validate and analyse a crop image")
async def scan_crop(file: UploadFile = File(..., description="JPG or PNG crop image, max 10 MB")):
    """
    Phase 1 & Phase 2 pipeline:
    1. File-type, size, and resolution validation (Phase 1)
    2. Image brightness & blur/sharpness analysis (Phase 1)
    3. Crop/plant relevance validation using CV model (Phase 2)
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
    qual_errs = quality_errors(qual_metrics) if qual_metrics else []

    all_errors = val_errors + qual_errs
    size_mb = round(len(contents) / (1024 * 1024), 3) if contents else 0.0

    image_quality: ImageQuality | None = None
    if qual_metrics and not qual_metrics.get("decode_error"):
        image_quality = ImageQuality(
            brightness_score=qual_metrics["brightness_score"],
            blur_score=qual_metrics["blur_score"],
            resolution=qual_metrics["resolution"],
            file_size_mb=size_mb,
            is_bright_enough=qual_metrics["is_bright_enough"],
            is_sharp_enough=qual_metrics["is_sharp_enough"],
        )

    # Hard stop – quality check failed
    if all_errors:
        return ScanResponse(
            status="invalid",
            message=all_errors[0],
            validation=ValidationResult(
                passed=False,
                errors=all_errors,
                warnings=val_warnings,
            ),
            image_quality=image_quality,
            crop_analysis=None,
        )

    # ── Step 3: Phase 2 Crop Relevance Validation ─────────────────────────────
    crop_analysis: CropAnalysis = validate_crop_relevance(contents)

    if not crop_analysis.is_relevant:
        rejection_msg = crop_analysis.rejection_reason or "Unable to verify crop/plant image."
        all_errors.append(rejection_msg)
        return ScanResponse(
            status="invalid",
            message=rejection_msg,
            validation=ValidationResult(
                passed=False,
                errors=all_errors,
                warnings=val_warnings,
            ),
            image_quality=image_quality,
            crop_analysis=crop_analysis,
        )

    # Passed Phase 1 quality + Phase 2 crop relevance!
    return ScanResponse(
        status="valid",
        message="Crop relevance and image quality checks passed.",
        validation=ValidationResult(
            passed=True,
            errors=[],
            warnings=val_warnings,
        ),
        image_quality=image_quality,
        crop_analysis=crop_analysis,
        disease_detection=None,
        severity=None,
        risk_score=None,
        advisory=None,
    )

