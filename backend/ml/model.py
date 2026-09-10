"""
backend/ml/model.py
───────────────────
PyTorch MobileNetV3-Large transfer learning architecture factory for multi-crop disease classification.
"""

import logging
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
import torchvision.models as models

from ml.config import NUM_CLASSES, MODEL_PATH

logger = logging.getLogger(__name__)


def create_crop_model(num_classes: int, pretrained: bool = True) -> nn.Module:
    """
    Creates a MobileNetV3-Large neural network for a specific crop with `num_classes` outputs.
    Replaces the final classifier linear layer with custom `num_classes` output features.
    """
    if pretrained:
        try:
            from torchvision.models import MobileNetV3_Large_Weights
            weights = MobileNetV3_Large_Weights.DEFAULT
            model = models.mobilenet_v3_large(weights=weights)
        except Exception:
            model = models.mobilenet_v3_large(pretrained=True)
    else:
        model = models.mobilenet_v3_large(weights=None)

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)

    return model


def save_crop_checkpoint(model: nn.Module, filepath: Path):
    """Saves model weights state dict to disk."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), filepath)
    logger.info(f"Model checkpoint saved successfully to {filepath}")


def load_crop_checkpoint(filepath: Path, num_classes: int, device: Optional[torch.device] = None) -> nn.Module:
    """Loads model weights state dict from disk for a crop with `num_classes`."""
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = create_crop_model(num_classes=num_classes, pretrained=False)
    if not filepath.exists():
        raise FileNotFoundError(f"No checkpoint found at {filepath}")

    state_dict = torch.load(filepath, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    logger.info(f"Model checkpoint loaded successfully from {filepath}")
    return model


# ── Backwards-Compatibility Aliases for Sugarcane ────────────────────────────
def create_sugarcane_model(num_classes: int = NUM_CLASSES, pretrained: bool = True) -> nn.Module:
    return create_crop_model(num_classes=num_classes, pretrained=pretrained)


def save_checkpoint(model: nn.Module, filepath: Path = MODEL_PATH):
    save_crop_checkpoint(model, filepath)


def load_checkpoint(filepath: Path = MODEL_PATH, device: Optional[torch.device] = None) -> nn.Module:
    return load_crop_checkpoint(filepath, num_classes=NUM_CLASSES, device=device)
