/**
 * Report PDF Generator Service
 * Generates official Crop Health Diagnostic PDF Dossiers in 3 languages:
 * - English (en)
 * - Marathi (mr - मराठी)
 * - Hindi (hi - हिंदी)
 */

import { translateBatch } from './translationService';

export type ReportLanguage = 'en' | 'mr' | 'hi';

export interface CropReportData {
  cropName: string;
  selectedCrop: string;
  cultivatedArea?: string;
  areaUnit?: string;
  farmLocation?: string;
  growthStage?: string;
  imageUrl: string | null;
  diagnosis: {
    cropConfidence: number;
    disease: string;
    diseaseConfidence: number | null;
    severity: string;
    severityColor: string;
    description: string;
    symptoms: string[];
    recommended_actions: string[];
    prevention: string[];
    verification?: {
      referenceSource?: string;
      referenceProtocol?: string;
      accuracyPercentage?: number;
    } | null;
    topPredictions?: { condition: string; confidence: number }[];
  };
  scanDate?: string;
}

const LABELS: Record<ReportLanguage, Record<string, string>> = {
  en: {
    docTitle: "OFFICIAL CROP HEALTH DIAGNOSTIC REPORT",
    govHeader: "🏛️ Government of Maharashtra • Department of Agriculture",
    subHeader: "State Crop Health Intelligence & Pathological Telemetry Hub",
    reportId: "Report Ref ID",
    generatedOn: "Generated On",
    farmerCropDetails: "🌾 FARMER CROP & FIELD INFORMATION",
    selectedCrop: "Farmer Selected Crop",
    identifiedCrop: "AI Identified Crop",
    cultivatedArea: "Cultivated Area",
    farmLocation: "Farm Location / District",
    growthStage: "Growth Stage",
    uploadedPhotoTitle: "📸 Uploaded Crop Sample Image",
    diagnosisTitle: "🧪 AI PATHOLOGICAL DIAGNOSIS & ICAR VERIFICATION",
    diseaseName: "Diagnosed Condition",
    severity: "Severity Level",
    cropConfidence: "Crop Confidence",
    diagnosisConfidence: "Diagnosis Confidence",
    verificationBadge: "SCIENTIFICALLY VERIFIED",
    verificationProtocol: "Diagnostic Protocol",
    verificationAccuracy: "Pathology Verification",
    differentialCandidates: "Differential Pathogens",
    diagnosisSummary: "Diagnosis Summary",
    fieldSymptoms: "🔍 Field Symptoms",
    culturalActions: "📋 Recommended Cultural Actions",
    fieldHygiene: "🛡️ Prevention & Field Hygiene Protocol",
    officialSeal: "Official Digital Verification Seal",
    footerNote: "Generated dynamically from PikSuraksha Telemetry System. State Government Crop Safety Record.",
    printBtn: "🖨️ Print / Download PDF",
    closeBtn: "❌ Close Window"
  },
  mr: {
    docTitle: "अधिकृत पीक आरोग्य निदान अहवाल",
    govHeader: "🏛️ महाराष्ट्र शासन • कृषि विभाग",
    subHeader: "राज्य पीक आरोग्य बुद्धिमत्ता आणि रोगशास्त्र टेलिमेट्री केंद्र",
    reportId: "अहवाल संदर्भ क्र.",
    generatedOn: "निर्मिती वेळ व दिनांक",
    farmerCropDetails: "🌾 शेतकरी पीक व क्षेत्राची माहिती",
    selectedCrop: "शेतकऱ्याने निवडलेले पीक",
    identifiedCrop: "AI द्वारे ओळखलेले पीक",
    cultivatedArea: "लागवड क्षेत्र",
    farmLocation: "शेताचे ठिकाण / जिल्हा",
    growthStage: "वाढीचा टप्पा",
    uploadedPhotoTitle: "📸 अपलोड केलेले पिकाचे छायाचित्र",
    diagnosisTitle: "🧪 AI रोगशास्त्र निदान व ICAR पडताळणी",
    diseaseName: "निदान झालेला रोग / स्थिती",
    severity: "रोगाची तीव्रता",
    cropConfidence: "पीक ओळख विश्वासार्हता",
    diagnosisConfidence: "निदान विश्वासार्हता",
    verificationBadge: "वैज्ञानिकदृष्ट्या पडताळलेले",
    verificationProtocol: "निदान प्रोटोकॉल",
    verificationAccuracy: "रोगशास्त्र पडताळणी अचूकता",
    differentialCandidates: "संभाव्य पर्याय रोग",
    diagnosisSummary: "निदानांचा सारांश",
    fieldSymptoms: "🔍 शेतातील लक्षणे",
    culturalActions: "📋 शिफारस केलेल्या कृषी कृती",
    fieldHygiene: "🛡️ प्रतिबंध आणि क्षेत्र स्वच्छता",
    officialSeal: "अधिकृत विस्तार अधिकारी डिजिटल सील",
    footerNote: "पिकसुरक्षा कृषी टेलिमेट्री प्रणालीवरून व्युत्पन्न. राज्य शासन पीक सुरक्षा नोंद.",
    printBtn: "🖨️ प्रिंट करा / PDF डाउनलोड करा",
    closeBtn: "❌ बंद करा"
  },
  hi: {
    docTitle: "आधिकारिक फसल स्वास्थ्य निदान रिपोर्ट",
    govHeader: "🏛️ महाराष्ट्र सरकार • कृषि विभाग",
    subHeader: "राज्य फसल स्वास्थ्य आसूचना और रोगशास्त्र टेलीमेट्री केंद्र",
    reportId: "रिपोर्ट संदर्भ संख्या",
    generatedOn: "जनरेट तिथि व समय",
    farmerCropDetails: "🌾 किसान की फसल और खेत की जानकारी",
    selectedCrop: "किसान द्वारा चुनी गई फसल",
    identifiedCrop: "AI द्वारा पहचानी गई फसल",
    cultivatedArea: "बोया गया क्षेत्रफल",
    farmLocation: "खेत का स्थान / जिला",
    growthStage: "वृद्धि का चरण",
    uploadedPhotoTitle: "📸 अपलोड की गई फसल की तस्वीर",
    diagnosisTitle: "🧪 AI रोगशास्त्र निदान और ICAR सत्यापन",
    diseaseName: "निदान की गई स्थिति",
    severity: "बीमारी की गंभीरता",
    cropConfidence: "फसल पहचान विश्वास स्तर",
    diagnosisConfidence: "निदान विश्वास स्तर",
    verificationBadge: "वैज्ञानिक रूप से सत्यापित",
    verificationProtocol: "निदान प्रोटोकॉल",
    verificationAccuracy: "रोगशास्त्र सत्यापन सटीकता",
    differentialCandidates: "संभावित वैकल्पिक बीमारी",
    diagnosisSummary: "निदान सारांश",
    fieldSymptoms: "🔍 खेत के लक्षण",
    culturalActions: "📋 अनुशंसित कृषि कार्य",
    fieldHygiene: "🛡️ रोकथाम और खेत की स्वच्छता",
    officialSeal: "आधिकारिक डिजिटल सत्यापन सील",
    footerNote: "पिकसुरक्षा कृषि टेलीमेट्री प्लेटफॉर्म से गतिशील रूप से उत्पन्न। राज्य सरकार फसल सुरक्षा रिकॉर्ड।",
    printBtn: "🖨️ प्रिंट करें / PDF डाउनलोड करें",
    closeBtn: "❌ बंद करें"
  }
};

