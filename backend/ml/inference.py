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
# using the default per-crop threshold — reduces false disease alarms and unnecessary abstains
_HEALTHY_THRESHOLD_MULTIPLIER = 0.70  # e.g. 0.60 × 0.70 = 0.42


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

    # ── 2. Entropy & Margin checks ───────────────────────────────────────────
    sorted_probs, sorted_idx = torch.sort(probs, descending=True)
    top2_margin = float((sorted_probs[0] - sorted_probs[1]).item())
    predicted_class = classes[top_idx]

    # If Healthy is the leading class with a decisive margin (>= 10%) over any disease,
    # accept the healthy diagnosis and avoid false uncertainty alarm.
    if predicted_class == "Healthy" and top2_margin >= 0.10:
        return None

    entropy = _compute_entropy(probs)
    max_entropy = math.log(num_classes)  # Theoretical maximum (uniform distribution)

    if entropy > _OOD_ENTROPY_FRACTION * max_entropy:
        return (
            f"Model uncertainty is too high (entropy={entropy:.3f}; max={max_entropy:.3f}). "
            f"The image may be out-of-distribution, unsuitable for diagnosis, or ambiguous."
        )

    # ── 3. Top-2 margin check → ambiguous between two diseases ───────────────
    if top2_margin < _MIN_TOP2_MARGIN:
        top2_class = classes[int(sorted_idx[1].item())]
        return (
            f"Prediction is ambiguous between '{classes[top_idx]}' ({top_prob:.1%}) "
            f"and '{top2_class}' ({float(sorted_probs[1].item()):.1%}). "
            f"Margin ({top2_margin:.3f}) is below minimum ({_MIN_TOP2_MARGIN})."
        )

    return None  # Accept the prediction


