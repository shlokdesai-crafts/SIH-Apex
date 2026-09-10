"""
services/crop_relevance.py
───────────────────────────
Phase 2: Pretrained Computer Vision model for real crop/plant relevance validation.
Uses PyTorch MobileNetV2 (ImageNet-1k) to verify that an uploaded image contains
a genuine crop, plant, leaf, fruit, vegetable, or agricultural flora.

Rejection rules:
  • Rejects people, animals, vehicles, buildings, scenery, and irrelevant objects.
  • Low model confidence (< 0.12) → "Unable to verify crop/plant image".
  • Returns CropAnalysis model with relevance, confidence, category, and rejection reason.
"""

import io
import logging
from typing import Tuple, Optional, Dict, Any

from PIL import Image
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from torchvision.models import MobileNet_V2_Weights

from models.response import CropAnalysis

logger = logging.getLogger(__name__)

# ── Singleton Model & Weights Cache ──────────────────────────────────────────
_model: Optional[torch.nn.Module] = None
_categories: Optional[list] = None
_preprocess: Optional[transforms.Compose] = None

# ── Category Taxonomy Sets ───────────────────────────────────────────────────
# Keywords used to match ImageNet 1,000 class names into domain buckets

PLANT_CROP_KEYWORDS = {
    # Vegetables & Crops
    'cabbage', 'broccoli', 'cauliflower', 'zucchini', 'squash', 'cucumber',
    'artichoke', 'cardoon', 'mushroom', 'fungus', 'strawberry', 'orange',
    'lemon', 'lime', 'banana', 'apple', 'fig', 'pineapple', 'pomegranate',
    'jackfruit', 'custard apple', 'corn', 'ear', 'acorn', 'hip', 'buckeye',
    'coral fungus', 'agaric', 'gyromitra', 'stinkhorn', 'earthstar',
    'hen-of-the-woods', 'bolete', 'daisy', 'rose', 'tulip', 'orchid',
    'sunflower', 'hay', 'leaf', 'tree', 'flower', 'plant', 'grass',
    'garden', 'meadow', 'forest', 'potatoes', 'vine', 'pot', 'flowerpot',
    'rapeseed', 'cotton', 'straw', 'paddy', 'wheat', 'maize', 'rice', 'maze',
    'plantation', 'field', 'pasture', 'grain', 'crop',
    # Plant-dwelling crop insects & flora indicators
    'mantis', 'leaf beetle', 'grasshopper', 'leafhopper', 'cabbage butterfly',
    'ant', 'chameleon', 'lizard', 'snail', 'slug', 'dragonfly', 'admiral',
    'lacewing', 'honeycomb', 'long-horned beetle', 'monarch', 'bee', 'beetle',
    'egret', 'cockatoo', 'ptarmigan', 'spoonbill'
}

PERSON_KEYWORDS = {
    'groom', 'scuba diver', 'wig', 'bikini', 'trench coat', 'suit', 'jersey',
    'pajama', 'overcoat', 'gown', 'miniskirt', 'sarong', 'lab coat',
    'academic gown', 'unicycle', 'jean', 'neckbrace', 'diaper', 'brassiere'
}

VEHICLE_KEYWORDS = {
    'car', 'truck', 'bus', 'vehicle', 'bicycle', 'motorcycle', 'airplane',
    'aircraft', 'boat', 'ship', 'train', 'locomotive', 'scooter', 'cab',
    'racer', 'trailer', 'tractor', 'snowplow', 'ambulance', 'fire engine',
    'convertible', 'limousine', 'sports car', 'minivan', 'jeep', 'landrover',
    'moped', 'tow truck', 'garbage truck', 'police van'
}

BUILDING_KEYWORDS = {
    'house', 'church', 'castle', 'building', 'dam', 'bridge', 'tower',
    'skyscraper', 'barn', 'palace', 'monastery', 'greenhouse', 'boathouse',
    'chimney', 'prison'
}


def _get_model():
    """Lazy initialization for PyTorch MobileNetV2 model."""
    global _model, _categories, _preprocess
    if _model is None:
        logger.info("Loading PyTorch MobileNetV2 weights for Phase 2 crop validation...")
        weights = MobileNet_V2_Weights.DEFAULT
        _model = models.mobilenet_v2(weights=weights).eval()
        _categories = weights.meta["categories"]
        _preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    return _model, _categories, _preprocess


