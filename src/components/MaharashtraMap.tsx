import { useTranslation } from '../i18n/useTranslation';
import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MaharashtraMap.css';

interface MarkerData {
  id: string;
  farmer_name: string;
  location: string;
  latitude: number;
  longitude: number;
  crop: string;
  disease?: string | null;
  ai_result?: string | null;
  confidence?: number | null;
  severity?: string | null;
  status: string;
  assigned_officer?: string | null;
  resolution_notes?: string | null;
  created_at: string;
}

interface Officer {
  id: string;
  name: string;
  role: string;
  district: string;
}

const API = '/api';

const MapResizer = () => {
  const map = useMap();

  useEffect(() => {
    const triggerInvalidate = () => {
      if (map) {
        map.invalidateSize();
      }
    };

    triggerInvalidate();
    const t1 = setTimeout(triggerInvalidate, 100);
    const t2 = setTimeout(triggerInvalidate, 400);
    const t3 = setTimeout(triggerInvalidate, 1000);

    window.addEventListener('resize', triggerInvalidate);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', triggerInvalidate);
    };
  }, [map]);

  return null;
};

const getMarkerColor = (severity?: string | null, status?: string, disease?: string | null) => {
  const sStatus = (status || '').toLowerCase();
  const lowerDis = (disease || '').toLowerCase();

  if (sStatus === 'resolved') return '#10b981'; // green
  if (sStatus === 'unidentified' || lowerDis.includes('unidentified')) return '#8b5cf6'; // purple

  const lowerSev = severity ? severity.toLowerCase() : '';
  if (lowerSev.includes('severe') || lowerSev.includes('high')) return '#ef4444'; // red
  if (lowerSev.includes('moderate') || lowerSev.includes('medium')) return '#f59e0b'; // orange
  return '#3b82f6'; // blue
};

const formatConfidence = (conf?: number | null) => {
  if (conf === undefined || conf === null) return 'N/A';
  const val = conf > 1 ? conf : conf * 100;
  return `${Math.round(val)}%`;
};