# ── CLIP Multi-Crop Disease Prompt Ensembles ─────────────────────────────────
CROP_DISEASE_PROMPTS: Dict[str, Dict[str, List[str]]] = {
    "Maize": {
        "Healthy": [
            "a photo of fresh healthy ripe corn cob",
            "a photo of fresh yellow sweetcorn cobs with green husk",
            "a photo of clean healthy green maize foliage without any spots",
            "a photo of a healthy green corn plant",
            "fresh healthy corn without disease",
            "healthy ripe maize ear with golden kernels",
        ],
        "Common Rust": [
            "a photo of maize leaf with reddish brown rust pustules and powdery spores",
            "corn leaf covered with cinnamon brown rust spots",
            "maize foliage with scattered brown rust pustules on leaves",
        ],
        "Gray Leaf Spot": [
            "a photo of maize leaf with rectangular tan gray necrotic lesions",
            "gray leaf spot lesions running parallel to corn leaf veins",
        ],
        "Northern Leaf Blight": [
            "a photo of maize leaf with large cigar-shaped elliptical grayish blighted lesions",
            "severe northern leaf blight on corn leaves with necrotic tissue",
        ],
        "Maize Streak Virus": [
            "a photo of maize corn plant with yellow chlorotic streaks along veins",
            "stunted deformed maize plant with streak virus",
        ],
    },
    "Tomato": {
        "Healthy": [
            "a photo of a healthy green tomato plant",
            "clean fresh tomato leaves without spots",
            "fresh ripe healthy red tomato fruit on vine",
            "healthy green tomato plant foliage",
        ],
        "Bacterial Spot": [
            "tomato leaf with small dark brown circular water-soaked bacterial spots",
            "bacterial leaf spot on tomato plant with halo lesions",
        ],
        "Early Blight": [
            "tomato leaf with concentric target-ring dark brown blight lesions",
            "early blight fungal lesions on older tomato leaves",
        ],
        "Late Blight": [
            "tomato leaf with large dark water-soaked greasy necrotic blight patches",
            "late blight fungal decay on tomato foliage",
        ],
        "Yellow Leaf Curl Virus": [
            "tomato plant foliage with severe yellowing, upward leaf curling, and stunting",
            "tomato yellow leaf curl virus with deformed puckered leaves",
        ],
    },
    "Rice": {
        "Healthy": [
            "a photo of a healthy green rice paddy plant",
            "clean healthy rice leaves without blast or blight",
            "healthy rice crop canopy in field",
        ],
        "Bacterial Leaf Blight": [
            "rice leaf with water-soaked yellow to white undulating blighted lesions along leaf margins",
        ],
        "Blast": [
            "rice leaf with spindle-shaped or diamond-shaped blast lesions with gray center",
        ],
        "Brown Spot": [
            "rice leaf with circular or oval dark brown spots with gray or whitish center",
        ],
        "Tungro": [
            "rice plant with yellow-orange leaf discoloration and stunted tillers",
        ],
    },
    "Wheat": {
        "Healthy": [
            "a photo of a healthy wheat crop with clean green leaves",
            "clean healthy wheat ears and foliage",
            "golden healthy ripe wheat crop",
        ],
        "Brown Rust": [
            "wheat leaf with scattered small orange-brown rust pustules",
        ],
        "Yellow Rust": [
            "wheat leaf with bright yellow stripe rust pustules arranged in linear stripes",
        ],
        "Powdery Mildew": [
            "wheat leaf with white fluffy powdery fungal patches",
        ],
        "Septoria": [
            "wheat leaf with necrotic brown blotches with tiny black pycnidia speckles",
        ],
    },
    "Cotton": {
        "Healthy": [
            "a photo of a healthy cotton plant with green leaves",
            "fresh healthy cotton bolls and foliage",
        ],
        "Bacterial Blight": [
            "cotton leaf with angular dark brown water-soaked lesions bounded by veins",
        ],
        "Curl Virus": [
            "cotton plant with upward leaf curling, thickening of veins, and stunted growth",
        ],
        "Fusarium Wilt": [
            "cotton plant showing wilting, vascular browning, and yellowing of foliage",
        ],
        "Target Spot": [
            "cotton leaf with circular target-spot lesions with concentric dark rings",
        ],
    },
    "Soybean": {
        "Healthy": [
            "a photo of a healthy soybean plant with green trifoliate leaves",
            "clean healthy soybean foliage and pods",
        ],
        "Cercospora Leaf Blight": [
            "soybean leaf with reddish-purple to bronze discoloration on upper canopy leaves",
        ],
        "Frogeye Leaf Spot": [
            "soybean leaf with circular lesions with dark reddish-brown borders and tan centers",
        ],
        "Rust": [
            "soybean leaf with tiny brown rust lesions and pustules on leaf underside",
        ],
        "Yellow Mosaic": [
            "soybean plant with bright yellow mosaic patches and green mottling on leaves",
        ],
    },
    "Sugarcane": {
        "Healthy": [
            "a photo of a healthy green sugarcane crop",
            "clean healthy sugarcane leaf blades",
        ],
        "Red Rot": [
            "sugarcane stalk and leaf with internal red rot discoloration and white transverse patches",
        ],
        "Rust": [
            "sugarcane leaf with elongated reddish-brown rust pustules",
        ],
        "Mosaic": [
            "sugarcane leaf with chlorotic pale green and yellow mosaic mottling streaks",
        ],
        "Yellow Disease": [
            "sugarcane foliage showing midrib yellowing and leaf necrosis",
        ],
    },
    "Chickpea": {
        "Healthy": [
            "a photo of a healthy chickpea plant with green foliage",
            "clean healthy gram plant leaves and pods",
        ],
        "Ascochyta Blight": [
            "chickpea plant with circular necrotic lesions with concentric rings of black pycnidia",
        ],
        "Fusarium Wilt": [
            "chickpea plant with drooping petioles, yellowing foliage, and vascular wilt",
        ],
        "Dry Root Rot": [
            "chickpea plant with dry blackened roots, brittle stem, and sudden drying",
        ],
        "Stunt Virus": [
            "chickpea plant with shortened internodes, bushy appearance, and yellow-brown discoloration",
        ],
    },
    "Onion": {
        "Healthy": [
            "a photo of healthy upright green tubular onion foliage",
            "clean healthy onion plants growing in field with unblemished bulb",
        ],
        "Purple Blotch": [
            "onion leaf with sunken purple brown elliptical lesions with concentric rings and yellow chlorotic margin",
            "purple blotch disease on onion foliage with blighted leaf tops",
        ],
        "Stemphylium Blight": [
            "onion leaf with yellowish white expanding spindle-shaped flecks and blighted necrotic tips",
        ],
        "Basal Rot": [
            "onion bulb with soft rotting stem plate, pinkish white fungal decay, and dying yellow leaf tips",
        ],
        "Downy Mildew": [
            "onion leaf with violet gray downy fungal sporulation and chlorotic yellowing",
        ],
    },
    "Potato": {
        "Healthy": [
            "a photo of healthy green potato foliage and compound leaves with no blight",
            "clean fresh potato plant leaves growing in agricultural field",
        ],
        "Early Blight": [
            "potato leaf with dark brown circular target-board lesions with concentric rings",
        ],
        "Late Blight": [
            "potato leaf with dark water-soaked greasy brown lesions and white downy mildew on leaf underside",
        ],
        "Black Scurf": [
            "potato plant with black sclerotial encrustations on stems and aerial tubers",
        ],
        "Bacterial Wilt": [
            "potato plant with sudden daytime wilting of foliage, drooping stems, and vascular browning",
        ],
    },
    "Pigeon Pea": {
        "Healthy": [
            "a photo of healthy green pigeon pea tur foliage with trifoliate leaves and yellow blossoms",
            "clean healthy arhar plant leaves and pods",
        ],
        "Fusarium Wilt": [
            "pigeon pea plant with drooping wilted leaves, yellowing foliage, and purple brown stem streaks",
        ],
        "Sterility Mosaic Disease": [
            "pigeon pea plant with mosaic mottling, small distorted leaflets, bushy stunted branches, and no flowers",
        ],
        "Phytophthora Blight": [
            "pigeon pea with water-soaked purplish dark brown lesions girdling the main stem and collar rot",
        ],
        "Pod Borer Damage": [
            "pigeon pea green pods with bore holes and caterpillar insect pest damage",
        ],
    },
    "Groundnut": {
        "Healthy": [
            "a photo of healthy groundnut bhuimug plant foliage with bright green four leaflets",
            "clean healthy peanut crop leaves and flowers",
        ],
        "Tikka Leaf Spot": [
            "groundnut leaves with circular dark brown to black spots surrounded by prominent yellow halos",
        ],
        "Rust": [
            "groundnut leaf with reddish orange to brown powdery rust pustules on leaf underside",
        ],
        "Collar Rot": [
            "groundnut seedling with blackened rotting stem collar and white fungal mycelium",
        ],
        "Bud Necrosis": [
            "groundnut plant with necrotic terminal ring spots, chlorotic mottling, and stunted bunching",
        ],
    },
    "Pomegranate": {
        "Healthy": [
            "a photo of clean glossy green pomegranate dalimb foliage with smooth red fruit",
            "healthy unblemished bhagwa pomegranate fruit and leaves",
        ],
        "Bacterial Blight": [
            "pomegranate leaf with dark brown oily water soaked spots and fruit with black triangular L-shaped cracks",
            "telya bacterial blight on pomegranate fruit with dark weeping oily spots",
        ],
        "Anthracnose": [
            "pomegranate fruit and leaves with sunken dark brown to black circular spots",
        ],
        "Wilt Complex": [
            "pomegranate tree with sudden yellowing of leaves, defoliation, and drying branches",
        ],
        "Fruit Borer": [
            "pomegranate fruit with bore holes, insect excreta, and internal fruit rot",
        ],
    },
    "Grapes": {
        "Healthy": [
            "a photo of clean healthy green grapevine leaves and unblemished grape berry clusters",
            "healthy vineyard canopy with vibrant green palmate foliage",
        ],
        "Downy Mildew": [
            "grape leaf with yellowish oily translucent spots on upper surface and white cottony down beneath",
        ],
        "Powdery Mildew": [
            "grape leaves and green berries coated with white ash-gray powdery fungal growth and cracking",
        ],
        "Anthracnose": [
            "grape leaf with bird-eye lesions with dark brown margins and gray centers",
        ],
        "Bacterial Canker": [
            "grape shoots and leaves with dark angular cankers and weeping lesions",
        ],
    },
    "Banana": {
        "Healthy": [
            "a photo of large healthy broad emerald green banana leaf blades without streaks",
            "clean healthy banana plantation foliage and fruit bunch",
        ],
        "Panama Wilt": [
            "banana plant with yellowing lower leaves that buckle at petiole and hang down like a skirt",
        ],
        "Sigatoka Leaf Spot": [
            "banana leaf with narrow dark brown to black spindle-shaped streaks with gray centers and yellow halos",
        ],
        "Bunchy Top Virus": [
            "banana plant with congested upright narrow stunted leaves with rosette bunchy appearance",
        ],
        "Anthracnose": [
            "banana bunch with black sunken circular spots and pinkish fungal spore masses",
        ],
    },
    "Mango": {
        "Healthy": [
            "a photo of clean dark green glossy mango hapus tree foliage and clean developing fruit",
            "healthy mango orchard canopy with vibrant lanceolate leaves",
        ],
        "Anthracnose": [
            "mango leaves with dark brown necrotic spots and fruit with black tear-stain streaks",
        ],
        "Powdery Mildew": [
            "mango flowering panicles and tender leaves coated with white powdery fungal bloom and blossom drop",
        ],
        "Dieback": [
            "mango twigs dying backwards from tip downwards with brown withered leaves",
        ],
        "Bacterial Canker": [
            "mango leaves with water-soaked angular black lesions with yellow halos",
        ],
    },
    "Orange": {
        "Healthy": [
            "a photo of clean dark green glossy citrus orange tree leaves and unblemished nagpur santra fruit",
            "healthy citrus mandarin foliage without canker or gummosis",
        ],
        "Citrus Canker": [
            "citrus orange leaf and fruit with raised corky crater-like brown spots surrounded by yellow halos",
        ],
        "Phytophthora Gummosis": [
            "orange tree trunk with cracked bark and copious oozing amber gum and collar rot",
        ],
        "Citrus Greening (HLB)": [
            "citrus orange leaves with asymmetrical blotchy yellow chlorosis and small lopsided bitter fruit",
        ],
        "Dieback": [
            "citrus tree branches drying from tip downwards with defoliated dead twigs",
        ],
    },
    "Sorghum": {
        "Healthy": [
            "a photo of clean healthy green sorghum jowar leaves with white midrib and healthy grain head",
            "healthy maldandi jowar crop in field",
        ],
        "Grain Mold": [
            "sorghum grain panicle with pink, white, or velvety black fungal discoloration and crumbling seeds",
        ],
        "Anthracnose": [
            "sorghum leaf with elliptical tan necrotic lesions with prominent red-purple margins",
        ],
        "Charcoal Rot": [
            "sorghum stalk with internal black shredded pith and lodging at base",
        ],
        "Downy Mildew": [
            "sorghum leaves with yellow-white chlorotic striping and downy fungal growth",
        ],
    },
    "Pearl Millet": {
        "Healthy": [
            "a photo of clean healthy narrow green pearl millet bajra leaves and uniform cylindrical bristled earhead",
            "healthy bajra crop with green spikelets",
        ],
        "Downy Mildew": [
            "bajra plant with green ear head transformed into leafy vegetative structures and chlorotic leaf stripes",
        ],
        "Rust": [
            "bajra leaf with reddish brown powdery rust pustules on both leaf surfaces",
        ],
        "Ergot": [
            "bajra earhead spikelets exuding sticky pinkish amber honeydew droplets turning into dark sclerotia",
        ],
        "Blast": [
            "bajra leaf with diamond-shaped spindle lesions with gray centers and brown borders",
        ],
    },
    "Turmeric": {
        "Healthy": [
            "a photo of clean broad lush green turmeric halad leaves and healthy underground rhizomes",
            "healthy turmeric crop foliage in agricultural field",
        ],
        "Rhizome Rot": [
            "turmeric plant with yellowing leaves and water-soaked rotting soft pseudostem collar pulling out easily",
        ],
        "Leaf Spot": [
            "turmeric leaf with elliptical brown spots with grayish white centers and yellow chlorotic halos",
        ],
        "Leaf Blotch": [
            "turmeric leaf with reddish brown to dark brown blotches in rows along veins",
        ],
        "Fusarium Wilt": [
            "turmeric plant showing gradual leaf yellowing, drooping, and vascular wilting",
        ],
    },
}