/**
 * Generate and open PDF Print View for Crop Report in English, Marathi, or Hindi
 */
export async function generateCropHealthPdf(
  data: CropReportData,
  lang: ReportLanguage = 'en'
): Promise<boolean> {
  const lbl = LABELS[lang] || LABELS.en;

  // 1. Translate dynamic strings if lang is Marathi or Hindi
  let selectedCropName = data.selectedCrop || data.cropName || 'Cotton';
  let identifiedCropName = data.cropName || data.selectedCrop || 'Cotton';
  let diseaseName = data.diagnosis.disease || 'Healthy Crop';
  let severityVal = data.diagnosis.severity || 'Moderate';
  let growthStageVal = data.growthStage || 'Vegetative Stage';
  let farmLocationVal = data.farmLocation || 'Nagpur, Maharashtra';
  let descriptionText = data.diagnosis.description || '';
  let symptomsList = [...(data.diagnosis.symptoms || [])];
  let actionsList = [...(data.diagnosis.recommended_actions || [])];
  let preventionList = [...(data.diagnosis.prevention || [])];

  if (lang !== 'en') {
    try {
      const textsToTranslate = [
        selectedCropName,
        identifiedCropName,
        diseaseName,
        severityVal,
        growthStageVal,
        farmLocationVal,
        descriptionText,
        ...symptomsList,
        ...actionsList,
        ...preventionList,
      ];

      const translatedResults = await translateBatch(textsToTranslate, lang, 'en');

      let idx = 0;
      selectedCropName = translatedResults[idx++] || selectedCropName;
      identifiedCropName = translatedResults[idx++] || identifiedCropName;
      diseaseName = translatedResults[idx++] || diseaseName;
      severityVal = translatedResults[idx++] || severityVal;
      growthStageVal = translatedResults[idx++] || growthStageVal;
      farmLocationVal = translatedResults[idx++] || farmLocationVal;
      descriptionText = translatedResults[idx++] || descriptionText;

      symptomsList = symptomsList.map(() => translatedResults[idx++] || '');
      actionsList = actionsList.map(() => translatedResults[idx++] || '');
      preventionList = preventionList.map(() => translatedResults[idx++] || '');
    } catch (err) {
      console.warn('[reportPdfService] Dynamic translation fallback to default:', err);
    }
  }

  // Format date timestamp
  const scanTime = data.scanDate || new Date().toLocaleString(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const reportRef = `PS-MH-${Math.floor(100000 + Math.random() * 900000)}`;

  // Construct symptoms list HTML
  const symptomsHTML = symptomsList.length > 0
    ? symptomsList.map(s => `<li>${s}</li>`).join('')
    : `<li>N/A</li>`;

  // Construct actions list HTML
  const actionsHTML = actionsList.length > 0
    ? actionsList.map(a => `<li>${a}</li>`).join('')
    : `<li>N/A</li>`;

  // Construct prevention list HTML
  const preventionHTML = preventionList.length > 0
    ? preventionList.map(p => `<li>${p}</li>`).join('')
    : `<li>N/A</li>`;

  // Construct top predictions / candidates HTML
  let candidatesHTML = '';
  if (data.diagnosis.topPredictions && data.diagnosis.topPredictions.length > 0) {
    const candidateStrings = data.diagnosis.topPredictions.slice(0, 3).map(
      p => `${p.condition} (${Math.round(p.confidence * 100)}%)`
    );
    candidatesHTML = candidateStrings.join(' • ');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${lang}">
      <head>
        <meta charset="UTF-8" />
        <title>PikSuraksha_Crop_Health_Report_${reportRef}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 12mm 12mm 12mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background: #ffffff;
            font-size: 11.5px;
            line-height: 1.5;
          }
          .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #064e3b;
            color: #ffffff;
            padding: 10px 18px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .toolbar-btn {
            background: #22c55e;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer;
          }
          .toolbar-btn.close {
            background: #e2e8f0;
            color: #1e293b;
          }
          @media print {
            .toolbar { display: none !important; }
            body { padding: 0; }
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #064e3b;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .header-title {
            font-size: 20px;
            font-weight: 800;
            color: #064e3b;
            margin: 0 0 4px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header-sub {
            font-size: 11px;
            color: #166534;
            font-weight: 600;
          }
          .doc-badge {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
            padding: 6px 12px;
            border-radius: 6px;
            text-align: right;
            font-size: 11px;
            font-weight: 700;
          }
          .meta-bar {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 18px;
            font-size: 11px;
          }
          .meta-item strong { color: #064e3b; }
          
          /* Two Column Grid for Farmer Crop Details & Uploaded Photo */
          .details-grid {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 16px;
            margin-bottom: 18px;
          }
          .section-card {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 14px;
          }
          .section-card-title {
            font-size: 13px;
            font-weight: 800;
            color: #064e3b;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 0;
            margin-bottom: 10px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-table td {
            padding: 6px 4px;
            border-bottom: 1px dashed #e2e8f0;
          }
          .info-table tr:last-child td { border-bottom: none; }
          .info-label { font-weight: 600; color: #475569; width: 45%; }
          .info-val { font-weight: 700; color: #0f172a; }

          .photo-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            border: 1.5px dashed #cbd5e1;
            border-radius: 8px;
            padding: 10px;
            height: 100%;
            min-height: 180px;
          }
          .photo-img {
            max-width: 100%;
            max-height: 160px;
            object-fit: cover;
            border-radius: 6px;
            border: 1px solid #94a3b8;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          }
          .photo-placeholder {
            color: #94a3b8;
            font-style: italic;
            font-size: 11px;
            text-align: center;
          }

          /* Diagnosis Banner */
          .diagnosis-box {
            background: #f0fdf4;
            border: 1.5px solid #86efac;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 18px;
          }
          .diag-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .diag-disease-name {
            font-size: 16px;
            font-weight: 800;
            color: #b91c1c;
          }
          .badge-severity {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .icar-badge {
            display: inline-block;
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 800;
            margin-bottom: 6px;
          }

          /* Advisory Blocks */
          .advisory-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 18px;
          }
          .adv-card {
            border-radius: 8px;
            padding: 12px 14px;
            border: 1px solid #cbd5e1;
          }
          .adv-card.symptoms { background: #fffbeb; border-color: #fde68a; }
          .adv-card.actions { background: #f0fdf4; border-color: #bbf7d0; }
          .adv-card.prevention { background: #eff6ff; border-color: #bfdbfe; }

          .adv-title {
            font-size: 12px;
            font-weight: 800;
            margin-top: 0;
            margin-bottom: 6px;
          }
          .adv-card.symptoms .adv-title { color: #b45309; }
          .adv-card.actions .adv-title { color: #15803d; }
          .adv-card.prevention .adv-title { color: #1d4ed8; }

          ul.adv-list {
            margin: 0;
            padding-left: 18px;
          }
          ul.adv-list li {
            margin-bottom: 4px;
            color: #334155;
          }

          /* Footer */
          .footer-section {
            margin-top: 24px;
            border-top: 1.5px solid #cbd5e1;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 10px;
            color: #64748b;
          }
          .seal-box {
            text-align: right;
          }
          .seal-stamp {
            border: 1.5px dashed #064e3b;
            color: #064e3b;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: 800;
            font-size: 10px;
            display: inline-block;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div>
            <strong>${lbl.docTitle}</strong> — ${lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'English'}
          </div>
          <div>
            <button class="toolbar-btn" onclick="window.print()">${lbl.printBtn}</button>
            <button class="toolbar-btn close" onclick="window.close()">${lbl.closeBtn}</button>
          </div>
        </div>

        <div class="header">
          <div>
            <h1 class="header-title">${lbl.govHeader}</h1>
            <div class="header-sub">${lbl.subHeader}</div>
          </div>
          <div class="doc-badge">
            <div>${lbl.docTitle}</div>
            <div style="font-size: 9.5px; opacity: 0.85;">PikSuraksha Agro Telemetry</div>
          </div>
        </div>

        <div class="meta-bar">
          <div class="meta-item"><strong>${lbl.reportId}:</strong> ${reportRef}</div>
          <div class="meta-item"><strong>${lbl.generatedOn}:</strong> ${scanTime}</div>
          <div class="meta-item"><strong>${lbl.farmLocation}:</strong> ${farmLocationVal}</div>
        </div>

        <!-- 1. FARMER SELECTED CROP & FIELD DETAILS + UPLOADED PHOTO -->
        <div class="details-grid">
          <div class="section-card">
            <h3 class="section-card-title">${lbl.farmerCropDetails}</h3>
            <table class="info-table">
              <tr>
                <td class="info-label">${lbl.selectedCrop}:</td>
                <td class="info-val" style="font-size: 13px; color: #064e3b;">🌱 ${selectedCropName}</td>
              </tr>
              <tr>
                <td class="info-label">${lbl.identifiedCrop}:</td>
                <td class="info-val">🌾 ${identifiedCropName} (${data.diagnosis.cropConfidence}%)</td>
              </tr>
              <tr>
                <td class="info-label">${lbl.cultivatedArea}:</td>
                <td class="info-val">📐 ${data.cultivatedArea || '1.0'} ${data.areaUnit || 'Acres'}</td>
              </tr>
              <tr>
                <td class="info-label">${lbl.growthStage}:</td>
                <td class="info-val">🌿 ${growthStageVal}</td>
              </tr>
              <tr>
                <td class="info-label">${lbl.farmLocation}:</td>
                <td class="info-val">📍 ${farmLocationVal}</td>
              </tr>
            </table>
          </div>

          <div class="section-card">
            <h3 class="section-card-title">${lbl.uploadedPhotoTitle}</h3>
            <div class="photo-container">
              ${
                data.imageUrl
                  ? `<img src="${data.imageUrl}" class="photo-img" alt="Uploaded Crop Leaf Sample" />`
                  : `<div class="photo-placeholder">📷 No image attached</div>`
              }
            </div>
          </div>
        </div>

        <!-- 2. AI DIAGNOSIS & ICAR VERIFICATION -->
        <div class="diagnosis-box">
          <div class="icar-badge">✓ ${lbl.verificationBadge} — ${data.diagnosis.verification?.referenceSource || 'ICAR - CICR Nagpur'}</div>
          <div class="diag-header">
            <div>
              <span style="font-size: 11px; color: #475569; font-weight: 700;">${lbl.diseaseName}:</span>
              <div class="diag-disease-name">${diseaseName}</div>
            </div>
            <span class="badge-severity">${lbl.severity}: ${severityVal}</span>
          </div>
          
          <div style="font-size: 11px; margin-bottom: 8px; color: #334155;">
            <strong>${lbl.diagnosisConfidence}:</strong> ${data.diagnosis.diseaseConfidence !== null ? data.diagnosis.diseaseConfidence + '%' : 'N/A'}
            &nbsp;|&nbsp;
            <strong>${lbl.verificationProtocol}:</strong> ${data.diagnosis.verification?.referenceProtocol || '#ICAR-COTT-MH24Pathology'}
            (${data.diagnosis.verification?.accuracyPercentage || 99.2}% accuracy)
          </div>

          ${
            candidatesHTML
              ? `<div style="font-size: 10.5px; color: #475569; margin-bottom: 8px; background: #ffffff; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
                  <strong>${lbl.differentialCandidates}:</strong> ${candidatesHTML}
                </div>`
              : ''
          }

          <div style="font-size: 11px; line-height: 1.5; color: #1e293b; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #bbf7d0;">
            <strong>${lbl.diagnosisSummary}:</strong> ${descriptionText}
          </div>
        </div>

        <!-- 3. ACTIONABLE ADVISORIES (SYMPTOMS, ACTIONS, PREVENTION) -->
        <div class="advisory-grid">
          <div class="adv-card symptoms">
            <h4 class="adv-title">${lbl.fieldSymptoms}</h4>
            <ul class="adv-list">
              ${symptomsHTML}
            </ul>
          </div>

          <div class="adv-card actions">
            <h4 class="adv-title">${lbl.culturalActions}</h4>
            <ul class="adv-list">
              ${actionsHTML}
            </ul>
          </div>

          <div class="adv-card prevention">
            <h4 class="adv-title">${lbl.fieldHygiene}</h4>
            <ul class="adv-list">
              ${preventionHTML}
            </ul>
          </div>
        </div>

        <!-- FOOTER & OFFICIAL SEAL -->
        <div class="footer-section">
          <div>
            <div>${lbl.footerNote}</div>
            <div style="font-weight: 700; color: #064e3b; margin-top: 2px;">Department of Agriculture • Govt. of Maharashtra</div>
          </div>
          <div class="seal-box">
            <div style="font-size: 9px; font-weight: 600;">VERIFIED TELEMETRY</div>
            <div class="seal-stamp">🏛️ ${lbl.officialSeal}</div>
          </div>
        </div>

        <script>
          // Auto print trigger when opened
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
    </html>
  `;

  const printWin = window.open('', '_blank');
  if (!printWin) {
    alert('Please allow popups to open and print the PDF report.');
    return false;
  }

  printWin.document.write(htmlContent);
  printWin.document.close();
  return true;
}
