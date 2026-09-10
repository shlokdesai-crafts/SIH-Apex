"""
services/crop_identification.py
───────────────────────────────
Phase 3A: Real crop identification model service with OOD / Unsupported crop rejection.
Uses HuggingFace Vision Transformer (openai/clip-vit-base-patch32) to classify images
across 8 target agricultural crops: Rice, Wheat, Maize, Cotton, Soybean, Sugarcane, Tomato, Chickpea.

Features:
  • Open-Set Negative Prompting & Cosine Similarity Margin Verification.
  • Rejects unsupported crops (e.g. Strawberry, Apple, Flowers) and low confidence inputs.
  • Returns CropIdentification with actual model confidence (0.0 to 1.0) and top crop name.
"""

import io
import logging
from typing import Optional, List

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

NULL_PROMPTS = [
    "a photo of a different plant, fruit or crop",
    "a photo of another unspecified plant",
]

SIMILARITY_THRESHOLD = 0.295  # Minimum raw cosine similarity for genuine crop match

# ── Lazy Singleton Model Cache ────────────────────────────────────────────────
_model: Optional[CLIPModel] = None
_processor: Optional[CLIPProcessor] = None
_all_prompts: Optional[List[str]] = None


def _get_crop_id_model():
    """Lazy initialization of CLIP vision model and candidate prompts."""
    global _model, _processor, _all_prompts
    if _model is None:
        logger.info("Loading CLIP Vision Transformer for Phase 3A Crop Identification...")
        model_id = "openai/clip-vit-base-patch32"
        _model = CLIPModel.from_pretrained(model_id).eval()
        _processor = CLIPProcessor.from_pretrained(model_id)
        crop_prompts = [f"a photo of a {c} crop or plant" for c in TARGET_CROPS]
        _all_prompts = crop_prompts + NULL_PROMPTS
    return _model, _processor, _all_prompts


def identify_crop(image_bytes: bytes) -> CropIdentification:
    """
    Classifies the uploaded crop image into one of the 8 target crop categories.
    Applies model-based open-set negative prompting and cosine similarity margin checks
    to reject unsupported crops and low confidence inputs.

    Returns:
        CropIdentification with crop_name, actual confidence (0.0 - 1.0),
        is_identified (bool), and rejection message if unsupported/low-confidence.
    """
    try:
        model, processor, prompts = _get_crop_id_model()

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = processor(text=prompts, images=img, return_tensors="pt", padding=True)

        with torch.no_grad():
            outputs = model(**inputs)
            # Calculate L2-normalized image and text embeddings for cosine similarity
            image_embeds = outputs.image_embeds / outputs.image_embeds.norm(dim=-1, keepdim=True)
            text_embeds = outputs.text_embeds / outputs.text_embeds.norm(dim=-1, keepdim=True)
            cosine_sims = (image_embeds @ text_embeds.T)[0]
            softmax_probs = outputs.logits_per_image.softmax(dim=1)[0]

        top_crop_idx = int(torch.argmax(cosine_sims[:8]).item())
        top_crop = TARGET_CROPS[top_crop_idx]
        top_sim = float(cosine_sims[top_crop_idx].item())
        top_conf = round(float(softmax_probs[top_crop_idx].item()), 4)

        max_null_sim = float(torch.max(cosine_sims[8:]).item())

        # ── 2-Step Out-Of-Distribution (OOD) Validation ──────────────────────
        # 1. Cosine similarity must meet minimum threshold (0.295)
        # 2. Supported crop similarity must strictly exceed open-set negative prompts
        is_valid_crop = (top_sim >= SIMILARITY_THRESHOLD) and (top_sim > max_null_sim)

        if not is_valid_crop:
            return CropIdentification(
                crop_name=top_crop,
                confidence=top_conf,
                is_identified=False,
                message="Unable to identify crop. Please ensure the crop is one of: Rice, Wheat, Maize, Cotton, Soybean, Sugarcane, Tomato, or Chickpea.",
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