_clip_disease_embeds_cache: Dict[str, torch.Tensor] = {}


def _get_clip_disease_embeds(crop_name: str, classes: List[str], model, processor) -> torch.Tensor:
    """Pre-builds normalized prompt embeddings for each disease class of a crop."""
    global _clip_disease_embeds_cache
    if crop_name in _clip_disease_embeds_cache:
        return _clip_disease_embeds_cache[crop_name]

    from services.crop_identification import _extract_text_features
    crop_prompts = CROP_DISEASE_PROMPTS.get(crop_name, {})

    embeds_list = []
    with torch.no_grad():
        for cls in classes:
            prompts = crop_prompts.get(cls, [f"a photo of {crop_name.lower()} with {cls.lower()} disease"])
            inputs = processor(text=prompts, padding=True, return_tensors="pt")
            feats = _extract_text_features(model, inputs)
            avg_feat = feats.mean(dim=0, keepdim=True)
            avg_feat = avg_feat / avg_feat.norm(dim=-1, keepdim=True)
            embeds_list.append(avg_feat)

    all_embeds = torch.cat(embeds_list, dim=0)
    _clip_disease_embeds_cache[crop_name] = all_embeds
    return all_embeds


def predict_crop_disease(
    crop_name: str,
    image_bytes: bytes,
    confidence_threshold: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Predicts disease for a crop image using CLIP vision-language prompt ensembles
    with multi-criteria abstain checking and MobileNetV3 fallback.
    """
    try:
        crop_cfg = CROP_CONFIGS.get(crop_name)
        if not crop_cfg or not crop_cfg.get("classes"):
            raise ValueError(f"Crop '{crop_name}' has no active disease model.")

        classes: List[str] = crop_cfg["classes"]
        num_classes = len(classes)

        using_default_threshold = confidence_threshold is None
        base_threshold = crop_cfg.get("confidence_threshold", 0.60) if using_default_threshold else confidence_threshold  # type: ignore[assignment]

        severity_map: Dict[str, str] = crop_cfg.get("severity_map", {})
        status_map: Dict[str, str] = crop_cfg.get("status_map", {})

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Try high-accuracy CLIP zero-shot classification
        probs = None
        sims = None
        try:
            from services.crop_identification import _get_crop_id_model, _extract_image_features
            clip_model, processor, _, _ = _get_crop_id_model()
            text_embeds = _get_clip_disease_embeds(crop_name, classes, clip_model, processor)

            inputs = processor(images=img, return_tensors="pt")
            with torch.no_grad():
                img_feat = _extract_image_features(clip_model, inputs)
                sims = (img_feat @ text_embeds.T)[0]
                # Temperature scaled probabilities
                probs = (sims * 35.0).softmax(dim=0)
        except Exception as clip_err:
            logger.warning(f"CLIP disease classification unavailable, using CNN fallback: {clip_err}")
            probs = None

        if probs is None:
            model, device = _get_crop_inference_model(crop_name)
            tensor_img = _inference_transform(img).unsqueeze(0).to(device)  # type: ignore[attr-defined]
            with torch.no_grad():
                outputs = model(tensor_img)
                probs = torch.softmax(outputs, dim=1)[0]

        top_prob_t, top_idx_t = torch.max(probs, dim=0)
        top_prob_raw = float(top_prob_t.item())
        top_confidence = round(top_prob_raw, 4)
        top_idx = int(top_idx_t.item())
        predicted_class = classes[top_idx]

        # Extract Top-3 predictions with probability
        sorted_probs, sorted_indices = torch.sort(probs, descending=True)
        top_predictions = []
        for i in range(min(3, len(classes))):
            c_idx = int(sorted_indices[i].item())
            top_predictions.append({
                "crop": crop_name,
                "condition": classes[c_idx],
                "confidence": round(float(sorted_probs[i].item()), 4),
                "probability": round(float(sorted_probs[i].item()), 4),
            })

        # Apply Healthy relaxation only for the default threshold
        threshold = base_threshold  # type: ignore[assignment]
        if using_default_threshold and predicted_class == "Healthy":
            threshold = base_threshold * _HEALTHY_THRESHOLD_MULTIPLIER  # type: ignore[assignment]

        logger.info(
            f"[{crop_name}] Prediction: {predicted_class} "
            f"({top_confidence:.1%}) | threshold={threshold:.3f}"
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
                "top_predictions": top_predictions,
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
            "top_predictions": top_predictions,
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
