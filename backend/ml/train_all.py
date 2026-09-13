"""
backend/ml/train_all.py
────────────────────────
Convenience script: trains and evaluates all 8 crop disease models sequentially,
then prints a summary table with precision, recall, F1, and accuracy per crop.

Usage:
    python -m ml.train_all                        # all crops, 20 epochs
    python -m ml.train_all --crops Maize Rice     # specific crops
    python -m ml.train_all --epochs 30            # override epochs
    python -m ml.train_all --eval-only            # skip training, just evaluate
"""

from __future__ import annotations

import argparse
import logging
import time
from typing import Any, Dict, List

from ml.config import CROP_CONFIGS

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def run_all(
    crops: List[str],
    epochs: int = 20,
    batch_size: int = 16,
    eval_only: bool = False,
) -> Dict[str, Dict[str, Any]]:
    """
    Trains and evaluates each crop model in sequence.
    Returns a dict of {crop_name: eval_report}.
    """
    all_results: Dict[str, Dict[str, Any]] = {}

    for crop_name in crops:
        logger.info(f"\n{'#'*60}")
        logger.info(f"# Processing: {crop_name}")
        logger.info(f"{'#'*60}")
        t0 = time.time()

        if not eval_only:
            try:
                from ml.train import train_crop_model
                train_crop_model(crop_name=crop_name, epochs=epochs, batch_size=batch_size)
            except FileNotFoundError as exc:
                logger.error(f"[{crop_name}] Skipping training — data missing: {exc}")
                logger.error(f"  Run: python -m ml.download_data --crop {crop_name}")
                all_results[crop_name] = {"error": str(exc)}
                continue
            except Exception as exc:
                logger.error(f"[{crop_name}] Training failed: {exc}")
                all_results[crop_name] = {"error": str(exc)}
                continue

        try:
            from ml.evaluate import evaluate_crop_model
            report = evaluate_crop_model(crop_name=crop_name)
            all_results[crop_name] = report
        except Exception as exc:
            logger.error(f"[{crop_name}] Evaluation failed: {exc}")
            all_results[crop_name] = {"error": str(exc)}

        elapsed = time.time() - t0
        logger.info(f"[{crop_name}] Done in {elapsed:.1f}s")

    # ── Summary table ─────────────────────────────────────────────────────────
    print(f"\n{'='*75}")
    print(f"  TRAINING SUMMARY")
    print(f"{'='*75}")
    print(f"  {'Crop':<12} {'Accuracy':>9} {'MacroF1':>9} {'WeightedF1':>11} {'Samples':>8}")
    print(f"  {'-'*60}")

    for crop_name, report in all_results.items():
        if "error" in report:
            print(f"  {crop_name:<12} {'ERROR':>9} — {report['error'][:40]}")
        else:
            print(
                f"  {crop_name:<12} "
                f"{report.get('accuracy', 0):>9.4f} "
                f"{report.get('macro_f1', 0):>9.4f} "
                f"{report.get('weighted_f1', 0):>11.4f} "
                f"{report.get('total_samples', 0):>8}"
            )
    print(f"{'='*75}\n")

    return all_results


def main() -> None:
    parser = argparse.ArgumentParser(description="Train and evaluate all crop disease models.")
    parser.add_argument("--crops", nargs="*", help="Crop names to process (default: all).")
    parser.add_argument("--epochs", type=int, default=20, help="Training epochs per crop.")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size.")
    parser.add_argument("--eval-only", action="store_true", help="Skip training; evaluate only.")
    args = parser.parse_args()

    all_crops = list(CROP_CONFIGS.keys())
    target_crops = args.crops if args.crops else all_crops

    unknown = [c for c in target_crops if c not in CROP_CONFIGS]
    if unknown:
        print(f"Unknown crops: {unknown}. Available: {all_crops}")
        return

    run_all(
        crops=target_crops,
        epochs=args.epochs,
        batch_size=args.batch_size,
        eval_only=args.eval_only,
    )


if __name__ == "__main__":
    main()
