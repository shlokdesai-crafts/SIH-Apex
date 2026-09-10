"""
services/crop_identification.py
───────────────────────────────
Phase 3A: Real crop identification model service with OOD / Unsupported crop rejection.
Uses HuggingFace Vision Transformer (openai/clip-vit-base-patch32) with Crop-Specific
Prompt Ensembles & Text Feature Averaging to classify images across 8 target agricultural crops:
Rice, Wheat, Maize, Cotton, Soybean, Sugarcane, Tomato, Chickpea.

Features:
  • Multi-prompt text feature ensemble averaging per crop class.
  • Open-Set Negative Prompting & Cosine Similarity Margin Verification.
  • Rejects unsupported crops (e.g. Strawberry, Apple, Flowers) and low confidence inputs.
  • Returns CropIdentification with actual model confidence (0.0 to 1.0) and top crop name.
"""

import io
import logging
from typing import Optional, List, Dict

from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

from models.response import CropIdentification

logger = logging.getLogger(__name__)

# ── Configurable Target Classes & Thresholds ─────────────────────────────────
TARGET_CROPS = [
    "Rice",
    "Wheat",
    "Maize",
    "Cotton",
    "Soybean",
    "Sugarcane",
    "Tomato",
    "Chickpea",
]

# Crop-specific prompt ensembles for fine-grained morphological feature extraction
CROP_PROMPT_ENSEMBLES: Dict[str, List[str]] = {
    "Rice": [
        "a photo of a rice crop or paddy plant",
        "paddy field with green rice plants",
        "rice leaf blade showing narrow parallel veins",
        "close up of paddy leaf and rice tillers",
        "rice crop foliage in flooded field",
        "rice plant with green leaves and panicles",
    ],
    "Wheat": [
        "a photo of a wheat crop",
        "wheat field with wheat ears and spikes",
        "wheat plant leaf blade and stalk",
        "close up of wheat leaves and grain head",
        "wheat crop foliage in farm field",
    ],
    "Maize": [
        "a photo of a maize crop",
        "a photo of a corn plant",
        "broad maize corn leaf blade",
        "maize foliage in agricultural field",
        "close up of maize leaf",
    ],
    "Cotton": [
        "a photo of a cotton plant",
        "a photo of a cotton crop in a field",
        "cotton plant with lobed leaves",
        "close up of a cotton leaf blade",
        "cotton bolls and green leaves",
        "cotton crop foliage",
    ],
    "Soybean": [
        "a photo of a soybean plant",
        "a photo of a soybean crop in a field",
        "soybean plant with trifoliate leaves",
        "close up of a soybean leaf",
        "soybean crop foliage",
    ],
    "Sugarcane": [
        "a photo of a sugarcane crop",
        "a photo of a sugarcane plant",
        "a close up photo of a sugarcane leaf",
        "long narrow sugarcane leaf blade with prominent midrib",
        "sugarcane foliage in an agricultural field",
        "sugarcane stalk and green leaves",
        "sugarcane leaf showing veins",
    ],
    "Tomato": [
        "a photo of a tomato plant",
        "compound serrated tomato leaf",
        "tomato plant foliage",
        "green tomato leaf in field",
    ],
    "Chickpea": [
        "a photo of a chickpea plant",
        "small pinnate chickpea leaflets",
        "chickpea crop foliage",
        "gram plant leaves in field",
    ],
}

NULL_PROMPTS = [
    "a photo of a different plant, fruit or crop",
    "a photo of another unspecified plant or object",
]

SIMILARITY_THRESHOLD = 0.285  # Calibrated minimum cosine similarity for genuine crop match
SIMILARITY_MARGIN_THRESHOLD = 0.015  # Minimum margin between top-1 and top-2 candidate crops to avoid ambiguous misclassification

