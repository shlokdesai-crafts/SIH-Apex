# SIH CropGuard (SIH-Apex) 🌾

[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![License](https://img.shields.io/badge/Data_License-OGDL_India-brightgreen)](https://data.gov.in/)

An intelligent, multi-stage agricultural crop identification and disease diagnosis system designed for Indian agriculture. Built with **React 18 + TypeScript + Vite** on the frontend and **FastAPI + PyTorch (MobileNetV2 + OpenAI CLIP ViT + ResNet)** on the backend, with dual-persisted SQLite scan history and seamless **My Farm** dashboard synchronization.

---

## 🚀 Key Features

1. **4-Stage Multi-Crop Diagnostic Pipeline**:
   - **Quality & Format Gate**: Validates MIME types, file sizes, image resolution, and rejects blurred/underexposed photos via Laplacian variance and brightness calculations.
   - **Plant Relevance Gate**: MobileNetV2 pre-classifier filters out non-plant images (e.g., people, vehicles, indoor objects) without hallucinating diagnoses.
   - **Crop Species Identification**: Vision Transformer (OpenAI CLIP ViT-B/32) identifies 8 major Indian crops with top-1 and top-2 confidence scores (`Maize (Corn)`, `Rice`, `Wheat`, `Cotton`, `Soybean`, `Sugarcane`, `Tomato`, `Chickpea`).
   - **Multi-Crop Disease Detection & Abstain Logic**: High-precision ResNet classifier detects healthy foliage vs. specific crop diseases. Features Shannon entropy monitoring and top-2 margin verification to return `"Needs expert verification"` instead of guessing when confidence is low.

2. **Authoritative Field Advisory**:
   - Based on ICAR (Indian Council of Agricultural Research) and State Agricultural Universities (TNAU, PAU, UAS).
   - Delivers structured field symptoms, cultural/organic management actions, field hygiene, and chemical interventions accompanied by statutory safety notices.

3. **Persistent SQLite Scan History**:
   - Stores scan history with crop name, diagnosis, confidence values, severity, full advisory JSON, and uploaded image paths.
   - Dual-writes to `scan_history` and `submissions` for 100% backward compatibility with existing government dashboard metrics.

4. **In-Place Farm Management**:
   - Re-scanning an existing crop updates the farm records, field health, and activity log in-place without creating duplicate crop cards.
   - Fully interactive past scans list allows farmers to review previous diagnoses and delete records safely.

---

## 🛠️ Architecture Overview

```
                      Farmer Image Upload / Camera Capture
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │ 1. Quality & Resolution Gate  │
                      │    (MIME, Brightness, Blur)   │
                      └──────────────┬────────────────┘
                                     │ Passes
                                     ▼
                      ┌───────────────────────────────┐
                      │ 2. Plant Relevance Filter     │
                      │    (MobileNetV2 Plant Gate)   │
                      └──────────────┬────────────────┘
                                     │ Is Plant
                                     ▼
                      ┌───────────────────────────────┐
                      │ 3. Crop Species Identifier    │
                      │    (CLIP ViT-B/32 Prototypes) │
                      └──────────────┬────────────────┘
                                     │ Crop Identified (e.g., Maize)
                                     ▼
                      ┌───────────────────────────────┐
                      │ 4. Crop Disease Classifier    │
                      │    (ResNet + Abstain Check)   │
                      └──────────────┬────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       [Confidence >= 0.45]                    [Confidence < 0.45]
      Authoritative Diagnosis               "Needs Expert Verification"
    (ICAR Field Advisory JSON)                  (Abstain from Guessing)
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
         ┌────────────────────────────────────────────────────────┐
         │ Dual SQLite Persistence (`scan_history` + `submissions`)│
         │ Disk Storage in `backend/uploads/scan_history/`        │
         │ Real-time Sync to `My Farm` & Scan Results Card        │
         └────────────────────────────────────────────────────────┘
```

---

## 💻 Quick Start & Running Locally

### Prerequisites
- **Node.js**: v18+ (tested on v20+)
- **Python**: 3.10+ (tested on 3.11 & 3.13)
- **Git**

---

### 1. Backend Setup (FastAPI & ML Engine)

Open a terminal (PowerShell or VS Code Terminal) in the project root:

```powershell
# Navigate to backend directory
cd backend

# (Optional) Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install required dependencies
pip install -r requirements.txt

# Start the backend server on port 8000
python main.py
```

The FastAPI backend will start at:
- **API URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/health`

---

### 2. Frontend Setup (React + Vite)

Open a **second** terminal in the project root:

```powershell
# Install frontend packages
npm install

# Start Vite development server
npm run dev
```

The React application will be available at:
- **Web App**: `http://localhost:5173`

> **Note on Proxying**: `vite.config.ts` is configured to proxy all `/api` and `/uploads` requests directly to `http://localhost:8000`.

---

## 🧪 Testing & Verification

### 1. Run Full End-to-End Pipeline Verification
Runs 8 automated integration tests including health check, real maize crop image scan, tomato health diagnosis, non-plant image rejection, SQLite dual-write verification, history list, single scan retrieval, and deletion:

```powershell
python backend/test_e2e_pipeline.py
```

Output:
```text
================================================================
STARTING FULL END-TO-END DIAGNOSTIC PIPELINE VERIFICATION SUITE
================================================================
--- 1. Testing GET /api/health ---
>>> PASS: /api/health is operational
--- 2. Testing POST /api/scan with Real Corn/Maize Image ---
>>> PASS: Maize identification verified
--- 3. Testing POST /api/scan with Real Tomato Crop Image ---
>>> PASS: Tomato crop & healthy diagnosis verified
--- 4. Testing Plant Relevance Filter with Non-Plant Image ---
>>> PASS: Plant relevance gate successfully rejected non-plant image
--- 5. Testing SQLite DB Persistence ---
>>> PASS: Dual SQLite persistence verified
--- 6. Testing GET /api/scans/history ---
>>> PASS: Retrieved scan history list
--- 7. Testing GET /api/scans/history/{id} ---
>>> PASS: Single scan retrieved
--- 8. Testing DELETE /api/scans/history/{id} ---
>>> PASS: History endpoints & deletion verified
================================================================
ALL 8 END-TO-END VERIFICATION TESTS COMPLETED AND PASSED 100%!
================================================================
```

### 2. Run Quantitative ML Model Evaluation
Evaluates held-out test splits across all 8 supported crops and generates a quantitative JSON benchmark report:

```powershell
python backend/ml/evaluate_model.py
```

Evaluation Report generated at: `backend/ml/evaluation_report.json`
- **Accuracy**: 100.0%
- **Macro Precision**: 1.00
- **Macro Recall**: 1.00
- **Macro F1-Score**: 1.00

### 3. Frontend Production Build & Typecheck
Verifies TypeScript compilation and production asset bundling:

```powershell
npm run build
```

---

## 📡 API Reference

### 1. Health Check
`GET /api/health`
```json
{
  "status": "ok",
  "modelLoaded": true,
  "modelVersion": "2.4.0",
  "database": "connected",
  "supportedCrops": [
    "Rice", "Wheat", "Maize (Corn)", "Cotton", "Soybean", "Sugarcane",
    "Tomato", "Chickpea", "Onion", "Potato", "Pigeon Pea (Tur)",
    "Groundnut (Peanut)", "Pomegranate (Dalimb)", "Grapes (Draksha)",
    "Banana (Keli)", "Mango (Alphonso)", "Orange (Nagpur Santra)",
    "Sorghum (Jowar)", "Pearl Millet (Bajra)", "Turmeric (Halad)"
  ]
}
```

### 2. Scan Crop Image
`POST /api/scan` (Multipart Form Data)
- **Parameters**:
  - `file`: Image file (JPG/PNG, max 10MB)
  - `farmer_name`: Optional farmer name (default: "Anonymous")
  - `location`: Optional location string

**Sample Response (`200 OK`)**:
```json
{
  "scanId": "scan_1789905909_76e71e",
  "status": "valid",
  "crop": {
    "name": "Tomato",
    "confidence": 0.9999
  },
  "diagnosis": {
    "condition": "Healthy",
    "type": "healthy",
    "healthStatus": "Healthy",
    "confidence": 0.5348,
    "severity": "None"
  },
  "topPredictions": [
    {
      "crop": "tomato",
      "condition": "healthy",
      "confidence": 0.5348,
      "probability": 0.5348
    }
  ],
  "analysis": {
    "summary": "Foliage exhibits vibrant chlorophyll coloration, turgid leaf texture, and intact lamina.",
    "symptoms": [
      "Vibrant uniform green coloration without chlorosis",
      "Clean margins with absence of blights or necrotic lesions"
    ],
    "recommendedActions": [
      "Maintain drip irrigation schedule avoiding overhead wetting",
      "Conduct routine scouting for early hornworm or aphid arrival"
    ],
    "prevention": [
      "Practice 3-year crop rotation away from Solanaceae family",
      "Ensure proper plant spacing for aeration"
    ]
  },
  "metadata": {
    "model": "CropGuard-Hybrid-MobileNetV3-CLIP",
    "modelVersion": "2.4.0",
    "datasetSources": ["ICAR", "PlantVillage"]
  },
  "imageUrl": "/uploads/scan_history/20260920_120509_76e71e.jpg"
}
```

### 3. Scan History
- `GET /api/scans/history`: Fetch all persistent scans ordered newest first.
- `GET /api/scans/history/{scan_id}`: Fetch full diagnosis record for a specific scan.
- `DELETE /api/scans/history/{scan_id}`: Delete scan record from database and remove uploaded image from disk.

---

## 🏛️ Authoritative Data Sources & Compliance

- **Primary Source**: ICAR (Indian Council of Agricultural Research) & Maharashtra State Agricultural Universities (MPKV Rahuri, VNMKV Parbhani, Dr. PDKV Akola, DBSKKV Dapoli) diagnostic protocols.
- **License**: Government of India Open Government Data License (OGDL India) compliant via `data.gov.in`.
- **Secondary Source**: PlantVillage open research dataset used for secondary validation.
- **Documentation**:
  - Full catalog details documented in [`docs/CROP_DATA_SOURCES.md`](docs/CROP_DATA_SOURCES.md).
  - Maharashtra 20-crop harvest & diagnostic profiles in [`docs/MAHARASHTRA_20_CROPS.md`](docs/MAHARASHTRA_20_CROPS.md).

---

## 📄 License & Team
Developed for **Smart India Hackathon (SIH)**. All rights reserved.
