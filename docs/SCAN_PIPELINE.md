# CropGuard: Scan Crop End-to-End Pipeline & Architecture

This document describes the end-to-end technical pipeline powering the **CropGuard (SIH-Apex)** Scan Crop engine, from image acquisition through computer vision inference, persistent SQLite storage, and synchronized My Farm dashboard updates.

---

## 1. High-Level Architecture Diagram

```
Farmer Image (Dropzone / File / Camera)
                  │
                  ▼
         [Frontend] ScanCrop.tsx
                  │
                  ▼ POST /api/scan (Multipart FormData)
       [Backend Gateway] FastAPI main.py (Port 8000)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 PHASED DIAGNOSTIC PIPELINE                  │
│                                                             │
│  Phase 1: File & Quality Gate                               │
│  ├── services/validation.py (Format, <=10MB, >=100x100px)   │
│  └── services/image_quality.py (Brightness, Laplacian Blur) │
│                                                             │
│  Phase 2: Plant/Crop Relevance Verification                 │
│  └── services/crop_relevance.py (MobileNetV2 ImageNet-1K)   │
│      ├── Rejects: Vehicles, Buildings, People, Animals      │
│      └── Accepts: Agricultural crops, leaves, fruits        │
│                                                             │
│  Phase 3A: Real Crop Species Identification                 │
│  └── services/crop_identification.py (CLIP ViT + Prototypes)│
│      ├── Target crops: Rice, Wheat, Maize, Cotton, etc.     │
│      └── Rejects unsupported flora & low similarity         │
│                                                             │
│  Phase 3B: Fine-Grained Condition & Disease Detection       │
│  └── ml/inference.py (Prompt Ensembles & MobileNetV3)       │
│      ├── Top-3 probability distribution                     │
│      ├── Shannon entropy uncertainty check                  │
│      ├── Top-2 margin verification                          │
│      └── Knowledge Base linking (advisory.py)               │
│                                                             │
│  Phase 4: Persistence & Storage                             │
│  ├── Safe file save to uploads/scan_history/{uuid}.jpg      │
│  ├── Insert into scan_history table (submissions.db)        │
│  └── Insert into submissions table (Gov portal sync)        │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼
       Structured JSON Response (ScanResponse)
                  │
                  ▼
         [Frontend] ScanCrop.tsx
                  │
                  ├── Renders full diagnosis, symptoms, and actions
                  ├── Updates Past Scans history list
                  │
                  ▼ useFarm() -> recordScan()
       [Shared State] FarmContext.tsx & farmService.ts
                  │
                  ├── Canonical crop deduplication (Maize, etc.)
                  ├── Updates existing crop card in-place
                  └── Recalculates overall farm health score
                  │
                  ▼
          My Farm Dashboard Refreshes!
```

---

## 2. Pipeline Phase Details

### Phase 1: Upload Validation & Image Quality Gate
- **Format**: JPG, JPEG, PNG, WEBP.
- **Integrity**: Verified via Pillow `img.verify()`.
- **Dimensions**: Minimum $100 \times 100$ pixels; maximum $8000 \times 8000$ pixels.
- **Brightness**: Grayscale channel mean between $40.0$ and $230.0$.
- **Sharpness / Blur**: Laplacian kernel filter variance $\ge 100.0$. Obvious motion blur or out-of-focus captures are rejected early.

### Phase 2: Plant / Crop Relevance Filter
- Employs a pre-trained PyTorch `MobileNetV2` classifier over ImageNet-1K.
- Checks aggregated probability across botanical and agricultural taxonomic sets.
- If an image predominantly depicts non-plant entities (e.g., automobile, person, indoor furniture), it returns:
  ```json
  {
    "status": "invalid_image",
    "message": "This image does not appear to contain a crop or plant. Please upload a clear plant image."
  }
  ```

### Phase 3A: Real Crop Identification
- Employs HuggingFace Vision Transformer (`openai/clip-vit-base-patch32`) combined with multi-prompt text feature ensemble averaging and visual prototype feature bank.
- Identifies the crop species across the 8 supported target crops: **Rice, Wheat, Maize (Corn), Cotton, Soybean, Sugarcane, Tomato, Chickpea**.
- Validates against open-set null prompts; returns `unsupported_crop` if the plant is unsupported.

### Phase 3B: Condition Diagnosis & Confidence Calibration
- Computes Top-3 predictions across condition classes.
- Validates against predictive Shannon entropy $H(p) \le 0.70 \ln(K)$ and top-2 margin $\Delta p \ge 0.05$.
- Enriches diagnosis with authoritative ICAR cultural management steps from `backend/data/crop_disease_knowledge.json`.

### Phase 4: Database Persistence & File Security
- Stored locally in `backend/submissions.db` in table `scan_history`.
- Images are stored under `backend/uploads/scan_history/` with cryptographically sanitized UUID filenames.
- Static URL `/uploads/scan_history/...` is exposed by FastAPI and proxied via Vite.

---

## 3. Database Schema

```sql
CREATE TABLE IF NOT EXISTS scan_history (
    id                  TEXT PRIMARY KEY,
    farmer_id           TEXT NOT NULL DEFAULT 'default_farmer',
    crop_name           TEXT NOT NULL,
    predicted_condition TEXT NOT NULL,
    condition_type      TEXT NOT NULL DEFAULT 'disease',
    crop_confidence     REAL NOT NULL,
    disease_confidence  REAL NOT NULL,
    severity            TEXT NOT NULL DEFAULT 'Unknown',
    image_path          TEXT,
    diagnosis_summary   TEXT,
    symptoms_json       TEXT,
    actions_json        TEXT,
    prevention_json     TEXT,
    model_name          TEXT NOT NULL,
    model_version       TEXT NOT NULL,
    data_source         TEXT NOT NULL,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
);
```

---

## 4. API Specification

### `POST /api/scan`
- **Request**: Multipart form data with `file` (UploadFile), optional `farmer_name`, `farmer_id`, `location`, `latitude`, `longitude`.
- **Response**: `ScanResponse` JSON containing full diagnosis, confidence scores, symptoms, cultural actions, prevention, and image URL.

### `GET /api/scans/history`
- **Response**: Array of recent scans ordered newest first.

### `GET /api/scans/history/{id}`
- **Response**: Complete scan record with symptoms and cultural management actions.

### `DELETE /api/scans/history/{id}`
- **Response**: Deletion confirmation and associated image cleanup.

### `GET /api/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "modelLoaded": true,
    "modelVersion": "2.4.0",
    "database": "connected",
    "supportedCrops": ["Rice", "Wheat", "Maize (Corn)", "Cotton", "Soybean", "Sugarcane", "Tomato", "Chickpea"]
  }
  ```
