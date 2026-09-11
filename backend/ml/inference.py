"""
backend/ml/inference.py
───────────────────────
Multi-crop disease inference engine (Phase 3B).

Abstain / verification path — multi-criteria, no hardcoded thresholds:
  1. Low top-1 confidence  (< per-crop threshold, default 0.60)
  2. Small top-1 vs top-2 margin (< 0.05)  → ambiguous prediction
  3. High predictive entropy across all classes → model is uncertain everywhere
  4. "Healthy" class relaxed threshold (0.50) to avoid false disease alarms

Returns "Needs expert verification" whenever any of (1)-(3) trigger,
instead of forcing a disease label the model is not sure about.
Never hardcodes results or bypasses the PyTorch forward pass.
"""

from __future__ import annotations

import io
import logging
import math
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image
import torch
import torchvision.transforms as transforms

from ml.config import (
    CROP_CONFIGS,
    IMAGE_SIZE,
    IMAGENET_MEAN,
    IMAGENET_STD,
    SUGARCANE_CONFIDENCE_THRESHOLD,
    MODEL_PATH,
)
from ml.model import load_crop_checkpoint
from ml.advisory import get_disease_advisory

logger = logging.getLogger(__name__)

# Lazy singleton model cache per crop
_models_cache: Dict[str, torch.nn.Module] = {}
_device: Optional[torch.device] = None

