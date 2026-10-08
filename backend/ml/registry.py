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
    },
    "maize": {
        "provider": "huggingface",
        "repo_id": "linkanjarad/mobilenet_v2_plant_disease",
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
    Only active local models (Cotton, Sugarcane) are currently loaded.
    Other crops return None (model unavailable).
    """
    normalized = get_normalized_crop_name(crop_name)
    if normalized in _model_adapters:
        return _model_adapters[normalized]

    # Find matching config from CROP_CONFIGS
    local_cfg = None
    local_cfg_key = None
    for key, cfg in CROP_CONFIGS.items():
        if get_normalized_crop_name(key) == normalized:
            local_cfg = cfg
            local_cfg_key = key
            break

    # Load local model ONLY if crop is marked active and checkpoint exists on disk
    if (
        local_cfg
        and local_cfg.get("is_active_local_model", False)
        and local_cfg.get("model_path")
        and local_cfg["model_path"].exists()
    ):
        adapter = LocalTorchModelAdapter(
            crop_name=local_cfg_key or crop_name,
            model_path=local_cfg["model_path"],
            classes=local_cfg["classes"]
        )
        _model_adapters[normalized] = adapter
        return adapter

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
        is_active = False
        for key, cfg in CROP_CONFIGS.items():
            if get_normalized_crop_name(key) == norm:
                if (
                    cfg.get("is_active_local_model", False)
                    and cfg.get("model_path")
                    and cfg["model_path"].exists()
                ):
                    is_active = True
                    break

        if is_active:
            status[norm] = {"available": True, "source": "local", "status": "active"}
        else:
            status[norm] = {"available": False, "source": "none", "status": "unavailable"}
    return status
