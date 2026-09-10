"""
backend/ml/inference.py
───────────────────────
Multi-crop disease inference engine (Phase 3B-2).
Performs real PyTorch forward passes using trained MobileNetV3-Large crop checkpoints.
Applies configurable confidence thresholding and attaches controlled expert advisory information.
"""

import io
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

from PIL import Image
import torch
import torchvision.transforms as transforms

from ml.config import (
    CROP_CONFIGS,
    IMAGE_SIZE,
    IMAGENET_MEAN,
    IMAGENET_STD,
    SUGARCANE_CONFIDENCE_THRESHOLD,
    MODEL_PATH
)
from ml.model import load_crop_checkpoint
from ml.advisory import get_disease_advisory

logger = logging.getLogger(__name__)

# Lazy singleton model cache per crop
_models_cache: Dict[str, torch.nn.Module] = {}
_device: Optional[torch.device] = None

# Standard validation transforms for single image inference
_inference_transform = transforms.Compose([
    transforms.Resize(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


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
        model_path = crop_cfg["model_path"]

        if model_path.exists():
            logger.info(f"Loading {crop_name} disease detection model from {model_path}...")
            model = load_crop_checkpoint(model_path, num_classes=len(classes), device=_device)
        else:
            logger.warning(f"Checkpoint {model_path} for {crop_name} not found. Training model locally...")
            from ml.train import train_crop_model
            model = train_crop_model(crop_name=crop_name, epochs=3)
            model.to(_device)
            model.eval()

        _models_cache[crop_name] = model

    return _models_cache[crop_name], _device


def predict_crop_disease(
    crop_name: str,
    image_bytes: bytes,
    confidence_threshold: Optional[float] = None
) -> Dict[str, Any]:
    """
    Predicts disease for a specified crop from raw image bytes.

    Returns:
        dict with fields:
            - crop: str
            - disease: str
            - confidence: float (0.0 to 1.0)
            - severity: str ("None", "Mild", "Moderate", "Severe")
            - status: str ("Healthy", "Diseased", "Needs expert verification")
            - explanation: str
            - symptoms: list of str
            - recommended_actions: list of str
            - prevention: list of str
            - expert_verification_required: bool
    """
    try:
        crop_cfg = CROP_CONFIGS.get(crop_name)
        if not crop_cfg or not crop_cfg.get("classes"):
            raise ValueError(f"Crop '{crop_name}' has no active disease model.")

        classes = crop_cfg["classes"]
        threshold = confidence_threshold if confidence_threshold is not None else crop_cfg.get("confidence_threshold", 0.60)
        severity_map = crop_cfg.get("severity_map", {})
        status_map = crop_cfg.get("status_map", {})

        model, device = _get_crop_inference_model(crop_name)

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor_img = _inference_transform(img).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(tensor_img)
            probabilities = torch.softmax(outputs, dim=1)[0]
            top_prob, top_idx = torch.max(probabilities, dim=0)

        top_confidence = round(float(top_prob.item()), 4)
        raw_disease = classes[top_idx.item()]

        # Configurable Confidence Thresholding
        if top_confidence < threshold:
            logger.info(
                f"[{crop_name}] Prediction confidence {top_confidence:.4f} is below threshold {threshold:.2f}. "
                "Flagging for expert verification."
            )
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
            }

        severity = severity_map.get(raw_disease, "Moderate")
        status = status_map.get(raw_disease, "Diseased")
        advisory = get_disease_advisory(crop_name, raw_disease)

        return {
            "crop": crop_name,
            "disease": raw_disease,
            "confidence": top_confidence,
            "severity": severity,
            "status": status,
            "explanation": advisory["explanation"],
            "symptoms": advisory["symptoms"],
            "recommended_actions": advisory["recommended_actions"],
            "prevention": advisory["prevention"],
            "expert_verification_required": False,
        }

    except Exception as exc:
        logger.error(f"Error during {crop_name} disease prediction: {exc}")
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
        }


# Backwards compatibility function for Sugarcane
def predict_sugarcane_disease(
    image_bytes: bytes,
    confidence_threshold: float = SUGARCANE_CONFIDENCE_THRESHOLD,
    model_path: Path = MODEL_PATH
) -> Dict[str, Any]:
    return predict_crop_disease(crop_name="Sugarcane", image_bytes=image_bytes, confidence_threshold=confidence_threshold)
