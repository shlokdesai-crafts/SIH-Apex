"""
routes/scan.py
──────────────
POST /api/scan  –  Phase 1: Upload validation + image quality gate.

Phase 2+ hooks (crop_analysis, disease_detection, severity, risk_score,
advisory) are wired in the response model but return null until the
respective ML service modules are implemented.
"""

from fastapi import APIRouter, File, Form, UploadFile
from typing import Optional

from services.validation import validate_upload
from services.image_quality import analyze_quality, quality_errors
from services.crop_relevance import validate_crop_relevance
from services.crop_identification import identify_crop
from models.response import ImageQuality, ScanResponse, ValidationResult, CropAnalysis, CropIdentification, DiseaseDetectionResult
from ml.inference import predict_crop_disease
from ml.config import CROP_CONFIGS
from db import insert_submission

router = APIRouter()


@router.post("/scan", response_model=ScanResponse, summary="Validate and analyse a crop image")
async def scan_crop(
    file: UploadFile = File(..., description="JPG or PNG crop image, max 10 MB"),
    farmer_name: Optional[str] = Form(default="Anonymous"),
    location: Optional[str] = Form(default="Unknown"),
    latitude: Optional[float] = Form(default=None),
    longitude: Optional[float] = Form(default=None),
):
    """
    Phase 1, Phase 2, Phase 3A & Phase 3B Multi-Crop pipeline:
    1. File-type, size, and resolution validation (Phase 1)
    2. Image brightness & blur/sharpness analysis (Phase 1)
    3. Crop/plant relevance validation using CV model (Phase 2)
    4. Real Crop Species Identification (Phase 3A)
    5. Crop Disease Detection using dedicated MobileNetV3 model (Phase 3B)
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
        rejection_msg = crop_analysis.rejection_reason or "This image does not appear to contain a crop or plant."
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

    # ── Step 4: Phase 3A Real Crop Species Identification ──────────────────────
    crop_id: CropIdentification = identify_crop(contents)
    crop_analysis.crop_identification = crop_id

    if not crop_id.is_identified:
        unidentified_msg = crop_id.message or "Unable to identify crop."
        all_errors.append(unidentified_msg)
        return ScanResponse(
            status="invalid",
            message=unidentified_msg,
            validation=ValidationResult(
                passed=False,
                errors=all_errors,
                warnings=val_warnings,
            ),
            image_quality=image_quality,
            crop_analysis=crop_analysis,
        )

    # Passed Phase 1 quality + Phase 2 relevance + Phase 3A crop identification!
    conf_pct = round(crop_id.confidence * 100, 1)

    # ── Step 5: Phase 3B Real Crop Disease Detection ──────────────────────────
    disease_detection: DiseaseDetectionResult | None = None
    severity: str | None = None
    msg = f"Crop identified as {crop_id.crop_name} with {conf_pct}% confidence."

    crop_cfg = CROP_CONFIGS.get(crop_id.crop_name)
    if crop_cfg and crop_cfg.get("classes"):
        disease_res = predict_crop_disease(crop_id.crop_name, contents)
        disease_detection = DiseaseDetectionResult(**disease_res)
        severity = disease_detection.severity
        disease_conf_pct = round(disease_detection.confidence * 100, 1)
        msg = (
            f"Crop identified as {crop_id.crop_name} ({conf_pct}% confidence). "
            f"Disease: {disease_detection.disease} ({disease_conf_pct}% confidence)."
        )

    # ── Step 6: Persist to database ──────────────────────────────────────────
    ai_result_str = disease_detection.disease if disease_detection else "Unknown"
    confidence_val = disease_detection.confidence if disease_detection else None
    insert_submission(
        crop=crop_id.crop_name,
        ai_result=ai_result_str,
        disease=disease_detection.disease if disease_detection else None,
        confidence=confidence_val,
        severity=severity,
        farmer_name=farmer_name or "Anonymous",
        location=location or "Unknown",
        latitude=latitude,
        longitude=longitude,
    )

    return ScanResponse(
        status="valid",
        message=msg,
        validation=ValidationResult(
            passed=True,
            errors=[],
            warnings=val_warnings,
        ),
        image_quality=image_quality,
        crop_analysis=crop_analysis,
        disease_detection=disease_detection,
        severity=severity,
        risk_score=None,
        advisory=None,
    )


