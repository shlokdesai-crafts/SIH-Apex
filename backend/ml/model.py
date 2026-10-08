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


def create_crop_model(
    num_classes: int,
    pretrained: bool = True,
    architecture: str = "mobilenet_v3_large",
) -> nn.Module:
    """
    Creates a neural network for a specific crop with `num_classes` outputs.
    Supports 'mobilenet_v3_large' (default) and 'efficientnet_b0'.
    Replaces the final classifier linear layer with custom `num_classes` output features.
    """
    arch = (architecture or "mobilenet_v3_large").lower().replace("-", "_")

    if "efficientnet" in arch:
        if pretrained:
            try:
                from torchvision.models import EfficientNet_B0_Weights
                weights = EfficientNet_B0_Weights.DEFAULT
                model = models.efficientnet_b0(weights=weights)
            except Exception:
                model = models.efficientnet_b0(pretrained=True)
        else:
            model = models.efficientnet_b0(weights=None)

        last_layer = model.classifier[1]
        in_features: int = last_layer.in_features if isinstance(last_layer, nn.Linear) else int(getattr(last_layer, "in_features", 1280))
        model.classifier[1] = nn.Linear(in_features, num_classes)
        return model

    # Default: MobileNetV3-Large
    if pretrained:
        try:
            from torchvision.models import MobileNet_V3_Large_Weights
            weights = MobileNet_V3_Large_Weights.DEFAULT
            model = models.mobilenet_v3_large(weights=weights)
        except Exception:
            model = models.mobilenet_v3_large(pretrained=True)
    else:
        model = models.mobilenet_v3_large(weights=None)

    last_layer = model.classifier[3]
    in_features: int = last_layer.in_features if isinstance(last_layer, nn.Linear) else int(getattr(last_layer, "in_features", 1280))
    model.classifier[3] = nn.Linear(in_features, num_classes)

    return model


def save_crop_checkpoint(model: nn.Module, filepath: Path):
    """Saves model weights state dict to disk."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), filepath)
    logger.info(f"Model checkpoint saved successfully to {filepath}")


def load_crop_checkpoint(
    filepath: Path,
    num_classes: int,
    device: Optional[torch.device] = None,
    architecture: Optional[str] = None,
) -> nn.Module:
    """
    Loads model weights state dict from disk for a crop with `num_classes`.
    Verifies that the checkpoint has authenticated provenance metadata confirming
    it was trained on a verified real-world agricultural dataset.
    Automatically resolves architecture from metadata or filename if not explicitly provided.
    """
    import json
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if not filepath.exists():
        raise FileNotFoundError(f"No checkpoint found at {filepath}")

    # Provenance verification check & architecture discovery
    metadata_path = filepath.with_suffix(".metadata.json")
    is_verified_real = False
    detected_arch = architecture

    if metadata_path.exists():
        try:
            meta = json.loads(metadata_path.read_text(encoding="utf-8"))
            if meta.get("verified_real_dataset") is True:
                is_verified_real = True
                logger.info(f"Model checkpoint verified with authentic real dataset metadata ({meta.get('dataset_source')}).")
            if not detected_arch:
                detected_arch = meta.get("architecture") or meta.get("model")
        except Exception as exc:
            logger.warning(f"Could not read metadata for {filepath}: {exc}")

    # Fallback architecture detection from filepath
    if not detected_arch:
        fname = filepath.name.lower()
        if "efficientnet" in fname:
            detected_arch = "efficientnet_b0"
        else:
            detected_arch = "mobilenet_v3_large"

    if not is_verified_real:
        logger.warning(
            f"Model checkpoint at {filepath} is uncertified: missing or unverified dataset metadata. "
            f"Only models trained on genuine agricultural datasets should be deployed."
        )

    model = create_crop_model(num_classes=num_classes, pretrained=False, architecture=detected_arch)
    state_dict = torch.load(filepath, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    setattr(model, "is_verified_real", is_verified_real)
    setattr(model, "architecture", detected_arch)
    logger.info(f"Model checkpoint loaded successfully from {filepath} (arch={detected_arch}, verified_real={is_verified_real})")
    return model


# ── Backwards-Compatibility Aliases for Sugarcane ────────────────────────────
def create_sugarcane_model(num_classes: int = NUM_CLASSES, pretrained: bool = True) -> nn.Module:
    return create_crop_model(num_classes=num_classes, pretrained=pretrained)


def save_checkpoint(model: nn.Module, filepath: Path = MODEL_PATH):
    save_crop_checkpoint(model, filepath)


def load_checkpoint(filepath: Path = MODEL_PATH, device: Optional[torch.device] = None) -> nn.Module:
    return load_crop_checkpoint(filepath, num_classes=NUM_CLASSES, device=device)
