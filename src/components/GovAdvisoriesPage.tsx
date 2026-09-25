import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { ALL_CROPS_LIST } from '../constants/crops';
import './GovAdvisoriesPage.css';

export interface GovAdvisoryDirective {
  id: string;
  code: string;
  crop: string;
  disease: string;
  scientificName: string;
  severity: 'Severe' | 'Moderate' | 'Low';
  priority: 'Critical Outbreak' | 'High Priority' | 'Standard Protocol' | 'Quarantine Alert';
  districtHotspots: string[];
  symptoms: string[];
  icarTreatment: string[];
  fieldVisitGuidance: string[];
  effectivePesticide: string;
  safetyInterval: string;
  issuingAuthority: string;
}

const OFFICIAL_ADVISORIES: GovAdvisoryDirective[] = [
  {
    id: 'adv-001',
    code: 'ADV-2026-MH-001',
    crop: 'Sugarcane',
    disease: 'Red Rot Disease',
    scientificName: 'Colletotrichum falcatum',
    severity: 'Severe',
    priority: 'Critical Outbreak',
    districtHotspots: ['Latur', 'Kolhapur', 'Satara', 'Sangli'],
    symptoms: [
      'Reddening of leaf midribs with characteristic white transverse spots',
      'Longitudinal splitting of stalk reveals red discolored tissue with white bands',
      'Alcoholic odor emanating from affected split stalks with complete wilt'
    ],
    icarTreatment: [
      'Soil drenching with Carbendazim 50% WP @ 2g/L water along affected rows',
      'Dip setts in Trichoderma viride bio-agent formulation (10g/L) prior to gap filling',
      'Apply bio-fungicide Pseudomonas fluorescens @ 2.5 kg/ha mixed with well-rotted FYM'
    ],
    fieldVisitGuidance: [
      'Inspect field drainage channels and eliminate standing water immediately',
      'Collect 3-5 affected stalk samples for laboratory pathogen confirmation',
      'Mandate uprooting and controlled burning of infected clumps to prevent airborne spore dispersal'
    ],
    effectivePesticide: 'Carbendazim 50% WP / Trichoderma viride bio-agent',
    safetyInterval: '14-day pre-harvest safety interval. Wear protective gloves during chemical mixing.',
    issuingAuthority: 'ICAR-Sugarcane Breeding Institute & MPKV Rahuri'
  },
  {
    id: 'adv-002',
    code: 'ADV-2026-MH-002',
    crop: 'Soybean',
    disease: 'Yellow Mosaic Virus (YMV)',
    scientificName: 'Begomovirus / Bemisia tabaci vector',
    severity: 'Moderate',
    priority: 'High Priority',
    districtHotspots: ['Nanded', 'Latur', 'Osmanabad', 'Beed'],
    symptoms: [
      'Yellow patches appearing on young leaves gradually coalesce to cover entire leaf lamina',
      'Stunting of plants with reduced flower bloom and malformed unfilled pods',
      'High density of whitefly vector (Bemisia tabaci) on lower leaf surface'
    ],
    icarTreatment: [
      'Foliar spray of Thiamethoxam 25% WG @ 100g/ha to knock down whitefly vector population',
      'Alternate spray of Acetamiprid 20% SP @ 50g/ha after 12-15 days if vector count exceeds threshold'
    ],
    fieldVisitGuidance: [
      'Install yellow sticky traps @ 25 traps/hectare across monitored field plots',
      'Count whitefly vectors per 10 leaves to verify economic threshold levels (ETL)',
      'Instruct farmers against excessive nitrogenous fertilizers which attract vector whiteflies'
    ],
    effectivePesticide: 'Thiamethoxam 25% WG / Acetamiprid 20% SP',
    safetyInterval: 'Apply sprays in early morning (6 AM - 9 AM) to protect pollinator insects.',
    issuingAuthority: 'ICAR-Indian Institute of Soybean Research, Indore'
  },
  {
    id: 'adv-003',
    code: 'ADV-2026-MH-003',
    crop: 'Cotton',
    disease: 'Pink Bollworm & Boll Rot',
    scientificName: 'Pectinophora gossypiella',
    severity: 'Severe',
    priority: 'Critical Outbreak',
    districtHotspots: ['Dhule', 'Wardha', 'Nanded', 'Yavatmal'],
    symptoms: [
      'Rosette flowers with pinkish larvae inside unopened flower buds',
      'Larval entry holes sealed with frass on green cotton bolls',
      'Lint staining, premature boll opening, and secondary fungal boll rot'
    ],
    icarTreatment: [
      'Deploy Pheromone Traps @ 12 traps/ha for monitoring and mass male moth trapping',
      'Foliar spray of Chlorantraniliprole 18.5% SC @ 150ml/ha or Profenofos 50% EC @ 1000ml/ha upon crossing ETL (8 moths/trap/night)'
    ],
    fieldVisitGuidance: [
      'Destructive sampling: Pluck 20 green bolls per acre and cut open to check larval entry',
      'Demonstrate rosette flower destruction during farmer field school sessions',
      'Verify strict compliance with 120-day crop duration limit to break pest life cycle'
    ],
    effectivePesticide: 'Chlorantraniliprole 18.5% SC / Profenofos 50% EC',
    safetyInterval: 'Observe strict 21-day pre-harvest interval before cotton picking.',
    issuingAuthority: 'ICAR-Central Institute for Cotton Research (CICR), Nagpur'
  },
  {
    id: 'adv-004',
    code: 'ADV-2026-MH-004',
    crop: 'Tomato',
    disease: 'Early Blight & Target Leaf Spot',
    scientificName: 'Alternaria solani',
    severity: 'Moderate',
    priority: 'Standard Protocol',
    districtHotspots: ['Pune', 'Nashik', 'Satara', 'Ahmednagar'],
    symptoms: [
      'Dark brown to black concentric ring spots (target lesions) on lower mature leaves',
      'Chlorotic yellow halo surrounding leaf lesions with premature defoliation',
      'Sunken leathery lesions on fruit calyx stems during humid weather'
    ],
    icarTreatment: [
      'Spray Mancozeb 75% WP @ 2.5g/L water or Azoxystrobin 23% SC @ 1ml/L water',
      'Tank-mix with Copper Hydroxide 77% WP @ 2g/L if bacterial spot co-infection is detected'
    ],
    fieldVisitGuidance: [
      'Inspect lower canopy leaves for dark concentric ring lesions',
      'Recommend staking and bottom leaf pruning up to 30 cm height to improve ventilation'
    ],
    effectivePesticide: 'Azoxystrobin 23% SC / Mancozeb 75% WP',
    safetyInterval: 'Observe 7-day safety window before harvesting ripe tomatoes.',
    issuingAuthority: 'Directorate of Onion and Garlic Research & MPKV'
  },
  {
    id: 'adv-005',
    code: 'ADV-2026-MH-005',
    crop: 'Wheat',
    disease: 'Yellow / Stripe Rust',
    scientificName: 'Puccinia striiformis',
    severity: 'Severe',
    priority: 'Quarantine Alert',
    districtHotspots: ['Nashik', 'Pune', 'Solapur'],
    symptoms: [
      'Bright yellow linear pustules arranged in long stripes along leaf veins',
      'Yellow powder (urediniospores) wiping off easily onto fingers or white cloth',
      'Drying of flag leaves resulting in severe kernel shriveling and grain yield loss'
    ],
    icarTreatment: [
      'Immediate spray of Propiconazole 25% EC @ 1ml/L water or Tebuconazole 25.9% EC @ 1.25ml/L',
      'Repeat spray after 15 days if rust spores persist in weather forecast zones'
    ],
    fieldVisitGuidance: [
      'Conduct urgent field surveillance across wheat plots near cool high-humidity zones',
      'Issue immediate quarantine border warning if stripe rust yellow spores are verified'
    ],
    effectivePesticide: 'Propiconazole 25% EC / Tebuconazole 25.9% EC',
    safetyInterval: 'Wear N95 respirator mask during spraying to prevent fungal spore inhalation.',
    issuingAuthority: 'ICAR-Indian Institute of Wheat and Barley Research (IIWBR)'
  }
];

