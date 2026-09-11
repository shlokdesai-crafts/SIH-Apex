"""
backend/ml/dataset.py
──────────────────────
Multi-crop real-data dataset loader, transformations, and stratified splitting.

IMPORTANT: This module requires REAL labeled images in backend/ml/data/<crop>/<ClassName>/.
           Run `python -m ml.download_data` to fetch them from PlantVillage / HuggingFace.
           Synthetic image generation has been removed — it produced models that fail on
           real photographs (all 25 samples per class were identical procedural bitmaps).
"""

from __future__ import annotations

import logging
import random
from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import torch
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms

from ml.config import CROP_CONFIGS, IMAGE_SIZE, IMAGENET_MEAN, IMAGENET_STD

logger = logging.getLogger(__name__)

# ── Transforms ────────────────────────────────────────────────────────────────

def get_transforms() -> Tuple[transforms.Compose, transforms.Compose]:
    """
    Returns (train_transforms, val_transforms).

    Train transforms use strong augmentation suitable for real field images:
    - RandomResizedCrop handles variable framing and zoom levels
    - ColorJitter handles lighting variation and white balance differences
    - GaussianBlur simulates camera motion/focus issues
    - HorizontalFlip and RandomRotation add orientation invariance
    """
    train_transforms = transforms.Compose([
        transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.6, 1.0), ratio=(0.75, 1.33)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=20),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.05),
        transforms.RandomGrayscale(p=0.05),
        transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 1.5)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        transforms.RandomErasing(p=0.1, scale=(0.02, 0.1)),  # Simulate partial occlusion
    ])

    val_transforms = transforms.Compose([
        transforms.Resize((int(IMAGE_SIZE[0] * 1.1), int(IMAGE_SIZE[1] * 1.1))),
        transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    return train_transforms, val_transforms


# ── Dataset ───────────────────────────────────────────────────────────────────

class CropImageDataset(Dataset):
    """PyTorch Dataset for multi-crop leaf disease images."""

    def __init__(
        self,
        image_paths: List[Path],
        labels: List[int],
        transform: Optional[transforms.Compose] = None,
    ):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, index: int) -> Tuple[torch.Tensor, int]:
        img_path = self.image_paths[index]
        try:
            image = Image.open(img_path).convert("RGB")
        except Exception as exc:
            logger.warning(f"Could not load image {img_path}: {exc}. Replacing with blank.")
            image = Image.new("RGB", IMAGE_SIZE, (128, 128, 128))

        label = self.labels[index]
        if self.transform:
            image = self.transform(image)  # type: ignore[assignment]
        return image, label  # type: ignore[return-value]


# Backwards compatibility alias
SugarcaneImageDataset = CropImageDataset


# ── Class-weight computation ──────────────────────────────────────────────────

def compute_class_weights(labels: List[int], num_classes: int) -> torch.Tensor:
    """
    Computes inverse-frequency class weights for CrossEntropyLoss.
    Handles class imbalance in real datasets gracefully.
    """
    counts = Counter(labels)
    total = len(labels)
    weights = []
    for i in range(num_classes):
        c = counts.get(i, 0)
        weights.append(total / (num_classes * max(c, 1)))
    w = torch.tensor(weights, dtype=torch.float32)
    return w / w.sum() * num_classes  # Normalise so mean weight ≈ 1.0


# ── Stratified splitting ──────────────────────────────────────────────────────

def _stratified_split(
    paths: List[Path],
    labels: List[int],
    val_frac: float,
    test_frac: float,
    seed: int = 42,
) -> Tuple[List[Path], List[int], List[Path], List[int], List[Path], List[int]]:
    """
    Splits paths/labels with the same class distribution in train/val/test.
    Guarantees that every class appears in every split (as long as ≥ 3 samples).
    """
    rng = random.Random(seed)
    class_buckets: Dict[int, List[int]] = {}
    for i, lbl in enumerate(labels):
        class_buckets.setdefault(lbl, []).append(i)

    train_idx, val_idx, test_idx = [], [], []
    for lbl, idxs in class_buckets.items():
        shuffled = idxs[:]
        rng.shuffle(shuffled)
        n = len(shuffled)
        n_test = max(1, int(n * test_frac))
        n_val = max(1, int(n * val_frac))
        n_train = n - n_val - n_test

        if n_train < 1:
            # Not enough samples — put all in train, skip val/test for this class
            logger.warning(
                f"Class {lbl} has only {n} samples — cannot create a proper split. "
                "Add more real images for this class."
            )
            train_idx.extend(shuffled)
            continue

        train_idx.extend(shuffled[:n_train])
        val_idx.extend(shuffled[n_train:n_train + n_val])
        test_idx.extend(shuffled[n_train + n_val:])

    def _gather(idx_list: List[int]) -> Tuple[List[Path], List[int]]:
        rng.shuffle(idx_list)
        return [paths[i] for i in idx_list], [labels[i] for i in idx_list]

    tr_p, tr_l = _gather(train_idx)
    va_p, va_l = _gather(val_idx)
    te_p, te_l = _gather(test_idx)
    return tr_p, tr_l, va_p, va_l, te_p, te_l


# ── Public API ────────────────────────────────────────────────────────────────

def _collect_images(data_dir: Path, classes: List[str]) -> Tuple[List[Path], List[int]]:
    """Scans data_dir/<ClassName>/ folders and returns (paths, labels)."""
    all_paths: List[Path] = []
    all_labels: List[int] = []
    class_to_idx = {cls: i for i, cls in enumerate(classes)}

    for cls_name in classes:
        cls_dir = data_dir / cls_name
        if not cls_dir.exists():
            logger.warning(f"Missing class directory: {cls_dir}")
            continue
        idx = class_to_idx[cls_name]
        n_before = len(all_paths)
        for ext in ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"):
            for p in cls_dir.glob(ext):
                all_paths.append(p)
                all_labels.append(idx)
        n_found = len(all_paths) - n_before
        logger.info(f"  {cls_name}: {n_found} images")

    return all_paths, all_labels


def load_dataset_splits(
    crop_name: str = "Sugarcane",
    val_split: float = 0.15,
    test_split: float = 0.10,
) -> Tuple[CropImageDataset, CropImageDataset, CropImageDataset]:
    """
    Loads real labeled images from disk and returns stratified train/val/test splits.

    Raises:
        FileNotFoundError: If the data directory is missing or empty — tells the user
                           to run `python -m ml.download_data` instead of silently
                           generating synthetic images.
    """
    crop_cfg = CROP_CONFIGS.get(crop_name)
    if not crop_cfg or not crop_cfg.get("classes"):
        raise ValueError(f"Crop '{crop_name}' is not configured.")

    classes: List[str] = crop_cfg["classes"]
    data_dir: Path = crop_cfg["data_dir"]

    if not data_dir.exists():
        raise FileNotFoundError(
            f"Data directory not found: {data_dir}\n"
            f"Run:  python -m ml.download_data --crop {crop_name}\n"
            f"to download real labeled images before training."
        )

    logger.info(f"Loading {crop_name} dataset from {data_dir}")
    all_paths, all_labels = _collect_images(data_dir, classes)

    if len(all_paths) == 0:
        raise FileNotFoundError(
            f"No images found in {data_dir}.\n"
            f"Run:  python -m ml.download_data --crop {crop_name}\n"
            f"to populate this directory with real labeled images."
        )

    # Warn if any class is suspiciously small (likely still has synthetic fakes)
    counts = Counter(all_labels)
    for i, cls in enumerate(classes):
        n = counts.get(i, 0)
        if n < 30:
            logger.warning(
                f"[{crop_name}] Class '{cls}' has only {n} images. "
                f"Models trained on fewer than ~30 real images per class are unreliable. "
                f"Run python -m ml.download_data --crop {crop_name} to get more data."
            )

    tr_p, tr_l, va_p, va_l, te_p, te_l = _stratified_split(
        all_paths, all_labels, val_frac=val_split, test_frac=test_split
    )

    logger.info(
        f"[{crop_name}] Split → train={len(tr_p)}, val={len(va_p)}, test={len(te_p)}"
    )

    train_tf, val_tf = get_transforms()

    train_ds = CropImageDataset(tr_p, tr_l, transform=train_tf)
    val_ds = CropImageDataset(va_p, va_l, transform=val_tf)
    test_ds = CropImageDataset(te_p, te_l, transform=val_tf)

    return train_ds, val_ds, test_ds


def get_class_weights_for_crop(crop_name: str) -> torch.Tensor:
    """
    Returns class weights tensor for CrossEntropyLoss based on the training split.
    Used by train.py to handle class imbalance in real datasets.
    """
    crop_cfg = CROP_CONFIGS[crop_name]
    classes: List[str] = crop_cfg["classes"]
    data_dir: Path = crop_cfg["data_dir"]
    all_paths, all_labels = _collect_images(data_dir, classes)
    return compute_class_weights(all_labels, len(classes))