# ── Lazy Singleton Model Cache ────────────────────────────────────────────────
_model: Optional[CLIPModel] = None
_processor: Optional[CLIPProcessor] = None
_all_text_embeds: Optional[torch.Tensor] = None
_all_vis_embeds: Optional[torch.Tensor] = None


def _extract_text_features(model: CLIPModel, inputs) -> torch.Tensor:
    """Helper to extract normalized text feature tensor from CLIP outputs."""
    outputs = model.get_text_features(**inputs)
    if hasattr(outputs, "text_embeds"):
        feats = outputs.text_embeds
    elif hasattr(outputs, "pooler_output"):
        feats = outputs.pooler_output
    else:
        feats = outputs
    return feats / feats.norm(dim=-1, keepdim=True)


def _extract_image_features(model: CLIPModel, inputs) -> torch.Tensor:
    """Helper to extract normalized image feature tensor from CLIP outputs."""
    outputs = model.get_image_features(**inputs)
    if hasattr(outputs, "image_embeds"):
        feats = outputs.image_embeds
    elif hasattr(outputs, "pooler_output"):
        feats = outputs.pooler_output
    else:
        feats = outputs
    return feats / feats.norm(dim=-1, keepdim=True)


def _get_crop_id_model():
    """Lazy initialization of CLIP vision model, text embeddings, and visual prototype embeddings."""
    global _model, _processor, _all_text_embeds, _all_vis_embeds
    if _model is None:
        logger.info("Loading CLIP Vision Transformer for Phase 3A Crop Identification...")
        model_id = "openai/clip-vit-base-patch32"
        _model = CLIPModel.from_pretrained(model_id).eval()
        _processor = CLIPProcessor.from_pretrained(model_id)

        # Build ensemble text embeddings per crop class
        text_embeds_list = []
        with torch.no_grad():
            for crop in TARGET_CROPS:
                prompts = CROP_PROMPT_ENSEMBLES[crop]
                inputs = _processor(text=prompts, padding=True, return_tensors="pt")
                norm_embeds = _extract_text_features(_model, inputs)
                avg_embed = norm_embeds.mean(dim=0, keepdim=True)
                avg_embed = avg_embed / avg_embed.norm(dim=-1, keepdim=True)
                text_embeds_list.append(avg_embed)

            # Null / OOD negative prompts
            null_inputs = _processor(text=NULL_PROMPTS, padding=True, return_tensors="pt")
            null_embeds = _extract_text_features(_model, null_inputs)
            for i in range(null_embeds.size(0)):
                text_embeds_list.append(null_embeds[i:i+1])

        _all_text_embeds = torch.cat(text_embeds_list, dim=0)

        # Build visual prototype embeddings per crop class
        from ml.config import BASE_DIR
        images_dir = BASE_DIR.parent.parent / "public" / "images"
        crop_exemplar_files = {
            "Cotton": ["crop_cotton.jpg", "crop_leaf1.jpg", "crop_leaf3.jpg"],
            "Soybean": ["crop_soybean.jpg"],
            "Rice": ["crop_rice.jpg"],
            "Wheat": ["crop_wheat.jpg"],
            "Sugarcane": ["crop_sugarcane.jpg"],
            "Maize": ["crop_maize.jpg"],
            "Tomato": ["crop_tomato.jpg"],
            "Chickpea": ["crop_chickpea.jpg"],
        }

        vis_embeds_list = []
        with torch.no_grad():
            for crop in TARGET_CROPS:
                files = crop_exemplar_files.get(crop, [])
                feats_list = []
                for fn in files:
                    fp = images_dir / fn
                    if not fp.exists():
                        data_fp = BASE_DIR / "data" / crop.lower()
                        if data_fp.exists():
                            for sample_p in data_fp.rglob("*.jpg"):
                                img = Image.open(sample_p).convert("RGB")
                                inputs = _processor(images=img, return_tensors="pt")
                                f = _extract_image_features(_model, inputs)
                                feats_list.append(f)
                                if len(feats_list) >= 5:
                                    break
                        continue
                    img = Image.open(fp).convert("RGB")
                    inputs = _processor(images=img, return_tensors="pt")
                    f = _extract_image_features(_model, inputs)
                    feats_list.append(f)

                if feats_list:
                    cat_feats = torch.cat(feats_list, dim=0)
                    mean_proto = cat_feats.mean(dim=0, keepdim=True)
                    mean_proto = mean_proto / mean_proto.norm(dim=-1, keepdim=True)
                    vis_embeds_list.append(mean_proto)
                else:
                    vis_embeds_list.append(text_embeds_list[TARGET_CROPS.index(crop)])

        _all_vis_embeds = torch.cat(vis_embeds_list, dim=0)

    return _model, _processor, _all_text_embeds, _all_vis_embeds