interface CaseCountMap {
  [crop: string]: number;
}

const GovAdvisoriesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Live MongoDB cases count mapping per crop
  const [liveCaseCounts, setLiveCaseCounts] = useState<CaseCountMap>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch live cases from MongoDB to compute matching cases per advisory crop
  useEffect(() => {
    const fetchMongoCaseCounts = async () => {
      try {
        const res = await fetch('/api/submissions?limit=300');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const counts: CaseCountMap = {};
            data.forEach((item) => {
              if (item.crop) {
                const cName = item.crop.trim();
                counts[cName] = (counts[cName] || 0) + 1;
              }
            });
            setLiveCaseCounts(counts);
          }
        }
      } catch (e) {
        console.error('Error fetching cases for advisories:', e);
      }
    };
    fetchMongoCaseCounts();

    const handleUpdate = () => fetchMongoCaseCounts();
    window.addEventListener('gov-data-updated', handleUpdate);
    return () => {
      window.removeEventListener('gov-data-updated', handleUpdate);
    };
  }, []);

  // Filtered Advisories
  const filteredAdvisories = useMemo(() => {
    return OFFICIAL_ADVISORIES.filter((adv) => {
      if (selectedCrop && adv.crop.toLowerCase() !== selectedCrop.toLowerCase()) return false;
      if (selectedSeverity && adv.severity.toLowerCase() !== selectedSeverity.toLowerCase()) return false;
      if (selectedPriority && adv.priority.toLowerCase() !== selectedPriority.toLowerCase()) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = adv.code.toLowerCase().includes(q);
        const matchCrop = adv.crop.toLowerCase().includes(q);
        const matchDisease = adv.disease.toLowerCase().includes(q);
        const matchSci = adv.scientificName.toLowerCase().includes(q);
        const matchChem = adv.effectivePesticide.toLowerCase().includes(q);
        if (!matchCode && !matchCrop && !matchDisease && !matchSci && !matchChem) return false;
      }
      return true;
    });
  }, [selectedCrop, selectedSeverity, selectedPriority, searchQuery]);

  const handleApplyToCaseManagement = (cropName: string, advCode: string) => {
    showToast(`Advisory ${advCode} directive linked to Case Management for ${cropName}.`);
    // Navigate directly to Case Management
    navigate('/case-management');
  };

  return (
    <div className="gov-advisories-page fade-in">
      {toastMsg && (
        <div className="gov-advisories-toast">
          <span>✅ {toastMsg}</span>
        </div>
      )}

      {/* ── Official Government Banner ── */}
      <div className="gov-advisories-banner">
        <div className="banner-left">
          <div className="banner-badge-icon">🏛️</div>
          <div>
            <h2>{t("Maharashtra State Agriculture Department — Technical Advisories & Directives")}</h2>
            <p>{t("Official ICAR, MPKV Rahuri & State Agriculture Technical Directives for Extension Officers and Field Specialists.")}</p>
          </div>
        </div>

        <button className="gov-broadcast-btn" onClick={() => showToast('Statewide Technical Circular Broadcasted to District Officers.')}>
          📢 {t("Broadcast Technical Circular")}
        </button>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="advisories-filter-bar">
        <div className="advisory-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t("Search by Directive Code, Disease, Crop, or Active Ingredient...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="advisory-filters-group">
          <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
            <option value="">🌾 {t("All Crops")}</option>
            {ALL_CROPS_LIST.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>

          <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)}>
            <option value="">⚠️ {t("All Severities")}</option>
            <option value="Severe">Severe Outbreak</option>
            <option value="Moderate">Moderate Severity</option>
            <option value="Low">Low Severity</option>
          </select>

          <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
            <option value="">📌 {t("All Priorities")}</option>
            <option value="Critical Outbreak">Critical Outbreak</option>
            <option value="High Priority">High Priority</option>
            <option value="Standard Protocol">Standard Protocol</option>
            <option value="Quarantine Alert">Quarantine Alert</option>
          </select>

          {(selectedCrop || selectedSeverity || selectedPriority || searchQuery) && (
            <button className="btn-reset-filters" onClick={() => {
              setSelectedCrop('');
              setSelectedSeverity('');
              setSelectedPriority('');
              setSearchQuery('');
            }}>
              {t("Reset")}
            </button>
          )}
        </div>
      </div>

      {/* ── Advisories List Grid ── */}
      <div className="gov-advisories-list">
        {filteredAdvisories.length === 0 ? (
          <div className="advisories-empty-card">
            ⚠️ {t("No technical advisories match the specified search parameters.")}
          </div>
        ) : (
          filteredAdvisories.map((adv) => {
            const matchingCount = liveCaseCounts[adv.crop] || 0;

            return (
              <div key={adv.id} className="advisory-directive-card">
                {/* Header Row */}
                <div className="card-directive-header">
                  <div className="header-left">
                    <span className="directive-code">{adv.code}</span>
                    <span className="crop-tag">🌾 {adv.crop}</span>
                    <h3 className="disease-title">{adv.disease}</h3>
                    <span className="sci-name">({adv.scientificName})</span>
                  </div>

                  <div className="header-badges">
                    <span className={`priority-badge pri-${adv.priority.toLowerCase().replace(/\s+/g, '-')}`}>
                      {adv.priority}
                    </span>
                    <span className={`severity-badge sev-${adv.severity.toLowerCase()}`}>
                      {adv.severity} Severity
                    </span>
                  </div>
                </div>

                {/* Hotspot Districts */}
                <div className="hotspots-banner-row">
                  <span className="hotspot-label">📍 {t("Monitored Outbreak Districts")}:</span>
                  <div className="hotspots-tags-group">
                    {adv.districtHotspots.map((dist) => (
                      <span key={dist} className="dist-chip">{dist}</span>
                    ))}
                  </div>
                </div>

                {/* 3-Column Technical Grid */}
                <div className="directive-details-grid">
                  {/* Field Diagnostic Symptoms */}
                  <div className="detail-box symptoms-box">
                    <h4>🔍 {t("Field Diagnostic Symptoms")}</h4>
                    <ul>
                      {adv.symptoms.map((symptom, idx) => (
                        <li key={idx}>{symptom}</li>
                      ))}
                    </ul>
                  </div>

                  {/* ICAR Approved Treatments */}
                  <div className="detail-box treatment-box">
                    <h4>🧪 {t("ICAR Approved Formulations & Dosage")}</h4>
                    <ul>
                      {adv.icarTreatment.map((treatment, idx) => (
                        <li key={idx}>{treatment}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Extension Protocol */}
                  <div className="detail-box protocol-box">
                    <h4>📋 {t("Extension Officer Field Protocols")}</h4>
                    <ul>
                      {adv.fieldVisitGuidance.map((protocol, idx) => (
                        <li key={idx}>{protocol}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Formulation & Biosecurity Note */}
                <div className="directive-formulation-row">
                  <div className="formulation-left">
                    <span className="form-label">💊 {t("Key Recommended Formulation")}:</span>
                    <strong className="form-val">{adv.effectivePesticide}</strong>
                  </div>
                  <div className="formulation-right">
                    <span>🛡️ <strong>{t("Safety Protocol")}:</strong> {adv.safetyInterval}</span>
                  </div>
                </div>

                {/* Footer Authority & Case Integration Bar */}
                <div className="card-directive-footer">
                  <div className="authority-text">
                    🏛️ <span>{t("Issuing Authority")}:</span> <strong>{adv.issuingAuthority}</strong>
                  </div>

                  <div className="footer-actions-group">
                    <button
                      className="btn-link-cases primary"
                      onClick={() => handleApplyToCaseManagement(adv.crop, adv.code)}
                    >
                      📋 {t("Apply to Case Management")} ({matchingCount} {t("Active Cases")})
                    </button>

                    <button
                      className="btn-link-cases secondary"
                      onClick={() => navigate('/crop-health')}
                    >
                      🛰️ {t("Inspect Satellite Telemetry")}
                    </button>

                    <button
                      className="btn-link-cases text"
                      onClick={() => showToast(`Issued directive notice for ${adv.code}`)}
                    >
                      📩 {t("Issue Circular")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GovAdvisoriesPage;
