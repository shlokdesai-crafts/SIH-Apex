"""
backend/ml/dataset.py
──────────────────────
Multi-crop dataset loader, transformations, splitting, and sample dataset generator
supporting Sugarcane and Soybean (MH-SoyaHealthVision dataset).
"""

from pathlib import Path
from typing import Tuple, List, Dict, Optional

from PIL import Image, ImageDraw, ImageFilter
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

from ml.config import CROP_CONFIGS, IMAGE_SIZE, IMAGENET_MEAN, IMAGENET_STD, BASE_DIR


def get_transforms() -> Tuple[transforms.Compose, transforms.Compose]:
    """Returns (train_transforms, val_transforms)."""
    train_transforms = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    val_transforms = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    return train_transforms, val_transforms


class CropImageDataset(Dataset):
    """PyTorch Dataset for multi-crop leaf disease images."""

    def __init__(self, image_paths: List[Path], labels: List[int], transform: Optional[transforms.Compose] = None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        img_path = self.image_paths[idx]
        image = Image.open(img_path).convert("RGB")
        label = self.labels[idx]

        if self.transform:
            image = self.transform(image)

        return image, label


# Backwards compatibility alias
SugarcaneImageDataset = CropImageDataset


def create_sample_dataset(crop_name: str = "Sugarcane", output_dir: Optional[Path] = None, samples_per_class: int = 25) -> Path:
    """
    Creates a sample leaf disease dataset on disk with distinct visual characteristics
    for each class of the specified crop (Sugarcane or Soybean).
    """
    crop_cfg = CROP_CONFIGS.get(crop_name)
    if not crop_cfg or not crop_cfg.get("classes"):
        raise ValueError(f"Unsupported crop for dataset generation: {crop_name}")

    classes = crop_cfg["classes"]
    if output_dir is None:
        output_dir = crop_cfg["data_dir"]

    output_dir.mkdir(parents=True, exist_ok=True)

    # Visual styles for Sugarcane & Soybean classes
    crop_styles = {
        "Sugarcane": {
            "Healthy": {"bg": (34, 139, 34), "pattern": "healthy"},
            "Red Rot": {"bg": (46, 117, 46), "spots": (178, 34, 34), "pattern": "streaks"},
            "Rust": {"bg": (60, 120, 45), "spots": (205, 87, 0), "pattern": "pustules"},
            "Mosaic": {"bg": (144, 238, 144), "spots": (34, 100, 34), "pattern": "mottling"},
            "Yellow Disease": {"bg": (218, 165, 32), "spots": (139, 69, 19), "pattern": "yellowing"},
        },
        "Soybean": {
            "Healthy": {"bg": (40, 140, 40), "pattern": "healthy"},
            "Cercospora Leaf Blight": {"bg": (128, 0, 128), "spots": (75, 0, 130), "pattern": "blight"},
            "Frogeye Leaf Spot": {"bg": (65, 130, 65), "spots": (139, 69, 19), "pattern": "frogeye"},
            "Rust": {"bg": (70, 120, 50), "spots": (184, 115, 51), "pattern": "pustules"},
            "Yellow Mosaic": {"bg": (220, 200, 50), "spots": (30, 120, 30), "pattern": "mosaic"},
        },
        "Rice": {
            "Healthy": {"bg": (34, 150, 34), "pattern": "healthy"},
            "Bacterial Leaf Blight": {"bg": (60, 140, 50), "spots": (230, 230, 150), "pattern": "blight"},
            "Blast": {"bg": (50, 130, 50), "spots": (139, 69, 19), "pattern": "spindle"},
            "Brown Spot": {"bg": (65, 135, 60), "spots": (100, 50, 20), "pattern": "pustules"},
            "Tungro": {"bg": (230, 180, 40), "spots": (160, 80, 20), "pattern": "yellowing"},
        },
        "Cotton": {
            "Healthy": {"bg": (30, 130, 30), "pattern": "healthy"},
            "Bacterial Blight": {"bg": (50, 110, 50), "spots": (30, 30, 30), "pattern": "angular"},
            "Curl Virus": {"bg": (180, 200, 40), "spots": (100, 140, 20), "pattern": "yellowing"},
            "Fusarium Wilt": {"bg": (160, 120, 50), "spots": (80, 40, 10), "pattern": "blight"},
            "Target Spot": {"bg": (60, 125, 60), "spots": (120, 60, 20), "pattern": "frogeye"},
        },
        "Wheat": {
            "Healthy": {"bg": (35, 145, 35), "pattern": "healthy"},
            "Brown Rust": {"bg": (55, 125, 50), "spots": (180, 80, 30), "pattern": "pustules"},
            "Yellow Rust": {"bg": (200, 190, 40), "spots": (210, 140, 20), "pattern": "streaks"},
            "Powdery Mildew": {"bg": (70, 140, 70), "spots": (220, 220, 220), "pattern": "mottling"},
            "Septoria": {"bg": (60, 120, 55), "spots": (100, 50, 30), "pattern": "blight"},
        },
        "Maize": {
            "Healthy": {"bg": (40, 150, 40), "pattern": "healthy"},
            "Common Rust": {"bg": (60, 130, 50), "spots": (190, 90, 35), "pattern": "pustules"},
            "Gray Leaf Spot": {"bg": (75, 135, 75), "spots": (120, 120, 120), "pattern": "angular"},
            "Northern Leaf Blight": {"bg": (65, 125, 60), "spots": (110, 60, 25), "pattern": "spindle"},
            "Maize Streak Virus": {"bg": (210, 195, 45), "spots": (50, 130, 40), "pattern": "streaks"},
        },
        "Tomato": {
            "Healthy": {"bg": (35, 140, 35), "pattern": "healthy"},
            "Bacterial Spot": {"bg": (45, 115, 45), "spots": (20, 20, 20), "pattern": "angular"},
            "Early Blight": {"bg": (60, 130, 50), "spots": (120, 65, 20), "pattern": "frogeye"},
            "Late Blight": {"bg": (70, 100, 60), "spots": (80, 40, 20), "pattern": "blight"},
            "Yellow Leaf Curl Virus": {"bg": (215, 200, 40), "spots": (60, 130, 30), "pattern": "mosaic"},
        },
        "Chickpea": {
            "Healthy": {"bg": (40, 145, 40), "pattern": "healthy"},
            "Ascochyta Blight": {"bg": (60, 120, 50), "spots": (130, 70, 25), "pattern": "frogeye"},
            "Fusarium Wilt": {"bg": (170, 150, 45), "spots": (80, 40, 15), "pattern": "blight"},
            "Dry Root Rot": {"bg": (120, 90, 40), "spots": (30, 20, 10), "pattern": "angular"},
            "Stunt Virus": {"bg": (210, 190, 40), "spots": (40, 120, 30), "pattern": "yellowing"},
        }
    }

    styles = crop_styles.get(crop_name, {})

    for cls_name in classes:
        cls_dir = output_dir / cls_name
        cls_dir.mkdir(parents=True, exist_ok=True)
        style = styles.get(cls_name, {"bg": (50, 130, 50)})

        for i in range(samples_per_class):
            img_file = cls_dir / f"{cls_name.lower().replace(' ', '_')}_{i:03d}.jpg"
            if img_file.exists():
                continue

            img = Image.new("RGB", (300, 300), color=style["bg"])
            draw = ImageDraw.Draw(img)

            # Draw leaf veins
            draw.line([(150, 0), (150, 300)], fill=(20, 80, 20), width=4)

            pattern = style.get("pattern")
            if pattern == "streaks":
                for s in range(5):
                    offset = (i * 7 + s * 30) % 200 + 30
                    draw.rectangle([140, offset, 160, offset + 40], fill=style["spots"])
            elif pattern == "angular":
                for a in range(8):
                    x = (i * 13 + a * 35) % 220 + 30
                    y = (i * 17 + a * 31) % 220 + 30
                    draw.polygon([(x, y), (x + 20, y + 5), (x + 15, y + 25), (x - 5, y + 15)], fill=style["spots"])
            elif pattern == "pustules":
                for p in range(20):
                    x = (i * 13 + p * 23) % 260 + 20
                    y = (i * 17 + p * 37) % 260 + 20
                    draw.ellipse([x, y, x + 10, y + 10], fill=style["spots"])
            elif pattern == "spindle":
                for sp in range(10):
                    x = (i * 15 + sp * 27) % 240 + 20
                    y = (i * 19 + sp * 31) % 240 + 20
                    draw.polygon([(x, y + 10), (x + 15, y), (x + 30, y + 10), (x + 15, y + 20)], fill=style["spots"])
            elif pattern == "mottling" or pattern == "mosaic":
                for m in range(12):
                    x = (i * 19 + m * 31) % 240 + 20
                    y = (i * 11 + m * 41) % 240 + 20
                    draw.polygon([(x, y), (x + 30, y + 10), (x + 20, y + 30)], fill=style["spots"])
            elif pattern == "frogeye":
                for f in range(15):
                    x = (i * 11 + f * 23) % 250 + 25
                    y = (i * 13 + f * 29) % 250 + 25
                    draw.ellipse([x, y, x + 14, y + 14], fill=(139, 69, 19))
                    draw.ellipse([x + 3, y + 3, x + 11, y + 11], fill=(210, 180, 140))
            elif pattern == "blight":
                for b in range(6):
                    x = (i * 17 + b * 40) % 200 + 30
                    y = (i * 19 + b * 35) % 200 + 30
                    draw.ellipse([x, y, x + 50, y + 50], fill=style["spots"])
            elif pattern == "yellowing":
                draw.line([(145, 0), (155, 300)], fill=style["spots"], width=6)

            img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
            img.save(img_file, "JPEG")

    return output_dir


def load_dataset_splits(crop_name: str = "Sugarcane", val_split: float = 0.2, test_split: float = 0.1) -> Tuple[CropImageDataset, CropImageDataset, CropImageDataset]:
    """Loads image paths, splits into train/val/test, and returns CropImageDataset objects."""
    crop_cfg = CROP_CONFIGS.get(crop_name)
    if not crop_cfg or not crop_cfg.get("classes"):
        raise ValueError(f"Crop {crop_name} is not configured.")

    classes = crop_cfg["classes"]
    data_dir = crop_cfg["data_dir"]

    if not data_dir.exists() or not any(data_dir.iterdir()):
        create_sample_dataset(crop_name=crop_name, output_dir=data_dir)

    all_paths: List[Path] = []
    all_labels: List[int] = []

    class_to_idx = {cls_name: i for i, cls_name in enumerate(classes)}

    for cls_name in classes:
        cls_dir = data_dir / cls_name
        if not cls_dir.exists():
            continue
        idx = class_to_idx[cls_name]
        for ext in ("*.jpg", "*.jpeg", "*.png"):
            for p in cls_dir.glob(ext):
                all_paths.append(p)
                all_labels.append(idx)

    total = len(all_paths)
    if total == 0:
        create_sample_dataset(crop_name=crop_name, output_dir=data_dir)
        return load_dataset_splits(crop_name=crop_name, val_split=val_split, test_split=test_split)

    g = torch.Generator().manual_seed(42)
    indices = torch.randperm(total, generator=g).tolist()

    val_count = int(total * val_split)
    test_count = int(total * test_split)
    train_count = total - val_count - test_count

    train_indices = indices[:train_count]
    val_indices = indices[train_count:train_count + val_count]
    test_indices = indices[train_count + val_count:]

    train_transforms, val_transforms = get_transforms()

    train_ds = CropImageDataset(
        [all_paths[i] for i in train_indices],
        [all_labels[i] for i in train_indices],
        transform=train_transforms
    )
    val_ds = CropImageDataset(
        [all_paths[i] for i in val_indices],
        [all_labels[i] for i in val_indices],
        transform=val_transforms
    )
    test_ds = CropImageDataset(
        [all_paths[i] for i in test_indices],
        [all_labels[i] for i in test_indices],
        transform=val_transforms
    )

    return train_ds, val_ds, test_ds
