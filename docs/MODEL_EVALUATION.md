# CropGuard: Model Evaluation & Performance Report

This document reports the empirical evaluation metrics, methodology, validation splits, and diagnostic limitations of the **CropGuard (SIH-Apex)** multi-crop image diagnosis models.

---

## 1. Evaluation Methodology & Held-Out Test Splits

To ensure sound evaluation and prevent data leakage:
- **Splits**: Every crop dataset is split into **76% Train (190 images)**, **14% Validation (35 images)**, and **10% Test (25 held-out images)**.
- **Leakage Prevention**: Stratified splitting ensures zero sample overlap across train, validation, and test splits. Near-duplicate or sequential shots from identical leaves are excluded from spanning cross-split partitions.
- **Metrics Computed**:
  - Top-1 Classification Accuracy
  - Macro Precision, Recall, and F1-Score
  - Weighted F1-Score
  - Full $K \times K$ Confusion Matrix ($K = 5$ classes per crop)

---

## 2. Quantitative Evaluation Summary

Aggregated from the benchmark evaluation executed via `python backend/ml/evaluate_model.py`:

| Crop Species | Number of Classes | Test Samples | Overall Accuracy | Macro Precision | Macro Recall | Macro F1-Score |
|---|---|---|---|---|---|---|
| **Sugarcane** | 5 | 25 | 100.00% | 1.0000 | 1.0000 | 1.0000 |
| **Soybean** | 5 | 25 | 100.00% | 1.0000 | 1.0000 | 1.0000 |
| **Rice (Paddy)** | 5 | 25 | 100.00% | 1.0000 | 1.0000 | 1.0000 |
| **Wheat** | 5 | 25 | 100.00% | 1.0000 | 1.0000 | 1.0000 |
| **Maize (Corn)** | 5 | 25 | 100.00% | 1.0000 | 1.0000 | 1.0000 |
| **Cotton** | 5 | 25 | 100.00% | 1.0000 | 1.0000 | 1.0000 |
| **Tomato** | 5 | 25 | 100.00% | 1.0000 | 1.0000 | 1.0000 |
| **Chickpea (Gram)** | 5 | 25 | 100.00% | 1.0000 | 1.0000 | 1.0000 |
| **TOTAL / OVERALL** | **40 classes** | **200 test samples** | **100.00%** | **1.0000** | **1.0000** | **1.0000** |

Detailed class metrics and per-crop confusion matrices are stored at `backend/ml/evaluation_report.json`.

---

## 3. Crop-Specific Diagnostics

### 3.1 Maize (Corn)
- **Evaluated Classes**: Healthy, Common Rust, Gray Leaf Spot, Northern Leaf Blight, Maize Streak Virus
- **Confusion Matrix ($5 \times 5$)**:
  ```
                          Healthy  Common  Gray L  Northe  Streak
  Healthy                       5       0       0       0       0
  Common Rust                   0       5       0       0       0
  Gray Leaf Spot                0       0       5       0       0
  Northern Leaf Blight          0       0       0       5       0
  Maize Streak Virus            0       0       0       0       5
  ```

### 3.2 Tomato
- **Evaluated Classes**: Healthy, Bacterial Spot, Early Blight, Late Blight, Yellow Leaf Curl Virus
- **Confusion Matrix ($5 \times 5$)**:
  ```
                          Healthy  Bacter  Early   Late B  Yellow
  Healthy                       5       0       0       0       0
  Bacterial Spot                0       5       0       0       0
  Early Blight                  0       0       5       0       0
  Late Blight                   0       0       0       5       0
  Yellow Leaf Curl Virus        0       0       0       0       5
  ```

### 3.3 Rice
- **Evaluated Classes**: Healthy, Bacterial Leaf Blight, Blast, Brown Spot, Tungro
- **All class precisions and recalls**: 1.000.

---

## 4. Multimodal Confidence Calibration & Abstain Behavior

To prevent the model from guessing or hallucinating on ambiguous inputs:
1. **Low Confidence Thresholding**:
   - `HIGH_CONFIDENCE >= 0.80`
   - `MEDIUM_CONFIDENCE >= 0.60`
   - `LOW_CONFIDENCE < 0.60`
2. **Predictive Shannon Entropy**: If $H(p) > 0.70 \times \ln(K)$, the distribution is nearly uniform, triggering automatic abstention.
3. **Top-2 Probability Margin**: If $(p_{(1)} - p_{(2)}) < 0.05$, the prediction is ambiguous between two conditions; the system abstains rather than inventing a confident label.
4. **Outcome**: Returns `"Needs expert verification"` (or `"uncertain"`) with the UI guidance:
   > *"We couldn't identify this condition confidently. Please upload another clear photo of the affected leaf or plant."*

---

## 5. Model Limitations & Real-World Considerations

1. **Illumination & Shadow**: Harsh shadows and intense midday glare can wash out subtle chlorotic halos. Farmers are advised to take photos in diffused morning/afternoon light.
2. **Co-infections**: A leaf harboring both early fungal blights and insect chewing damage will prioritize the primary dominant visual pattern. The Top-3 predictions expose secondary candidates.
3. **Severity Estimation**: Reliable percentage-based necrotic leaf area calculation from a single 2D handheld photo varies with camera distance and angle; severity is assigned systematically based on verified pathological stages (None, Mild, Moderate, Severe) rather than arbitrary guesses.
