"""
backend/ml/config.py
────────────────────
Multi-Crop Machine Learning Configuration Registry.
Provides dedicated model settings, dataset directories, class definitions,
and severity/status mappings for Sugarcane, Soybean, and future crops.
"""

from pathlib import Path
from typing import Dict, Any, List

# Base directory for ML artifacts
BASE_DIR = Path(__file__).resolve().parent
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Image preprocessing defaults
IMAGE_SIZE = (224, 224)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# ── Multi-Crop Registry ───────────────────────────────────────────────────────
CROP_CONFIGS: Dict[str, Dict[str, Any]] = {
    "Sugarcane": {
        "classes": [
            "Healthy",
            "Red Rot",
            "Rust",
            "Mosaic",
            "Yellow Disease"
        ],
        "model_path": SAVED_MODELS_DIR / "sugarcane_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "sugarcane",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Red Rot": "Severe",
            "Rust": "Moderate",
            "Mosaic": "Moderate",
            "Yellow Disease": "Mild",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Red Rot": "Diseased",
            "Rust": "Diseased",
            "Mosaic": "Diseased",
            "Yellow Disease": "Diseased",
        },
    },
    "Soybean": {
        "classes": [
            "Healthy",
            "Cercospora Leaf Blight",
            "Frogeye Leaf Spot",
            "Rust",
            "Yellow Mosaic"
        ],
        "model_path": SAVED_MODELS_DIR / "soybean_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "soybean",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Cercospora Leaf Blight": "Severe",
            "Frogeye Leaf Spot": "Moderate",
            "Rust": "Severe",
            "Yellow Mosaic": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Cercospora Leaf Blight": "Diseased",
            "Frogeye Leaf Spot": "Diseased",
            "Rust": "Diseased",
            "Yellow Mosaic": "Diseased",
        },
    },
    "Rice": {
        "classes": [
            "Healthy",
            "Bacterial Leaf Blight",
            "Blast",
            "Brown Spot",
            "Tungro"
        ],
        "model_path": SAVED_MODELS_DIR / "rice_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "rice",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Bacterial Leaf Blight": "Severe",
            "Blast": "Severe",
            "Brown Spot": "Moderate",
            "Tungro": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Bacterial Leaf Blight": "Diseased",
            "Blast": "Diseased",
            "Brown Spot": "Diseased",
            "Tungro": "Diseased",
        },
    },
    "Wheat": {
        "classes": [
            "Healthy",
            "Brown Rust",
            "Yellow Rust",
            "Powdery Mildew",
            "Septoria"
        ],
        "model_path": SAVED_MODELS_DIR / "wheat_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "wheat",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Brown Rust": "Severe",
            "Yellow Rust": "Severe",
            "Powdery Mildew": "Moderate",
            "Septoria": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Brown Rust": "Diseased",
            "Yellow Rust": "Diseased",
            "Powdery Mildew": "Diseased",
            "Septoria": "Diseased",
        },
    },
    "Maize": {
        "classes": [
            "Healthy",
            "Common Rust",
            "Gray Leaf Spot",
            "Northern Leaf Blight",
            "Maize Streak Virus"
        ],
        "model_path": SAVED_MODELS_DIR / "maize_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "maize",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Common Rust": "Moderate",
            "Gray Leaf Spot": "Severe",
            "Northern Leaf Blight": "Severe",
            "Maize Streak Virus": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Common Rust": "Diseased",
            "Gray Leaf Spot": "Diseased",
            "Northern Leaf Blight": "Diseased",
            "Maize Streak Virus": "Diseased",
        },
    },
    "Cotton": {
        "classes": [
            "Healthy",
            "Bacterial Blight",
            "Curl Virus",
            "Fusarium Wilt",
            "Target Spot"
        ],
        "model_path": SAVED_MODELS_DIR / "cotton_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "cotton",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Bacterial Blight": "Severe",
            "Curl Virus": "Severe",
            "Fusarium Wilt": "Severe",
            "Target Spot": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Bacterial Blight": "Diseased",
            "Curl Virus": "Diseased",
            "Fusarium Wilt": "Diseased",
            "Target Spot": "Diseased",
        },
    },
    "Tomato": {
        "classes": [
            "Healthy",
            "Bacterial Spot",
            "Early Blight",
            "Late Blight",
            "Yellow Leaf Curl Virus"
        ],
        "model_path": SAVED_MODELS_DIR / "tomato_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "tomato",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Bacterial Spot": "Severe",
            "Early Blight": "Moderate",
            "Late Blight": "Severe",
            "Yellow Leaf Curl Virus": "Severe",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Bacterial Spot": "Diseased",
            "Early Blight": "Diseased",
            "Late Blight": "Diseased",
            "Yellow Leaf Curl Virus": "Diseased",
        },
    },
    "Chickpea": {
        "classes": [
            "Healthy",
            "Ascochyta Blight",
            "Fusarium Wilt",
            "Dry Root Rot",
            "Stunt Virus"
        ],
        "model_path": SAVED_MODELS_DIR / "chickpea_mobilenetv3.pth",
        "data_dir": BASE_DIR / "data" / "chickpea",
        "confidence_threshold": 0.60,
        "severity_map": {
            "Healthy": "None",
            "Ascochyta Blight": "Severe",
            "Fusarium Wilt": "Severe",
            "Dry Root Rot": "Severe",
            "Stunt Virus": "Moderate",
        },
        "status_map": {
            "Healthy": "Healthy",
            "Ascochyta Blight": "Diseased",
            "Fusarium Wilt": "Diseased",
            "Dry Root Rot": "Diseased",
            "Stunt Virus": "Diseased",
        },
    },
}

# ── Backwards-Compatibility Exports for Sugarcane ────────────────────────────
SUGARCANE_CLASSES = CROP_CONFIGS["Sugarcane"]["classes"]
NUM_CLASSES = len(SUGARCANE_CLASSES)
SUGARCANE_CONFIDENCE_THRESHOLD = CROP_CONFIGS["Sugarcane"]["confidence_threshold"]
MODEL_PATH = CROP_CONFIGS["Sugarcane"]["model_path"]
DATASET_DIR = CROP_CONFIGS["Sugarcane"]["data_dir"]
SEVERITY_MAP = CROP_CONFIGS["Sugarcane"]["severity_map"]
STATUS_MAP = CROP_CONFIGS["Sugarcane"]["status_map"]
