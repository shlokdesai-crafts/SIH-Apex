"""
backend/ml/evaluate.py
──────────────────────
Model evaluation script computing accuracy, precision, recall, and F1-score metrics for any crop model.
"""

import logging
from typing import Dict, Any

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from ml.config import CROP_CONFIGS, MODEL_PATH
from ml.model import load_crop_checkpoint, load_checkpoint
from ml.dataset import load_dataset_splits

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def evaluate_crop_model(crop_name: str = "Sugarcane", model: nn.Module = None, test_loader: DataLoader = None) -> Dict[str, Any]:
    """
    Evaluates model performance for `crop_name` and returns metrics dictionary.
    """
    crop_cfg = CROP_CONFIGS.get(crop_name)
    if not crop_cfg or not crop_cfg.get("classes"):
        raise ValueError(f"Crop {crop_name} is not configured.")

    classes = crop_cfg["classes"]
    num_classes = len(classes)
    model_path = crop_cfg["model_path"]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if model is None:
        model = load_crop_checkpoint(model_path, num_classes=num_classes, device=device)

    if test_loader is None:
        _, _, test_ds = load_dataset_splits(crop_name=crop_name)
        test_loader = DataLoader(test_ds, batch_size=8, shuffle=False)

    model.eval()
    model.to(device)

    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().tolist())
            all_targets.extend(labels.tolist())

    total = len(all_targets)
    if total == 0:
        logger.warning(f"Test dataset for {crop_name} is empty.")
        return {}

    correct = sum(p == t for p, t in zip(all_preds, all_targets))
    accuracy = correct / total

    class_metrics = {}
    for i, cls_name in enumerate(classes):
        tp = sum(1 for p, t in zip(all_preds, all_targets) if p == i and t == i)
        fp = sum(1 for p, t in zip(all_preds, all_targets) if p == i and t != i)
        fn = sum(1 for p, t in zip(all_preds, all_targets) if p != i and t == i)

        precision = tp / max(1, tp + fp)
        recall = tp / max(1, tp + fn)
        f1 = 2 * (precision * recall) / max(1e-6, precision + recall)

        class_metrics[cls_name] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "samples": sum(1 for t in all_targets if t == i),
        }

    report = {
        "crop": crop_name,
        "accuracy": round(accuracy, 4),
        "total_samples": total,
        "class_metrics": class_metrics,
    }

    logger.info(f"[{crop_name}] Evaluation Complete | Accuracy: {accuracy:.4f}")
    for cls_name, metrics in class_metrics.items():
        logger.info(f"  Class {cls_name:25s} -> Precision: {metrics['precision']:.4f}, Recall: {metrics['recall']:.4f}, F1: {metrics['f1_score']:.4f}")

    return report


def evaluate_sugarcane_model(model: nn.Module = None, test_loader: DataLoader = None) -> Dict[str, Any]:
    return evaluate_crop_model(crop_name="Sugarcane", model=model, test_loader=test_loader)


if __name__ == "__main__":
    import sys
    crop_arg = sys.argv[1] if len(sys.argv) > 1 else "Sugarcane"
    evaluate_crop_model(crop_name=crop_arg)
