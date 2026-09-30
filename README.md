# PikSuraksha (SIH Apex) 🌾

[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)

An intelligent multi-stage crop health, identification, and advisory platform designed for Indian agriculture with special focus on Maharashtra's key crops. Built with **React + Vite** (Vercel), **FastAPI** (Render), and **MongoDB Atlas** database cloud cluster.

---

## 🏛️ Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                React 19 + Vite Frontend                     │
 │                   (Hosted on Vercel)                        │
 └──────────────────────────────┬──────────────────────────────┘
                                │ HTTPS / REST API
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                 FastAPI Python Backend                      │
 │                   (Hosted on Render)                        │
 └──────────────────────────────┬──────────────────────────────┘
                                │ PyMongo / Driver
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                MongoDB Atlas Cloud Cluster                  │
 │      (Users, Scans, Farm Telemetry, Advisories, Risk)       │
 └─────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 19, Vite 8, TypeScript, React Router 7, Leaflet map integration, responsive custom CSS design system. Deployed on **Vercel**.
- **Backend**: FastAPI Python application handling authentication, crop scan telemetry, farm CRUD operations, risk forecasts, notifications, and advisories. Deployed on **Render**.
- **Database Layer**: **MongoDB Atlas** cloud cluster with indexing for user sessions, farm documents, scan history, diagnosis reports, and risk telemetry.

---

## 🔑 Judge Demo Login

For rapid hackathon evaluation, the login page features immediate **Demo Access**:
- 👨‍🌾 **Farmer Demo**: Log into a pre-configured farmer profile (Ramesh Patil) with active farm telemetry and scan history.
- 🏛️ **Government Officer Demo**: Log into a pre-configured district agriculture officer profile (Dr. Sunita Deshmukh) with high-level analytical tools.

All demo authentication is securely processed via server-issued HMAC tokens without exposing credentials in client source code.

---

## 🚀 Key Features

1. **Farmer Portal & My Farm Telemetry**:
   - Plot-by-plot crop tracking, health scoring, soil profiles, and yield estimations.
   - Persistent scan history with detailed disease diagnosis and treatment advisories.

2. **Government & Analytical Dashboard**:
   - District-level health heatmaps, outbreak alerts, field visit dispatching, and high-priority action logs.

3. **Agronomic Advisories & Risk Forecasting**:
   - Actionable ICAR-aligned treatment recommendations, organic remedies, and seasonal risk alerts.

4. **Multi-lingual Support**:
   - Full localized UI support for English, Hindi (हिंदी), and Marathi (मराठी).

---

## 💻 Running Locally

### Prerequisites
- **Node.js**: v18+ (tested on v20+)
- **Python**: 3.10+
- **MongoDB Atlas URI** (set `MONGO_URL` in `.env`)

### 1. Backend Setup (FastAPI)
```powershell
# Navigate to backend and install requirements
pip install -r backend/requirements.txt

# Start backend server on port 8000
python backend/main.py
```

### 2. Frontend Setup (React + Vite)
```powershell
# Install node packages
npm install

# Start Vite dev server
npm run dev
```

---

## 🧪 Verification Commands

```powershell
# TypeScript compilation check
npx tsc --noEmit

# Production build check
npm run build

# Linter check
npm run lint
```

---

## 📄 License
Developed for **Smart India Hackathon (SIH)**. All rights reserved.
