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


import hashlib

def compute_md5(p: Path) -> str:
    hasher = hashlib.md5()
    with open(p, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


# ── Public API ────────────────────────────────────────────────────────────────

def _collect_images(data_dir: Path, classes: List[str]) -> Tuple[List[Path], List[int]]:
    """
    Scans data_dir/<ClassName>/ folders, performs rigorous validation and deduplication,
    and returns (paths, labels).
    Fails loudly if any mock/synthetic procedural images or zero-byte files are found.
    """
    all_paths: List[Path] = []
    all_labels: List[int] = []
    seen_hashes: Dict[str, Path] = {}
    class_to_idx = {cls: i for i, cls in enumerate(classes)}

    for cls_name in classes:
        cls_dir = data_dir / cls_name
        if not cls_dir.exists():
            raise FileNotFoundError(f"Missing required class directory: {cls_dir}")

        idx = class_to_idx[cls_name]
        n_before = len(all_paths)
        found_paths = set()
        for ext in ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG", "*.webp"):
            for p in cls_dir.glob(ext):
                found_paths.add(p.resolve())

        for p in sorted(found_paths):
            size = p.stat().st_size
            if size == 0:
                raise ValueError(f"Corrupt/empty image found: {p}")

            # Check for synthetic naming + small file size (< 10 KB)
            name_parts = p.stem.split("_")
            if len(name_parts) >= 2 and name_parts[-1].isdigit() and len(name_parts[-1]) == 3 and size < 10 * 1024:
                raise ValueError(
                    f"Mock/synthetic procedural image detected at {p} (size {size} bytes). "
                    f"CropGuard ML pipeline strictly forbids synthetic/mock images in training."
                )

            # Deduplication
            h = compute_md5(p)
            if h in seen_hashes:
                logger.warning(f"Skipping duplicate image {p.name} (duplicate of {seen_hashes[h].name})")
                continue
            seen_hashes[h] = p

            all_paths.append(p)
            all_labels.append(idx)

        n_found = len(all_paths) - n_before
        if n_found == 0:
            raise ValueError(f"Class '{cls_name}' has 0 valid images in {cls_dir}.")
        logger.info(f"  {cls_name}: {n_found} verified real images")

    return all_paths, all_labels


def load_dataset_splits(
    crop_name: str = "Sugarcane",
    val_split: float = 0.15,
    test_split: float = 0.10,
) -> Tuple[CropImageDataset, CropImageDataset, CropImageDataset]:
    """
    Loads real labeled images from disk and returns stratified train/val/test splits.
    Guarantees:
      - Only verified real-world agricultural datasets can be loaded
      - No synthetic/mock images are present
      - No duplicate images across train/val/test
      - Deterministic evaluation transforms on val/test, data augmentation only on train

    Raises:
        ValueError: If crop is unverified or data is mock/synthetic.
        FileNotFoundError: If the data directory is missing or empty.
    """
    crop_cfg = CROP_CONFIGS.get(crop_name)
    if not crop_cfg or not crop_cfg.get("classes"):
        raise ValueError(f"Crop '{crop_name}' is not configured.")

    if not crop_cfg.get("verified_real", False):
        raise ValueError(
            f"Crop '{crop_name}' does not have a verified real agricultural dataset. "
            f"Training on mock/unverified data is strictly disabled.\n"
            f"Status: {crop_cfg.get('dataset_source', 'Awaiting verified data')}."
        )

    classes: List[str] = crop_cfg["classes"]
    data_dir: Path = crop_cfg["data_dir"]

    if not data_dir.exists():
        raise FileNotFoundError(
            f"Data directory not found: {data_dir}\n"
            f"Ensure genuine real-world agricultural dataset is populated."
        )

    logger.info(f"Loading verified {crop_name} dataset from {data_dir} (Source: {crop_cfg.get('dataset_source')})")
    all_paths, all_labels = _collect_images(data_dir, classes)

    if len(all_paths) == 0:
        raise FileNotFoundError(f"No images found in {data_dir}.")

    tr_p, tr_l, va_p, va_l, te_p, te_l = _stratified_split(
        all_paths, all_labels, val_frac=val_split, test_frac=test_split
    )

    # Sanity check: Ensure no duplicate paths across splits
    train_set = set(tr_p)
    val_set = set(va_p)
    test_set = set(te_p)
    assert len(train_set.intersection(val_set)) == 0, "Data leakage: train and val overlap!"
    assert len(train_set.intersection(test_set)) == 0, "Data leakage: train and test overlap!"
    assert len(val_set.intersection(test_set)) == 0, "Data leakage: val and test overlap!"

    logger.info(
        f"[{crop_name}] Stratified split -> train={len(tr_p)}, val={len(va_p)}, test={len(te_p)}"
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
