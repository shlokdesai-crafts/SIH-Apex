"""
backend/ml/train.py
───────────────────
PyTorch training script supporting multi-crop disease detection model training.
"""

import logging
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from ml.config import CROP_CONFIGS, MODEL_PATH, NUM_CLASSES, DATASET_DIR
from ml.model import create_crop_model, save_crop_checkpoint, create_sugarcane_model, save_checkpoint
from ml.dataset import load_dataset_splits

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def train_crop_model(
    crop_name: str = "Sugarcane",
    epochs: int = 5,
    batch_size: int = 8,
    learning_rate: float = 1e-3
) -> nn.Module:
    """
    Trains the MobileNetV3-Large transfer learning model for a specified crop (`Sugarcane`, `Soybean`, etc.).
    Saves best model weights checkpoint to the registered crop model path.
    """
    crop_cfg = CROP_CONFIGS.get(crop_name)
    if not crop_cfg or not crop_cfg.get("classes"):
        raise ValueError(f"Crop {crop_name} is not configured for training.")

    classes = crop_cfg["classes"]
    num_classes = len(classes)
    model_path = crop_cfg["model_path"]
    data_dir = crop_cfg["data_dir"]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training {crop_name} model ({num_classes} classes) on device: {device}")

    # Load dataset splits
    train_ds, val_ds, _ = load_dataset_splits(crop_name=crop_name)
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)

    logger.info(f"Loaded {crop_name} dataset: {len(train_ds)} train samples, {len(val_ds)} val samples.")

    # Initialize model
    model = create_crop_model(num_classes=num_classes, pretrained=True)
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)

    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += (preds == labels).sum().item()
            train_total += labels.size(0)

        epoch_train_loss = train_loss / max(1, train_total)
        epoch_train_acc = train_correct / max(1, train_total)

        # Validation loop
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

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

        logger.info(
            f"[{crop_name}] Epoch {epoch}/{epochs} | "
            f"Train Loss: {epoch_train_loss:.4f}, Train Acc: {epoch_train_acc:.4f} | "
            f"Val Loss: {epoch_val_loss:.4f}, Val Acc: {epoch_val_acc:.4f}"
        )

        # Save best model
        if epoch_val_acc >= best_val_acc:
            best_val_acc = epoch_val_acc
            save_crop_checkpoint(model, model_path)

    logger.info(f"[{crop_name}] Training complete. Best Validation Accuracy: {best_val_acc:.4f}")
    return model


# Backwards compatibility wrapper for Sugarcane
def train_sugarcane_model(epochs: int = 5, batch_size: int = 8, learning_rate: float = 1e-3, save_path: Path = MODEL_PATH, data_dir: Path = DATASET_DIR) -> nn.Module:
    return train_crop_model(crop_name="Sugarcane", epochs=epochs, batch_size=batch_size, learning_rate=learning_rate)


if __name__ == "__main__":
    import sys
    crop_arg = sys.argv[1] if len(sys.argv) > 1 else "Sugarcane"
    train_crop_model(crop_name=crop_arg)