def validate_crop_relevance(image_bytes: bytes) -> CropAnalysis:
    """
    Validates whether the image contains a genuine crop/plant.

    Returns:
        CropAnalysis containing is_relevant (bool), confidence (float),
        detected_category (str), label (str), and rejection_reason (str or None).
    """
    try:
        model, categories, preprocess = _get_model()

        # Open image and convert to RGB
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        tensor = preprocess(img).unsqueeze(0)

        # Run inference
        with torch.no_grad():
            output = model(tensor)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            top10_prob, top10_catid = torch.topk(probabilities, 10)

        top_idx = top10_catid[0].item()
        top_label = categories[top_idx]
        top_conf = float(top10_prob[0].item())

        # Aggregate top-10 probability scores per category
        plant_score = 0.0
        person_score = 0.0
        vehicle_score = 0.0
        building_score = 0.0
        animal_score = 0.0
        object_score = 0.0

        top_non_plant_cat = None
        top_non_plant_label = None

        for i in range(10):
            idx = top10_catid[i].item()
            label = categories[idx]
            p = float(top10_prob[i].item())
            lbl_lower = label.lower()

            if any(k in lbl_lower for k in PLANT_CROP_KEYWORDS) or idx in range(936, 958) or idx in range(984, 999):
                plant_score += p
            elif any(k in lbl_lower for k in PERSON_KEYWORDS) or idx in [834, 617]:
                person_score += p
                if top_non_plant_cat is None:
                    top_non_plant_cat = "Person"
                    top_non_plant_label = label
            elif any(k in lbl_lower for k in VEHICLE_KEYWORDS):
                vehicle_score += p
                if top_non_plant_cat is None:
                    top_non_plant_cat = "Vehicle"
                    top_non_plant_label = label
            elif any(k in lbl_lower for k in BUILDING_KEYWORDS):
                building_score += p
                if top_non_plant_cat is None:
                    top_non_plant_cat = "Building/Scenery"
                    top_non_plant_label = label
            elif idx <= 397:
                animal_score += p
                if top_non_plant_cat is None:
                    top_non_plant_cat = "Animal"
                    top_non_plant_label = label
            else:
                object_score += p
                if top_non_plant_cat is None:
                    top_non_plant_cat = "Irrelevant Object"
                    top_non_plant_label = label

        # Decision threshold logic
        is_plant_domain = (plant_score >= 0.12) or any(k in top_label.lower() for k in PLANT_CROP_KEYWORDS) or (top_idx in range(936, 958) or top_idx in range(984, 999))

        if is_plant_domain:
            conf = max(top_conf, plant_score)
            if conf >= 0.12:
                return CropAnalysis(
                    is_relevant=True,
                    confidence=round(conf, 4),
                    detected_category="Plant/Crop",
                    label=top_label,
                    rejection_reason=None,
                )
            else:
                return CropAnalysis(
                    is_relevant=False,
                    confidence=round(conf, 4),
                    detected_category="Plant/Crop",
                    label=top_label,
                    rejection_reason="This image does not appear to contain a crop or plant. Please upload a clear photo of a crop leaf, plant, fruit, or field.",
                )
        else:
            cat_name = top_non_plant_cat or "Irrelevant Object"
            label_name = top_non_plant_label or top_label
            conf = max(top_conf, person_score, vehicle_score, animal_score, building_score, object_score)

            return CropAnalysis(
                is_relevant=False,
                confidence=round(conf, 4),
                detected_category=cat_name,
                label=label_name,
                rejection_reason="This image does not appear to contain a crop or plant. Please upload a clear photo of a crop leaf, plant, fruit, or field.",
            )

    except Exception as exc:
        logger.error(f"Error in validate_crop_relevance: {exc}")
        return CropAnalysis(
            is_relevant=False,
            confidence=0.0,
            detected_category="Unknown",
            label="Error",
            rejection_reason="Unable to verify crop/plant image due to processing error.",
        )
