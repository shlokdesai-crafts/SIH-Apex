import { useTranslation } from '../i18n/useTranslation';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
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
  severity?: string | null;
  status: string;
  assigned_officer?: string | null;
  resolution_notes?: string | null;
  created_at: string;
}

const API = '/api';

const getMarkerColor = (severity?: string | null, status?: string) => {
  const sStatus = (status || '').toLowerCase();
  if (sStatus === 'resolved') return '#10b981'; // green
  if (sStatus === 'unidentified' || sStatus.includes('unidentified')) return '#8b5cf6'; // purple

  const lowerSev = severity ? severity.toLowerCase() : '';
  if (lowerSev.includes('severe') || lowerSev.includes('high')) return '#ef4444'; // red
  if (lowerSev.includes('moderate') || lowerSev.includes('medium')) return '#f59e0b'; // orange
  return '#3b82f6'; // blue
};

const MaharashtraMap = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('All Cases');
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<MarkerData | null>(null);

  useEffect(() => {
    const fetchMarkers = () => {
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
    };

    fetchMarkers();
    const interval = setInterval(fetchMarkers, 10000);
    return () => clearInterval(interval);
  }, [filter]);

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
          </select>
        </div>
      </div>

      <div
        className="gov-map-container"
        style={{
          height: '380px',
          padding: 0,
          position: 'relative',
        }}
      >
        {loading && markers.length === 0 && (
          <div className="gov-map-loader">
            <p>{t("Loading official map records...")}</p>
          </div>
        )}

        <MapContainer
          center={[19.7515, 75.7139]}
          zoom={6}
          style={{
            height: '100%',
            width: '100%',
            borderRadius: '8px',
            zIndex: 1,
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {markers.map((m) => (
            <CircleMarker
              key={m.id}
              center={[m.latitude, m.longitude]}
              radius={9}
              fillColor={getMarkerColor(m.severity, m.status)}
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
                    🧪 <strong>{t("Diagnosis:")}</strong> {m.disease || 'Pending Review'}
                  </div>
                  <div>
                    ⚠️ <strong>{t("Severity:")}</strong> {m.severity || 'Medium'}
                  </div>
                  <div>
                    📌 <strong>{t("Status:")}</strong>{' '}
                    <span style={{ fontWeight: 700, color: getMarkerColor(m.severity, m.status) }}>
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
            <span className="dot low" /> {t("Resolved / Healthy")}
          </div>
          <div className="legend-item">
            <span className="dot unident" /> {t("Unidentified")}
          </div>
        </div>
      </div>

      {/* Case Details Drawer Modal */}
      {selectedCase && (
        <div className="gov-modal-overlay">
          <div className="gov-modal-content">
            <h4>📋 {t("Official Case Details")}</h4>
            <p className="sub">
              Case #{selectedCase.id.substring(selectedCase.id.length - 6).toUpperCase()}
            </p>

            <div className="case-detail-rows">
              <div>
                <strong>{t("Farmer Name")}:</strong> {selectedCase.farmer_name}
              </div>
              <div>
                <strong>{t("District Location")}:</strong> 📍 {selectedCase.location}
              </div>
              <div>
                <strong>{t("GPS Coordinates")}:</strong> {selectedCase.latitude.toFixed(4)}, {selectedCase.longitude.toFixed(4)}
              </div>
              <div>
                <strong>{t("Crop Species")}:</strong> 🌾 {selectedCase.crop}
              </div>
              <div>
                <strong>{t("AI Diagnosis")}:</strong> 🧪 {selectedCase.disease || 'Pending Review'}
              </div>
              <div>
                <strong>{t("Severity")}:</strong> {selectedCase.severity || 'Medium'}
              </div>
              <div>
                <strong>{t("Status")}:</strong> {selectedCase.status}
              </div>
              {selectedCase.assigned_officer && (
                <div>
                  <strong>{t("Assigned Officer")}:</strong> 👤 {selectedCase.assigned_officer}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '18px' }}>
              <button className="btn-cancel" onClick={() => setSelectedCase(null)}>
                {t("Close Details")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaharashtraMap;
