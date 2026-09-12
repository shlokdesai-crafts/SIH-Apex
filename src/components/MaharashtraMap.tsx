import { useTranslation } from '../i18n/useTranslation';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MaharashtraMap.css';
interface MarkerData {
  id: number;
  farmer_name: string;
  location: string;
  latitude: number;
  longitude: number;
  crop: string;
  disease: string;
  severity: string;
  status: string;
  created_at: string;
}
const DEFAULT_MARKERS: MarkerData[] = [{
  id: 1,
  farmer_name: 'Suresh Patil',
  location: 'Nashik, Maharashtra',
  latitude: 19.9975,
  longitude: 73.7898,
  crop: 'Onion',
  disease: 'Thrips Infestation',
  severity: 'High',
  status: 'Pending',
  created_at: new Date().toISOString()
}, {
  id: 2,
  farmer_name: 'Anil Deshmukh',
  location: 'Akola, Maharashtra',
  latitude: 20.7002,
  longitude: 77.0082,
  crop: 'Cotton',
  disease: 'Bollworm',
  severity: 'Moderate',
  status: 'Assigned',
  created_at: new Date().toISOString()
}, {
  id: 3,
  farmer_name: 'Ramesh Kadam',
  location: 'Pune, Maharashtra',
  latitude: 18.5204,
  longitude: 73.8567,
  crop: 'Tomato',
  disease: 'Early Blight',
  severity: 'High',
  status: 'Pending',
  created_at: new Date().toISOString()
}, {
  id: 4,
  farmer_name: 'Vijay Shinde',
  location: 'Latur, Maharashtra',
  latitude: 18.4088,
  longitude: 76.5604,
  crop: 'Soybean',
  disease: 'Stem Rot',
  severity: 'Moderate',
  status: 'Assigned',
  created_at: new Date().toISOString()
}, {
  id: 5,
  farmer_name: 'Dnyaneshwar More',
  location: 'Kolhapur, Maharashtra',
  latitude: 16.7050,
  longitude: 74.2433,
  crop: 'Sugarcane',
  disease: 'Healthy Plant',
  severity: 'None',
  status: 'Resolved',
  created_at: new Date().toISOString()
}];
const getMarkerColor = (severity: string) => {
  const lowerSev = severity ? severity.toLowerCase() : '';
  if (lowerSev.includes('severe') || lowerSev.includes('high')) return '#e53e3e';
  if (lowerSev.includes('moderate')) return '#d69e2e';
  if (lowerSev.includes('mild') || lowerSev.includes('low') || lowerSev.includes('none')) return '#38a169';
  if (lowerSev.includes('unident') || lowerSev.includes('unable')) return '#805ad5';
  return '#3182ce';
};
const API = 'http://localhost:8000/api';
const MaharashtraMap = () => {
  const {
    t
  } = useTranslation();
  const [filter, setFilter] = useState('All Cases');
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  useEffect(() => {
    const fetchMarkers = () => {
      const url = filter === 'All Cases' ? `${API}/map-markers` : `${API}/map-markers?severity=${encodeURIComponent(filter)}`;
      fetch(url).then(res => res.json()).then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMarkers(data);
        }
      }).catch(err => console.error("Error fetching map markers", err));
    };
    fetchMarkers();
    const interval = setInterval(fetchMarkers, 10000);
    return () => clearInterval(interval);
  }, [filter]);
  const displayedMarkers = markers.length > 0 ? markers : DEFAULT_MARKERS.filter(m => {
    if (filter === 'High Issues') return m.severity === 'High';
    if (filter === 'Needs Visit') return m.status === 'Pending';
    return true;
  });
  return <div className="gov-card maha-map">
      <div className="gov-card-header">
        <h3 className="gov-card-title">{t("Maharashtra Map - Cases")}</h3>
        <select className="gov-map-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option>{t("All Cases")}</option>
          <option>{t("High Issues")}</option>
          <option>{t("Needs Visit")}</option>
        </select>
      </div>
      <div className="gov-map-container" style={{
      height: '350px',
      padding: 0,
      position: 'relative'
    }}>
        <MapContainer center={[19.7515, 75.7139]} zoom={6} style={{
        height: '100%',
        width: '100%',
        borderRadius: '8px',
        zIndex: 1
      }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {displayedMarkers.map(m => {
          const {
            t
          } = useTranslation();
          return <CircleMarker key={m.id} center={[m.latitude, m.longitude]} radius={8} fillColor={getMarkerColor(m.severity)} fillOpacity={0.8} color="#fff" weight={2}>
              <Popup>
                <div style={{
                fontSize: '13px'
              }}>
                  <strong>{m.farmer_name}</strong> ({m.location})<br />
                  <strong>{t("Crop:")}</strong> {m.crop}<br />
                  <strong>{t("Disease:")}</strong> {m.disease || 'Unknown'}<br />
                  <strong>{t("Severity:")}</strong> {m.severity}<br />
                  <strong>{t("Status:")}</strong> {m.status}
                </div>
              </Popup>
            </CircleMarker>;
        })}
        </MapContainer>
        
        <div className="gov-map-legend" style={{
        zIndex: 1000,
        bottom: '20px',
        right: '20px'
      }}>
          <div className="legend-item"><span className="dot high"></span>{t("High Issues")}</div>
          <div className="legend-item"><span className="dot moderate"></span>{t("Moderate Issues")}</div>
          <div className="legend-item"><span className="dot low"></span>{t("Low Issues")}</div>
          <div className="legend-item"><span className="dot unident"></span>{t("Unidentified (Needs Visit)")}</div>
        </div>
      </div>
    </div>;
};
export default MaharashtraMap;