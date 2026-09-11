# Sugarcane Leaf Disease Detection (Phase 3B-1)

This directory contains the machine learning pipeline for **Phase 3B-1: Sugarcane Leaf Disease Detection**.

It uses **MobileNetV3-Large** with PyTorch transfer learning trained on the **Maharashtra Sugarcane Leaf Disease Dataset** classes:
1. `Healthy`
2. `Red Rot`
3. `Rust`
4. `Mosaic`
5. `Yellow Disease`

---

## Directory Structure

```
backend/ml/
├── config.py           # Classes, threshold (0.60), image size, severity & status maps
├── model.py            # MobileNetV3-Large transfer learning model architecture & checkpoint loading
├── dataset.py          # PyTorch dataset transforms, splits, and sample dataset generator
├── train.py            # Training pipeline with loss, optimizer, validation loop & checkpoint save
├── evaluate.py         # Metrics calculator (Accuracy, Precision, Recall, F1-Score)
├── inference.py        # Single image PyTorch inference engine with confidence thresholding
├── saved_models/       # Directory containing saved .pth PyTorch weights
│   └── sugarcane_mobilenetv3.pth
└── README.md           # Documentation
```

---

## Technical Specifications

- **Model Backbone**: ImageNet-pretrained `torchvision.models.mobilenet_v3_large`.
- **Classification Head**: Replaced 1000-unit linear layer with 5 output units (`Healthy`, `Red Rot`, `Rust`, `Mosaic`, `Yellow Disease`).
- **Confidence Threshold**: `SUGARCANE_CONFIDENCE_THRESHOLD = 0.60`.
  - Predictions with softmax confidence below `0.60` return:
    - `disease`: `"Needs expert verification"`
    - `status`: `"Needs expert verification"`

---

## Usage Instructions

### 1. Local Training
To train or re-train the model locally and save weights to `backend/ml/saved_models/sugarcane_mobilenetv3.pth`:
```bash
python -m ml.train
```

### 2. Evaluation
To compute accuracy, precision, recall, and F1-score on test split:
```bash
python -m ml.evaluate
```

### 3. Inference Service
In Python:
```python
from ml.inference import predict_sugarcane_disease

with open("path/to/sugarcane_leaf.jpg", "rb") as f:
    result = predict_sugarcane_disease(f.read())

print(result)
# Output:
# {
#   "crop": "Sugarcane",
#   "disease": "Red Rot",
#   "confidence": 0.9421,
#   "severity": "Severe",
#   "status": "Diseased"
# }
```

---

## Response Schema Integration

Integrated directly into `POST /api/scan` response under `disease_detection`:
```json
{
  "status": "valid",
  "message": "Crop identified as Sugarcane with 95.2% confidence.",
  "validation": { "passed": true, "errors": [], "warnings": [] },
  "image_quality": { ... },
  "crop_analysis": { ... },
  "disease_detection": {
    "crop": "Sugarcane",
    "disease": "Red Rot",
    "confidence": 0.9421,
    "severity": "Severe",
    "status": "Diseased"
  },
  "severity": "Severe",
  "status": "Diseased"
}
```