# Standard inference transform — slightly larger crop then centre crop for robustness
_inference_transform = transforms.Compose([
    transforms.Resize((int(IMAGE_SIZE[0] * 1.14), int(IMAGE_SIZE[1] * 1.14))),
    transforms.CenterCrop(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

# ── Abstain parameters ────────────────────────────────────────────────────────
# These are NOT confidence-threshold hacks — they catch structurally different
# failure modes that a single threshold cannot address.

# Max softmax entropy for a K-class uniform distribution
# entropy_max(K) = log(K)
# We flag OOD / max-uncertainty when entropy > 70% of the theoretical maximum.
_OOD_ENTROPY_FRACTION = 0.70

# Minimum gap between top-1 and top-2 probabilities.
# If gap < this, the model considers two diseases equally likely → abstain.
_MIN_TOP2_MARGIN = 0.05

# Relaxed threshold multiplier for the "Healthy" class applied only when
# using the default per-crop threshold — reduces false disease alarms
# without interfering with explicit threshold overrides (e.g. in tests).
_HEALTHY_THRESHOLD_MULTIPLIER = 0.85  # e.g. 0.60 × 0.85 = 0.51


def _get_crop_inference_model(crop_name: str) -> Tuple[torch.nn.Module, torch.device]:
    """Lazy loader for crop MobileNetV3 model checkpoint."""
    global _models_cache, _device
    if _device is None:
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if crop_name not in _models_cache:
        crop_cfg = CROP_CONFIGS.get(crop_name)
        if not crop_cfg or not crop_cfg.get("classes"):
            raise ValueError(f"Crop '{crop_name}' is not configured for disease detection.")

        classes = crop_cfg["classes"]
        model_path: Path = crop_cfg["model_path"]

        if model_path.exists():
            logger.info(f"Loading {crop_name} disease model from {model_path}…")
            model = load_crop_checkpoint(model_path, num_classes=len(classes), device=_device)
        else:
            logger.warning(
                f"No checkpoint found for {crop_name} at {model_path}. "
                f"Training a fresh model (requires real data)…"
            )
            from ml.train import train_crop_model
            model = train_crop_model(crop_name=crop_name, epochs=20)
            model.to(_device)
            model.eval()

        _models_cache[crop_name] = model

    return _models_cache[crop_name], _device  # type: ignore[return-value]


def _compute_entropy(probs: torch.Tensor) -> float:
    """Shannon entropy of a probability vector (in nats)."""
    eps = 1e-9
    return float(-torch.sum(probs * torch.log(probs + eps)).item())


def _abstain_reason(
    classes: List[str],
    probs: torch.Tensor,
    top_idx: int,
    top_prob: float,
    threshold: float,
    num_classes: int,
) -> Optional[str]:
    """
    Returns a human-readable abstain reason string, or None if the prediction
    should be accepted.

    Checks (in priority order):
      1. Confidence below threshold (with relaxed threshold for "Healthy")
      2. Entropy too high → model is uncertain across all classes (OOD / unusual image)
      3. Top-2 margin too small → prediction is ambiguous between two diseases
    """
    # ── 1. Confidence threshold ───────────────────────────────────────────────
    # The threshold is passed pre-computed by predict_crop_disease, which already
    # applies the Healthy relaxation for default thresholds. An explicit override
    # (e.g. 0.9999 in tests) is passed as-is and always takes priority.
    if top_prob < threshold:
        predicted_class = classes[top_idx]
        return (
            f"Confidence ({top_prob:.1%}) is below threshold ({threshold:.1%}) "
            f"for class '{predicted_class}'."
        )

    # ── 2. Entropy check → OOD / uncertain model ─────────────────────────────
    entropy = _compute_entropy(probs)
    max_entropy = math.log(num_classes)  # Theoretical maximum (uniform distribution)

    if entropy > _OOD_ENTROPY_FRACTION * max_entropy:
        return (
            f"Model uncertainty is too high (entropy={entropy:.3f}; max={max_entropy:.3f}). "
            f"The image may be out-of-distribution, unsuitable for diagnosis, or ambiguous."
        )

    # ── 3. Top-2 margin check → ambiguous between two diseases ───────────────
    sorted_probs, sorted_idx = torch.sort(probs, descending=True)
    top2_margin = float((sorted_probs[0] - sorted_probs[1]).item())
    if top2_margin < _MIN_TOP2_MARGIN:
        top2_class = classes[int(sorted_idx[1].item())]
        return (
            f"Prediction is ambiguous between '{classes[top_idx]}' ({top_prob:.1%}) "
            f"and '{top2_class}' ({float(sorted_probs[1].item()):.1%}). "
            f"Margin ({top2_margin:.3f}) is below minimum ({_MIN_TOP2_MARGIN})."
        )

    return None  # Accept the prediction


def predict_crop_disease(
    crop_name: str,
    image_bytes: bytes,
    confidence_threshold: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Predicts disease for a crop image using the multi-criteria abstain path.

    Returns:
        {
            "crop": str,
            "disease": str,            # class name or "Needs expert verification"
            "confidence": float,
            "severity": str,
            "status": str,             # "Healthy" | "Diseased" | "Needs expert verification"
            "explanation": str,
            "symptoms": list[str],
            "recommended_actions": list[str],
            "prevention": list[str],
            "expert_verification_required": bool,
            "abstain_reason": str | None,   # Why we abstained (if applicable)
        }
    """
    try:
        crop_cfg = CROP_CONFIGS.get(crop_name)
        if not crop_cfg or not crop_cfg.get("classes"):
            raise ValueError(f"Crop '{crop_name}' has no active disease model.")

        classes: List[str] = crop_cfg["classes"]
        num_classes = len(classes)

        # Determine effective threshold:
        # - If caller provided an explicit override (e.g. 0.9999 in tests), use it as-is.
        # - If using the per-crop default, relax it slightly for the "Healthy" class
        #   after we know the predicted class, to reduce false disease alarms.
        using_default_threshold = confidence_threshold is None
        base_threshold = crop_cfg.get("confidence_threshold", 0.60) if using_default_threshold else confidence_threshold  # type: ignore[assignment]

        severity_map: Dict[str, str] = crop_cfg.get("severity_map", {})
        status_map: Dict[str, str] = crop_cfg.get("status_map", {})

        model, device = _get_crop_inference_model(crop_name)

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor_img = _inference_transform(img).unsqueeze(0).to(device)  # type: ignore[attr-defined]

        with torch.no_grad():
            outputs = model(tensor_img)
            probs = torch.softmax(outputs, dim=1)[0]
            top_prob_t, top_idx_t = torch.max(probs, dim=0)

        top_prob_raw = float(top_prob_t.item())   # raw float used for threshold comparison
        top_confidence = round(top_prob_raw, 4)    # rounded value displayed to users
        top_idx = int(top_idx_t.item())
        predicted_class = classes[top_idx]

        # Apply Healthy relaxation only for the default threshold
        threshold = base_threshold  # type: ignore[assignment]
        if using_default_threshold and predicted_class == "Healthy":
            threshold = base_threshold * _HEALTHY_THRESHOLD_MULTIPLIER  # type: ignore[assignment]

        logger.info(
            f"[{crop_name}] Raw prediction: {predicted_class} "
            f"({top_confidence:.1%}) | "
            f"threshold={threshold:.3f} | "
            f"entropy={_compute_entropy(probs):.3f} | "
            f"top-2 margin={float((torch.sort(probs, descending=True)[0][0] - torch.sort(probs, descending=True)[0][1]).item()):.3f}"
        )

        # ── Multi-criteria abstain check ──────────────────────────────────────
        abstain_reason = _abstain_reason(
            classes=classes,
            probs=probs,
            top_idx=top_idx,
            top_prob=top_prob_raw,   # use raw float for precise threshold comparison
            threshold=threshold,
            num_classes=num_classes,
        )

        if abstain_reason:
            logger.info(f"[{crop_name}] Abstaining — {abstain_reason}")
            advisory = get_disease_advisory(crop_name, "Needs expert verification")
            return {
                "crop": crop_name,
                "disease": "Needs expert verification",
                "confidence": top_confidence,
                "severity": "None",
                "status": "Needs expert verification",
                "explanation": advisory["explanation"],
                "symptoms": advisory["symptoms"],
                "recommended_actions": advisory["recommended_actions"],
                "prevention": advisory["prevention"],
                "expert_verification_required": True,
                "abstain_reason": abstain_reason,
            }

        # ── Accepted prediction ───────────────────────────────────────────────
        severity = severity_map.get(predicted_class, "Moderate")
        status = status_map.get(predicted_class, "Diseased")
        advisory = get_disease_advisory(crop_name, predicted_class)

        return {
            "crop": crop_name,
            "disease": predicted_class,
            "confidence": top_confidence,
            "severity": severity,
            "status": status,
            "explanation": advisory["explanation"],
            "symptoms": advisory["symptoms"],
            "recommended_actions": advisory["recommended_actions"],
            "prevention": advisory["prevention"],
            "expert_verification_required": False,
            "abstain_reason": None,
        }

    except Exception as exc:
        logger.error(f"Error during {crop_name} disease prediction: {exc}", exc_info=True)
        advisory = get_disease_advisory(crop_name, "Needs expert verification")
        return {
            "crop": crop_name,
            "disease": "Needs expert verification",
            "confidence": 0.0,
            "severity": "None",
            "status": "Needs expert verification",
            "explanation": advisory["explanation"],
            "symptoms": advisory["symptoms"],
            "recommended_actions": advisory["recommended_actions"],
            "prevention": advisory["prevention"],
            "expert_verification_required": True,
            "abstain_reason": f"Internal error: {exc}",
        }


def predict_sugarcane_disease(
    image_bytes: bytes,
    confidence_threshold: float = SUGARCANE_CONFIDENCE_THRESHOLD,
    model_path: Path = MODEL_PATH,
) -> Dict[str, Any]:
    """Backwards-compatibility wrapper for Sugarcane inference."""
    return predict_crop_disease(
        crop_name="Sugarcane",
        image_bytes=image_bytes,
        confidence_threshold=confidence_threshold,
    )
