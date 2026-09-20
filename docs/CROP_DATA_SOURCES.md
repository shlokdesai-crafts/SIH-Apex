# CropGuard: Authoritative Agriculture Data Sources & Dataset Strategy

This document details the authoritative and secondary agricultural datasets, institutions, catalog identifiers, and canonical taxonomy utilized in the **CropGuard (SIH-Apex)** crop identification and disease diagnosis system.

---

## 1. Primary Source: Government of India / ICAR Authoritative Data

### 1.1 Open Government Data (OGD) Platform India (`data.gov.in`)
- **Dataset / Catalog Name**: *Crop Disease and Pest Image Data*
- **Publisher Organization**: 
  - Ministry of Agriculture and Farmers Welfare
  - Department of Agricultural Research and Education (DARE)
  - Indian Council of Agricultural Research (ICAR)
- **Portal URL**: [data.gov.in](https://data.gov.in)
- **Date Accessed**: September 2026
- **License / Terms**: Open Government Data License – India (OGDL-India)
- **Role in Project**: Primary reference, diagnostic taxonomy, symptom profiles, and cultural advisory baseline.
- **Crops Covered**:
  1. **Rice (Paddy)**: Bacterial Leaf Blight, Blast, Brown Spot, Tungro
  2. **Maize (Corn)**: Common Rust, Gray Leaf Spot, Northern Leaf Blight, Maize Streak Virus, Fall Armyworm (*Spodoptera frugiperda*)
  3. **Wheat**: Brown Rust (Leaf Rust), Yellow Rust (Stripe Rust), Powdery Mildew, Septoria
  4. **Cotton**: Bacterial Blight (Angular Leaf Spot), Leaf Curl Virus (CLCuD), Fusarium Wilt, Target Spot
  5. **Sugarcane**: Red Rot, Rust, Mosaic Virus, Yellow Leaf Disease
  6. **Soybean**: Cercospora Leaf Blight, Frogeye Leaf Spot, Rust, Yellow Mosaic Virus
  7. **Chickpea (Gram)**: Ascochyta Blight, Fusarium Wilt, Dry Root Rot, Stunt Virus
  8. **Tomato**: Bacterial Spot, Early Blight, Late Blight, Tomato Yellow Leaf Curl Virus (TYLCV)

### 1.2 ICAR Research Institutes & Agricultural Universities Reference Portals
- **Institutes**:
  - ICAR - Indian Agricultural Research Institute (IARI), New Delhi
  - ICAR - National Rice Research Institute (NRRI), Cuttack
  - ICAR - Indian Institute of Rice Research (IIRR), Hyderabad
  - ICAR - Indian Institute of Wheat and Barley Research (IIWBR), Karnal
  - ICAR - Indian Institute of Maize Research (IIMR), Ludhiana
  - ICAR - Central Institute for Cotton Research (CICR), Nagpur
  - ICAR - Indian Institute of Soybean Research (IISR), Indore
  - ICAR - Indian Institute of Sugarcane Research (IISR), Lucknow
  - ICAR - Sugarcane Breeding Institute (SBI), Coimbatore
  - ICAR - Indian Institute of Pulses Research (IIPR), Kanpur
  - ICAR - Indian Institute of Vegetable Research (IIVR), Varanasi
  - ICAR - National Research Centre for Integrated Pest Management (NCIPM), New Delhi
  - Tamil Nadu Agricultural University (TNAU) Agritech Portal
  - Directorate of Plant Protection, Quarantine & Storage (DPPQS)
- **Usage**: Authoritative agronomic knowledge base (`backend/data/crop_disease_knowledge.json`) providing field symptoms, validated cultural practices, sanitation/prevention, and safe chemical pesticide guidance warnings.

---

## 2. Secondary Source: Open Benchmark Datasets

### 2.1 PlantVillage Dataset
- **Organization / Authors**: Penn State University, EPFL (CrowdAI / HuggingFace `osunlp/PlantVillage`, `arjuntejaswi/plant-village`)
- **License**: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- **Classification Status**: **SECONDARY ACADEMIC BENCHMARK** — *Strictly documented as secondary open access research data, never misrepresented or claimed as Government of India data.*
- **Role in Project**: Visual feature prototype validation, transfer learning benchmarks, and secondary baseline comparison for common foliar diseases (Tomato, Maize, Wheat).
- **Date Accessed**: September 2026
- **Limitations**: Laboratory / greenhouse-acquired leaf images against uniform background; supplemented in CropGuard with real in-field photographic feature ensembles and open-set negative prompt rejection to handle real farm environments.

---

## 3. Canonical Crop and Disease Mapping Layer

To ensure uniform taxonomies across disparate datasets, API responses, and database records, CropGuard enforces a centralized canonical mapping layer in `backend/data/canonical_mapping.py`:

### 3.1 Standardized Class Format
Each diagnosis and reference entry conforms to:
```typescript
interface CanonicalCondition {
  crop: string;           // Canonical species name (e.g. "Maize", "Tomato")
  condition: string;      // Canonical pathology name (e.g. "Early Blight", "Healthy")
  conditionType: string;  // "healthy" | "disease" | "pest" | "uncertain"
  source: string;         // "ICAR" | "PlantVillage" | "OpenGov"
}
```

### 3.2 Canonical Crop Identifiers
| User / Model Input | Canonical Crop | Display Name | Normalized Key |
|---|---|---|---|
| `corn`, `maize`, `sweetcorn`, `makka` | Maize | Maize (Corn) | `maize` |
| `tomato`, `tomatoes`, `tamata` | Tomato | Tomato | `tomato` |
| `rice`, `paddy`, `bhat` | Rice | Rice | `rice` |
| `wheat`, `gahu` | Wheat | Wheat | `wheat` |
| `cotton`, `kapus` | Cotton | Cotton | `cotton` |
| `soybean`, `soya` | Soybean | Soybean | `soybean` |
| `sugarcane`, `cane`, `us` | Sugarcane | Sugarcane | `sugarcane` |
| `chickpea`, `gram`, `chana`, `harbara` | Chickpea | Chickpea | `chickpea` |
| `onion`, `kanda` | Onion | Onion | `onion` |
| `potato`, `batata` | Potato | Potato | `potato` |
| `pigeon pea`, `tur`, `arhar` | Pigeon Pea | Pigeon Pea (Tur) | `pigeon_pea` |
| `groundnut`, `peanut`, `bhuimug` | Groundnut | Groundnut (Peanut) | `groundnut` |
| `pomegranate`, `dalimb` | Pomegranate | Pomegranate (Dalimb) | `pomegranate` |
| `grapes`, `draksha` | Grapes | Grapes (Draksha) | `grapes` |
| `banana`, `keli` | Banana | Banana (Keli) | `banana` |
| `mango`, `alphonso`, `hapus` | Mango | Mango (Alphonso) | `mango` |
| `orange`, `santra` | Orange | Orange (Nagpur Santra) | `orange` |
| `sorghum`, `jowar`, `maldandi` | Sorghum | Sorghum (Jowar) | `sorghum` |
| `pearl millet`, `bajra`, `bajri` | Pearl Millet | Pearl Millet (Bajra) | `pearl_millet` |
| `turmeric`, `halad`, `haldi` | Turmeric | Turmeric (Halad) | `turmeric` |

### 3.3 Raw Dataset Class Mapping Examples
- `Corn_(maize)___Common_rust_` $\rightarrow$ `{ crop: "Maize", condition: "Common Rust", conditionType: "disease", source: "PlantVillage" }`
- `ICAR_Rice_Blast` $\rightarrow$ `{ crop: "Rice", condition: "Blast", conditionType: "disease", source: "ICAR" }`
- `ICAR_Maize_Fall_Armyworm` $\rightarrow$ `{ crop: "Maize", condition: "Fall Armyworm", conditionType: "pest", source: "ICAR" }`
- `Tomato___Late_blight` $\rightarrow$ `{ crop: "Tomato", condition: "Late Blight", conditionType: "disease", source: "PlantVillage" }`

---

## 4. Dataset Governance & Limitations

1. **No Scraping**: No restricted government portals or proprietary databases were scraped.
2. **Authentic APIs & Storage**: No faked government API responses; all historical scans are persisted genuinely into local SQLite database (`submissions.db`).
3. **Field Generalization**: Early lab-acquired leaf photos (e.g. PlantVillage) exhibit bias toward isolated leaves; CropGuard mitigates this by applying multimodal CLIP vision-language prompt ensembles and MobileNetV2 plant-relevance filtering, enabling robust diagnosis on whole plants, cobs, fruits, and in-field foliage.
4. **Safety Guidance**: Pesticide formulations never output dangerous dosages or unverified chemical cocktails. High-level compliance warnings ensure all interventions align with registered label instructions and local agricultural university recommendations.