const MaharashtraMap = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('All Cases');
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<MarkerData | null>(null);

  // Sub-modals for map actions
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [assigningCase, setAssigningCase] = useState<MarkerData | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('');
  const [reviewCase, setReviewCase] = useState<MarkerData | null>(null);
  const [expertDiagnosis, setExpertDiagnosis] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchMarkers = useCallback(() => {
    setLoading(true);
    const url =
      filter === 'All Cases'
        ? `${API}/map-markers`
        : `${API}/map-markers?severity=${encodeURIComponent(filter)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMarkers(data);
        } else {
          setMarkers([]);
        }
      })
      .catch((err) => console.error('Error fetching map markers:', err))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchMarkers();
    fetch(`${API}/field-officers`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOfficers(data);
      })
      .catch(() => {});

    const handleUpdate = () => fetchMarkers();
    window.addEventListener('gov-data-updated', handleUpdate);
    const interval = setInterval(fetchMarkers, 10000);
    return () => {
      window.removeEventListener('gov-data-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [fetchMarkers]);

  const handleConfirmAssign = async () => {
    if (!assigningCase || !selectedOfficer) return;
    setActionLoading(true);
    try {
      await fetch(`${API}/submissions/${assigningCase.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_officer: selectedOfficer }),
      });
      setAssigningCase(null);
      if (selectedCase && selectedCase.id === assigningCase.id) {
        setSelectedCase((prev) => (prev ? { ...prev, status: 'Assigned', assigned_officer: selectedOfficer } : null));
      }
      window.dispatchEvent(new CustomEvent('gov-data-updated'));
      fetchMarkers();
    } catch (e) {
      console.error('Error assigning officer:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDiagnosis = async () => {
    if (!reviewCase || !expertDiagnosis.trim()) return;
    setActionLoading(true);
    try {
      await fetch(`${API}/submissions/${reviewCase.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease: expertDiagnosis.trim(),
          ai_result: expertDiagnosis.trim(),
          status: 'Assigned',
        }),
      });
      setReviewCase(null);
      if (selectedCase && selectedCase.id === reviewCase.id) {
        setSelectedCase((prev) =>
          prev ? { ...prev, disease: expertDiagnosis.trim(), ai_result: expertDiagnosis.trim(), status: 'Assigned' } : null
        );
      }
      window.dispatchEvent(new CustomEvent('gov-data-updated'));
      fetchMarkers();
    } catch (e) {
      console.error('Error updating diagnosis:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveCase = async (caseId: string) => {
    setActionLoading(true);
    try {
      await fetch(`${API}/submissions/${caseId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes: 'Diagnosed and resolved by District Agriculture Officer' }),
      });
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase((prev) => (prev ? { ...prev, status: 'Resolved' } : null));
      }
      window.dispatchEvent(new CustomEvent('gov-data-updated'));
      fetchMarkers();
    } catch (e) {
      console.error('Error resolving case:', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="gov-card maha-map">
      <div className="gov-card-header">
        <h3 className="gov-card-title">{t("Maharashtra Map - Field Intelligence")}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="gov-map-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All Cases">{t("All Active Cases")}</option>
            <option value="High Issues">{t("Severe Outbreaks")}</option>

            <option value="Needs Visit">{t("Needs Field Visit")}</option>
            <option value="Unidentified">{t("Unidentified Cases")}</option>
            <option value="Resolved">{t("Resolved Cases")}</option>
          </select>
        </div>
      </div>

      <div className="gov-map-container">
        {loading && markers.length === 0 && (
          <div className="gov-map-loader">
            <p>{t("Loading official map records...")}</p>
          </div>
        )}

        <MapContainer
          center={[19.65, 75.8]}
          zoom={7}
          zoomControl={true}
          scrollWheelZoom={false}
          style={{
            height: '100%',
            width: '100%',
            borderRadius: '8px',
            zIndex: 1,
          }}
        >
          <MapResizer />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {markers.map((m) => (
            <CircleMarker
              key={m.id}
              center={[m.latitude, m.longitude]}
              radius={9}
              fillColor={getMarkerColor(m.severity, m.status, m.disease)}
              fillOpacity={0.85}
              color="#ffffff"
              weight={2}
            >
              <Popup>
                <div style={{ fontSize: '12.5px', lineHeight: '1.4' }}>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{m.farmer_name}</strong>
                  <div style={{ color: '#64748b' }}>📍 {m.location}</div>
                  <div style={{ margin: '4px 0 2px 0' }}>
                    🌾 <strong>{t("Crop:")}</strong> {m.crop}
                  </div>
                  <div>
                    🧪 <strong>{t("Diagnosis:")}</strong> {m.disease || m.ai_result || 'Pending Review'}
                  </div>
                  <div>
                    📊 <strong>{t("Confidence:")}</strong> {formatConfidence(m.confidence)}
                  </div>
                  <div>
                    ⚠️ <strong>{t("Severity:")}</strong> {m.severity || 'Medium'}
                  </div>
                  <div>
                    📌 <strong>{t("Status:")}</strong>{' '}
                    <span style={{ fontWeight: 700, color: getMarkerColor(m.severity, m.status, m.disease) }}>
                      {m.status}
                    </span>
                  </div>
                  {m.assigned_officer && (
                    <div>
                      👤 <strong>{t("Officer:")}</strong> {m.assigned_officer}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedCase(m)}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      background: '#064e3b',
                      color: '#fff',
                      border: 'none',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {t("View Full Case Details")}
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <div
          className="gov-map-legend"
          style={{
            zIndex: 1000,
            bottom: '16px',
            right: '16px',
          }}
        >
          <div className="legend-item">
            <span className="dot high" /> {t("Severe Outbreak")}
          </div>
          <div className="legend-item">
            <span className="dot moderate" /> {t("Moderate Issue")}
          </div>
          <div className="legend-item">
            <span className="dot pending" /> {t("Field Visit Needed")}
          </div>
          <div className="legend-item">
            <span className="dot unident" /> {t("Unidentified Case")}
          </div>
          <div className="legend-item">
            <span className="dot low" /> {t("Resolved / Healthy")}
          </div>
        </div>
      </div>

      {/* Case Details Drawer Modal */}
      {selectedCase && (
        <div className="gov-modal-overlay">
          <div className="gov-modal-content">
            <h4>📋 {t("Official Case Details")}</h4>
            <p className="sub">
              Case #{selectedCase.id.length > 8 ? selectedCase.id.substring(selectedCase.id.length - 6).toUpperCase() : selectedCase.id}
            </p>

            <div className="case-detail-grid">
              <div className="case-detail-item">
                <strong>{t("Farmer Name")}</strong>
                <span>{selectedCase.farmer_name}</span>
              </div>
              <div className="case-detail-item">
                <strong>{t("District Location")}</strong>
                <span>📍 {selectedCase.location}</span>
              </div>
              <div className="case-detail-item">
                <strong>{t("GPS Coordinates")}</strong>
                <span>{selectedCase.latitude.toFixed(4)}, {selectedCase.longitude.toFixed(4)}</span>
              </div>
              <div className="case-detail-item">
                <strong>{t("Crop Species")}</strong>
                <span>🌾 {selectedCase.crop}</span>
              </div>
              <div className="case-detail-item">
                <strong>{t("AI Diagnosis")}</strong>
                <span>🧪 {selectedCase.disease || selectedCase.ai_result || 'Pending Review'}</span>
              </div>
              <div className="case-detail-item">
                <strong>{t("AI Confidence")}</strong>
                <span>📊 {formatConfidence(selectedCase.confidence)}</span>
              </div>
              <div className="case-detail-item">
                <strong>{t("Severity")}</strong>
                <span>⚠️ {selectedCase.severity || 'Medium'}</span>
              </div>
              <div className="case-detail-item">
                <strong>{t("Status")}</strong>
                <span style={{ color: getMarkerColor(selectedCase.severity, selectedCase.status, selectedCase.disease), fontWeight: 700 }}>
                  {selectedCase.status}
                </span>
              </div>
              {selectedCase.assigned_officer && (
                <div className="case-detail-item" style={{ gridColumn: 'span 2' }}>
                  <strong>{t("Assigned Officer")}</strong>
                  <span>👤 {selectedCase.assigned_officer}</span>
                </div>
              )}
              {selectedCase.resolution_notes && (
                <div className="case-detail-item" style={{ gridColumn: 'span 2' }}>
                  <strong>{t("Resolution Notes")}</strong>
                  <span>📝 {selectedCase.resolution_notes}</span>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '18px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn-confirm"
                onClick={() => {
                  setReviewCase(selectedCase);
                  setExpertDiagnosis(selectedCase.disease && !selectedCase.disease.toLowerCase().includes('unidentified') ? selectedCase.disease : 'Fungal Leaf Spot');
                }}
              >
                🔬 {t("Review/Identify")}
              </button>

              <button
                className="btn-confirm secondary"
                onClick={() => {
                  setAssigningCase(selectedCase);
                  setSelectedOfficer(officers[0]?.name || 'Rajesh Patil');
                }}
              >
                👤 {t("Assign Officer")}
              </button>

              {selectedCase.status !== 'Resolved' && (
                <button
                  className="btn-confirm"
                  style={{ background: '#10b981' }}
                  onClick={() => handleResolveCase(selectedCase.id)}
                  disabled={actionLoading}
                >
                  ✅ {t("Resolve Case")}
                </button>
              )}

              <button className="btn-cancel" onClick={() => setSelectedCase(null)}>
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Identify Disease Modal */}
      {reviewCase && (
        <div className="gov-modal-overlay">
          <div className="gov-modal-content">
            <h4>🔬 {t("Agronomist Expert Disease Diagnosis")}</h4>
            <p>
              Case #{reviewCase.id.length > 8 ? reviewCase.id.substring(reviewCase.id.length - 6).toUpperCase() : reviewCase.id} — {reviewCase.farmer_name} ({reviewCase.crop})
            </p>

            <div className="modal-field">
              <label>{t("Verified Disease Diagnosis")}:</label>
              <input
                type="text"
                value={expertDiagnosis}
                onChange={(e) => setExpertDiagnosis(e.target.value)}
                placeholder="e.g. Red Rot Disease, Early Blight, Yellow Mosaic Virus..."
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setReviewCase(null)}>
                {t("Cancel")}
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirmDiagnosis}
                disabled={actionLoading || !expertDiagnosis.trim()}
              >
                {actionLoading ? t("Saving...") : t("Save Diagnosis")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Officer Modal */}
      {assigningCase && (
        <div className="gov-modal-overlay">
          <div className="gov-modal-content">
            <h4>👤 {t("Assign Field Extension Officer")}</h4>
            <p>
              Case #{assigningCase.id.length > 8 ? assigningCase.id.substring(assigningCase.id.length - 6).toUpperCase() : assigningCase.id} — {assigningCase.farmer_name} ({assigningCase.crop})
            </p>

            <div className="modal-field">
              <label>{t("Select Extension Officer")}:</label>
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
              >
                {officers.map((off) => (
                  <option key={off.id} value={off.name}>
                    {off.name} ({off.role} - {off.district})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setAssigningCase(null)}>
                {t("Cancel")}
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirmAssign}
                disabled={actionLoading}
              >
                {actionLoading ? t("Assigning...") : t("Confirm Assignment")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaharashtraMap;

