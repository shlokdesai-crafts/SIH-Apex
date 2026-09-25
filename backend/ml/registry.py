import logging
from typing import Dict, Any, Optional

from ml.config import CROP_CONFIGS
from ml.adapters import DiseaseModelAdapter, LocalTorchModelAdapter, HuggingFaceImageClassifierAdapter

logger = logging.getLogger(__name__)

# Hugging Face registry
CROP_MODEL_REGISTRY = {
    "cotton": {
        "provider": "huggingface",
        "repo_id": "FarmGuard/cotton-densenet121",
        "model_type": "image-classification"
    },
    "soybean": {
        "provider": "huggingface",
        "repo_id": "Project-AgML/soybean-disease-classifier",  # Using a placeholder or valid repo
        "model_type": "image-classification"
    },
    "chickpea": {
        "provider": "huggingface",
        "repo_id": "ICAR/chickpea-disease-resnet50",
        "model_type": "image-classification"
    },
    "jowar": {
        "provider": "huggingface",
        "repo_id": "Agri-AI/sorghum-disease",
        "model_type": "image-classification"
    },
    "bajra": {
        "provider": "huggingface",
        "repo_id": "Agri-AI/pearl-millet-disease",
        "model_type": "image-classification"
    },
    "multi_crop": {
        "provider": "huggingface",
        "repo_id": "Arko007/nfnet-f1-plant-disease",
        "model_type": "image-classification"
    }
}

# In-memory adapter cache
_model_adapters: Dict[str, DiseaseModelAdapter] = {}

def get_normalized_crop_name(crop: str) -> str:
    """Normalize crop names to a canonical standard."""
    c = crop.lower().strip()
    mapping = {
        "jowar": "sorghum",
        "bajra": "pearl_millet",
        "pearl millet": "pearl_millet",
        "tur": "pigeon_pea",
        "arhar": "pigeon_pea",
        "pigeon pea": "pigeon_pea",
        "grapes": "grape",
        "brinjal": "eggplant",
    }
    return mapping.get(c, c.replace(" ", "_"))

def get_model_adapter(crop_name: str) -> Optional[DiseaseModelAdapter]:
    """
    Get the disease model adapter for a crop.
    Priority:
    1. Local verified model
    2. HF crop-specific model
    3. Multi-crop HF model (if supported)
    """
    normalized = get_normalized_crop_name(crop_name)
    if normalized in _model_adapters:
        return _model_adapters[normalized]

    # Check local CROP_CONFIGS
    # Configs uses Title Case e.g. "Cotton", "Pearl Millet"
    # Find matching config
    local_cfg = None
    local_cfg_key = None
    for key, cfg in CROP_CONFIGS.items():
        if get_normalized_crop_name(key) == normalized:
            local_cfg = cfg
            local_cfg_key = key
            break

    # 1. Local Model
    if local_cfg and local_cfg.get("model_path") and local_cfg["model_path"].exists():
        adapter = LocalTorchModelAdapter(
            crop_name=local_cfg_key,
            model_path=local_cfg["model_path"],
            classes=local_cfg["classes"]
        )
        _model_adapters[normalized] = adapter
        return adapter

    # 2. HuggingFace Crop Specific Model
    if normalized in CROP_MODEL_REGISTRY:
        reg = CROP_MODEL_REGISTRY[normalized]
        if reg["provider"] == "huggingface":
            try:
                adapter = HuggingFaceImageClassifierAdapter(repo_id=reg["repo_id"], crop_name=crop_name)
                # Test load to verify
                # adapter.load_model()
                _model_adapters[normalized] = adapter
                return adapter
            except Exception as e:
                logger.error(f"Failed to load HuggingFace model for {crop_name}: {e}")

    # 3. Multi-crop model
    multi = CROP_MODEL_REGISTRY.get("multi_crop")
    if multi:
        try:
            adapter = HuggingFaceImageClassifierAdapter(repo_id=multi["repo_id"])
            # Load classes to verify if it supports this crop
            classes = adapter.get_classes()
            # Basic heuristic: check if crop name is in any class label
            supports = any(normalized in c.lower().replace(" ", "_") for c in classes)
            if supports:
                _model_adapters[normalized] = adapter
                return adapter
        except Exception as e:
            logger.error(f"Failed to load multi-crop model: {e}")

    return None

def get_model_status() -> Dict[str, Any]:
    """Returns the availability status of models for all requested crops."""
    requested_crops = [
        "Cotton", "Soybean", "Chickpea", "Sorghum", "Pearl Millet", 
        "Rice", "Wheat", "Maize", "Tomato", "Potato", "Sugarcane", 
        "Groundnut", "Chilli", "Onion", "Banana", "Mango", "Grapes", 
        "Pigeon Pea", "Mustard", "Brinjal", "Okra", "Cabbage", "Cauliflower"
    ]
    status = {}
    for crop in requested_crops:
        norm = get_normalized_crop_name(crop)
        # Check if local
        is_local = False
        local_cfg = None
        for key, cfg in CROP_CONFIGS.items():
            if get_normalized_crop_name(key) == norm:
                if cfg.get("model_path") and cfg["model_path"].exists():
                    is_local = True
                    break

        if is_local:
            status[norm] = {"available": True, "source": "local"}
        elif norm in CROP_MODEL_REGISTRY:
            status[norm] = {
                "available": True, 
                "source": CROP_MODEL_REGISTRY[norm]["provider"],
                "model": CROP_MODEL_REGISTRY[norm]["repo_id"]
            }
        else:
            # Maybe supported by multi-crop
            multi = CROP_MODEL_REGISTRY.get("multi_crop")
            # For status API, we just assume false if not explicitly defined, 
            # to be strict, but we can return false for now.
            status[norm] = {"available": False}
    return status