def identify_crop(image_bytes: bytes) -> CropIdentification:
    """
    Classifies the uploaded crop image into one of the 8 target crop categories.
    Uses multimodal text-visual prompt ensembling and open-set negative prompt validation.

    Returns:
        CropIdentification with crop_name, actual confidence (0.0 - 1.0),
        is_identified (bool), and rejection message if unsupported/ambiguous/low-confidence.
    """
    try:
        model, processor, text_embeds, vis_embeds = _get_crop_id_model()

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = processor(images=img, return_tensors="pt")

        with torch.no_grad():
            img_embed = _extract_image_features(model, inputs)

            # Cosine similarity to text prompts & visual prototypes
            text_sims = (img_embed @ text_embeds[:8].T)[0]
            vis_sims = (img_embed @ vis_embeds.T)[0]

            # Multimodal similarity score: 30% text semantics + 70% visual feature prototypes
            cosine_sims = 0.3 * text_sims + 0.7 * vis_sims

            # Temperature-scaled logits and softmax probabilities
            logits = cosine_sims * model.logit_scale.exp()
            softmax_probs = logits.softmax(dim=0)

        top_crop_idx = int(torch.argmax(cosine_sims).item())
        top_crop = TARGET_CROPS[top_crop_idx]
        top_sim = float(cosine_sims[top_crop_idx].item())
        top_conf = round(float(softmax_probs[top_crop_idx].item()), 4)

        # Get second highest similarity among candidate crops
        sorted_sims = torch.sort(cosine_sims, descending=True)[0]
        second_sim = float(sorted_sims[1].item())
        margin = top_sim - second_sim

        # ── 3-Step Out-Of-Distribution (OOD) & Ambiguity Validation ──────────
        # 1. Text semantic similarity must meet minimum threshold (0.285)
        # 2. Text crop similarity must strictly exceed open-set negative null prompts
        # 3. Top candidate similarity must exceed 2nd candidate by margin (0.015)
        max_crop_text_sim = float(torch.max(text_sims).item())
        null_sims = (img_embed @ text_embeds[8:].T)[0]
        max_null_text_sim = float(torch.max(null_sims).item())

        is_valid_crop = (
            (top_sim >= SIMILARITY_THRESHOLD)
            and (max_crop_text_sim >= SIMILARITY_THRESHOLD)
            and (max_crop_text_sim > max_null_text_sim)
            and (margin >= SIMILARITY_MARGIN_THRESHOLD)
        )

        if not is_valid_crop:
            return CropIdentification(
                crop_name=top_crop,
                confidence=top_conf,
                is_identified=False,
                message="Unable to identify crop. Please ensure the crop photo clearly shows one of: Rice, Wheat, Maize, Cotton, Soybean, Sugarcane, Tomato, or Chickpea.",
            )

        return CropIdentification(
            crop_name=top_crop,
            confidence=top_conf,
            is_identified=True,
            message=None,
        )

    except Exception as exc:
        logger.error(f"Error in identify_crop: {exc}")
        return CropIdentification(
            crop_name="Unknown",
            confidence=0.0,
            is_identified=False,
            message="Unable to identify crop due to processing error.",
        )
