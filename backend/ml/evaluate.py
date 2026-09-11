"""
backend/ml/evaluate.py
──────────────────────
Comprehensive model evaluation: accuracy, precision, recall, F1-score,
per-class accuracy, confusion matrix, and macro/weighted averages.
Saves a full JSON report alongside the model checkpoint.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from ml.config import CROP_CONFIGS, MODEL_PATH
from ml.model import load_crop_checkpoint, load_checkpoint
from ml.dataset import load_dataset_splits

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def _build_confusion_matrix(preds: List[int], targets: List[int], num_classes: int) -> List[List[int]]:
    """Returns a num_classes × num_classes confusion matrix (row=true, col=pred)."""
    matrix: List[List[int]] = [[0] * num_classes for _ in range(num_classes)]
    for t, p in zip(targets, preds):
        if 0 <= t < num_classes and 0 <= p < num_classes:
            matrix[t][p] += 1
    return matrix


def evaluate_crop_model(
    crop_name: str = "Sugarcane",
    model: Optional[nn.Module] = None,
    test_loader: Optional[DataLoader] = None,
    save_report: bool = True,
) -> Dict[str, Any]:
    """
    Evaluates a crop disease model on the test split and returns a metrics dictionary.

    Returns:
        {
          "crop": str,
          "accuracy": float,
          "macro_precision": float,
          "macro_recall": float,
          "macro_f1": float,
          "weighted_f1": float,
          "total_samples": int,
          "class_metrics": {
              "<ClassName>": {
                  "precision": float,
                  "recall": float,
                  "f1_score": float,
                  "accuracy": float,     # per-class accuracy = TP / total_true
                  "samples": int,        # true positives + false negatives
                  "predicted": int,      # total times this class was predicted
              }
          },
          "confusion_matrix": List[List[int]],  # row=true, col=pred
          "class_names": List[str],
        }
    """
    crop_cfg = CROP_CONFIGS.get(crop_name)
    if not crop_cfg or not crop_cfg.get("classes"):
        raise ValueError(f"Crop '{crop_name}' is not configured.")

    classes: List[str] = crop_cfg["classes"]
    num_classes = len(classes)
    model_path: Path = crop_cfg["model_path"]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if model is None:
        model = load_crop_checkpoint(model_path, num_classes=num_classes, device=device)

    if test_loader is None:
        try:
            _, _, test_ds = load_dataset_splits(crop_name=crop_name)
        except FileNotFoundError as exc:
            logger.error(str(exc))
            return {"crop": crop_name, "error": str(exc)}
        test_loader = DataLoader(test_ds, batch_size=16, shuffle=False, num_workers=0)

    model.eval()
    model.to(device)

    all_preds: List[int] = []
    all_targets: List[int] = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().tolist())
            all_targets.extend(labels.tolist())

    total = len(all_targets)
    if total == 0:
        logger.warning(f"[{crop_name}] Test dataset is empty.")
        return {"crop": crop_name, "error": "Empty test dataset"}

    correct = sum(p == t for p, t in zip(all_preds, all_targets))
    overall_accuracy = correct / total

    # ── Per-class metrics ─────────────────────────────────────────────────────
    class_metrics: Dict[str, Dict[str, Any]] = {}
    f1_list: List[float] = []
    sample_counts: List[int] = []

    for i, cls_name in enumerate(classes):
        tp = sum(1 for p, t in zip(all_preds, all_targets) if p == i and t == i)
        fp = sum(1 for p, t in zip(all_preds, all_targets) if p == i and t != i)
        fn = sum(1 for p, t in zip(all_preds, all_targets) if p != i and t == i)
        n_true = tp + fn  # actual samples of this class
        n_pred = tp + fp  # times model predicted this class

        precision = tp / max(1, tp + fp)
        recall = tp / max(1, tp + fn)
        f1 = 2 * (precision * recall) / max(1e-9, precision + recall)
        per_class_acc = tp / max(1, n_true)  # recall == per-class accuracy

        class_metrics[cls_name] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "accuracy": round(per_class_acc, 4),
            "samples": n_true,
            "predicted": n_pred,
        }
        f1_list.append(f1)
        sample_counts.append(n_true)

    # ── Macro & weighted averages ─────────────────────────────────────────────
    macro_precision = sum(class_metrics[c]["precision"] for c in classes) / num_classes
    macro_recall = sum(class_metrics[c]["recall"] for c in classes) / num_classes
    macro_f1 = sum(f1_list) / num_classes

    if total > 0:
        weighted_f1 = sum(f1 * n for f1, n in zip(f1_list, sample_counts)) / total
    else:
        weighted_f1 = 0.0

    # ── Confusion matrix ──────────────────────────────────────────────────────
    confusion = _build_confusion_matrix(all_preds, all_targets, num_classes)

    report: Dict[str, Any] = {
        "crop": crop_name,
        "accuracy": round(overall_accuracy, 4),
        "macro_precision": round(macro_precision, 4),
        "macro_recall": round(macro_recall, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_f1": round(weighted_f1, 4),
        "total_samples": total,
        "class_metrics": class_metrics,
        "confusion_matrix": confusion,
        "class_names": classes,
    }

    # ── Logging ───────────────────────────────────────────────────────────────
    logger.info(f"\n{'='*60}")
    logger.info(f"[{crop_name}] Evaluation on {total} test samples")
    logger.info(f"  Overall accuracy : {overall_accuracy:.4f}")
    logger.info(f"  Macro precision  : {macro_precision:.4f}")
    logger.info(f"  Macro recall     : {macro_recall:.4f}")
    logger.info(f"  Macro F1         : {macro_f1:.4f}")
    logger.info(f"  Weighted F1      : {weighted_f1:.4f}")
    logger.info(f"{'─'*60}")
    logger.info(f"  {'Class':<28} {'Prec':>6} {'Rec':>6} {'F1':>6} {'Acc':>6} {'N':>5}")
    for cls_name, m in class_metrics.items():
        logger.info(
            f"  {cls_name:<28} {m['precision']:>6.3f} {m['recall']:>6.3f} "
            f"{m['f1_score']:>6.3f} {m['accuracy']:>6.3f} {m['samples']:>5}"
        )

    # Confusion matrix print
    logger.info(f"\n  Confusion Matrix (row=true, col=pred):")
    header = " " * 28 + " ".join(f"{c[:6]:>7}" for c in classes)
    logger.info(f"  {header}")
    for i, row in enumerate(confusion):
        row_str = " ".join(f"{v:>7}" for v in row)
        logger.info(f"  {classes[i]:<28} {row_str}")

    # ── Save JSON report ──────────────────────────────────────────────────────
    if save_report:
        report_path = model_path.with_suffix(".eval_report.json")
        report_path.write_text(json.dumps(report, indent=2))
        logger.info(f"\n  Report saved → {report_path}")

    return report


def evaluate_sugarcane_model(
    model: Optional[nn.Module] = None,
    test_loader: Optional[DataLoader] = None,
) -> Dict[str, Any]:
    return evaluate_crop_model(crop_name="Sugarcane", model=model, test_loader=test_loader)


if __name__ == "__main__":
    import sys
    crop_arg = sys.argv[1] if len(sys.argv) > 1 else "Sugarcane"
    evaluate_crop_model(crop_name=crop_arg)
