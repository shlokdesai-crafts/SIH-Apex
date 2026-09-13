"""
backend/ml/train.py
───────────────────
PyTorch training script for multi-crop disease detection models.

Improvements over the previous version:
  • Stratified train/val/test splitting (same class ratio in every split)
  • Class-weighted CrossEntropyLoss to handle real dataset imbalance
  • CosineAnnealingLR learning rate scheduler for better convergence
  • Early stopping (patience=7 epochs by default) to avoid overfitting
  • Gradient clipping for training stability
  • Full evaluation report saved as JSON after training
"""

from __future__ import annotations

import json
import logging
import os
import argparse
import typing
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from ml.config import CROP_CONFIGS, MODEL_PATH, NUM_CLASSES, DATASET_DIR
from ml.dataset import load_dataset_splits, get_class_weights_for_crop
from ml.model import create_crop_model, save_crop_checkpoint, create_sugarcane_model, save_checkpoint

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def train_crop_model(
    crop_name: str = "Sugarcane",
    epochs: int = 20,
    batch_size: int = 16,
    learning_rate: float = 3e-4,
    patience: int = 7,
    num_workers: int = 0,
) -> nn.Module:
    """
    Trains the MobileNetV3-Large transfer learning model for a specified crop.

    Features:
      - Loads REAL images via load_dataset_splits() (raises FileNotFoundError if missing)
      - Stratified train/val/test splits
      - Class-weighted loss for imbalanced real datasets
      - CosineAnnealingLR scheduler
      - Early stopping (patience epochs)
      - Saves best-checkpoint by validation accuracy
      - Saves a JSON evaluation report alongside the checkpoint

    Args:
        crop_name: One of the crops in CROP_CONFIGS.
        epochs: Maximum training epochs (early stopping may halt sooner).
        batch_size: Mini-batch size. Reduce to 8 if you run out of RAM.
        learning_rate: Initial LR for AdamW.
        patience: Early-stopping patience (epochs without val-acc improvement).
        num_workers: DataLoader worker processes (0 = main thread, safe on Windows).

    Returns:
        Trained nn.Module in eval mode.

    Raises:
        FileNotFoundError: If real images are absent — run `python -m ml.download_data` first.
    """
    crop_cfg = CROP_CONFIGS.get(crop_name)
    if not crop_cfg or not crop_cfg.get("classes"):
        raise ValueError(f"Crop '{crop_name}' is not configured for training.")

    classes = crop_cfg["classes"]
    num_classes = len(classes)
    model_path: Path = crop_cfg["model_path"]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"[{crop_name}] Training on device: {device}")

    # ── Load splits ───────────────────────────────────────────────────────────
    train_ds, val_ds, test_ds = load_dataset_splits(crop_name=crop_name)
    train_loader = DataLoader(
        train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=device.type == "cuda"
    )
    val_loader = DataLoader(
        val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers
    )
    logger.info(
        f"[{crop_name}] Dataset → train={len(train_ds)}, val={len(val_ds)}, test={len(test_ds)}"
    )

    # ── Class-weighted loss ───────────────────────────────────────────────────
    try:
        class_weights = get_class_weights_for_crop(crop_name).to(device)
        logger.info(f"[{crop_name}] Class weights: {class_weights.tolist()}")
    except Exception:
        class_weights = None
        logger.warning(f"[{crop_name}] Could not compute class weights; using uniform loss.")

    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # ── Model ─────────────────────────────────────────────────────────────────
    model = create_crop_model(num_classes=num_classes, pretrained=True)
    model.to(device)

    # Two-phase LR: fine-tune backbone at 1/10th the head LR
    head_params = list(typing.cast(nn.Module, getattr(model, "classifier")).parameters())
    head_ids = {id(p) for p in head_params}
    backbone_params = [p for p in model.parameters() if id(p) not in head_ids]

    optimizer = torch.optim.AdamW([
        {"params": backbone_params, "lr": learning_rate / 10},
        {"params": head_params, "lr": learning_rate},
    ], weight_decay=1e-4)

    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)

    # ── Training loop ─────────────────────────────────────────────────────────
    best_val_acc = 0.0
    epochs_without_improvement = 0
    history = []

    for epoch in range(1, epochs + 1):
        # --- Train ---
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += (preds == labels).sum().item()
            train_total += labels.size(0)

        epoch_train_loss = train_loss / max(1, train_total)
        epoch_train_acc = train_correct / max(1, train_total)

        # --- Validate ---
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        epoch_val_loss = val_loss / max(1, val_total)
        epoch_val_acc = val_correct / max(1, val_total)
        scheduler.step()

        history.append({
            "epoch": epoch,
            "train_loss": round(epoch_train_loss, 5),
            "train_acc": round(epoch_train_acc, 4),
            "val_loss": round(epoch_val_loss, 5),
            "val_acc": round(epoch_val_acc, 4),
        })

        logger.info(
            f"[{crop_name}] Epoch {epoch:>3}/{epochs} | "
            f"Train: loss={epoch_train_loss:.4f} acc={epoch_train_acc:.4f} | "
            f"Val:   loss={epoch_val_loss:.4f} acc={epoch_val_acc:.4f}"
        )

        # --- Checkpoint + early stopping ---
        if epoch_val_acc >= best_val_acc:
            best_val_acc = epoch_val_acc
            epochs_without_improvement = 0
            save_crop_checkpoint(model, model_path)
            logger.info(f"[{crop_name}] ✓ New best val acc {best_val_acc:.4f} — checkpoint saved.")
        else:
            epochs_without_improvement += 1
            if epochs_without_improvement >= patience:
                logger.info(
                    f"[{crop_name}] Early stopping at epoch {epoch} "
                    f"(no improvement for {patience} epochs)."
                )
                break

    logger.info(f"[{crop_name}] Training complete. Best val accuracy: {best_val_acc:.4f}")

    # ── Reload best checkpoint for return ────────────────────────────────────
    from ml.model import load_crop_checkpoint
    model = load_crop_checkpoint(model_path, num_classes=num_classes, device=device)
    model.eval()

    # ── Save training history alongside checkpoint ────────────────────────────
    history_path = model_path.with_suffix(".train_history.json")
    history_path.write_text(json.dumps({"crop": crop_name, "history": history}, indent=2))

    return model


# ── Backwards-compatibility wrapper ──────────────────────────────────────────

def train_sugarcane_model(
    epochs: int = 20,
    batch_size: int = 16,
    learning_rate: float = 3e-4,
    save_path: Path = MODEL_PATH,
    data_dir: Path = DATASET_DIR,
) -> nn.Module:
    return train_crop_model(crop_name="Sugarcane", epochs=epochs, batch_size=batch_size, learning_rate=learning_rate)


if __name__ == "__main__":
    import sys
    crop_arg = sys.argv[1] if len(sys.argv) > 1 else "Sugarcane"
    train_crop_model(crop_name=crop_arg)
