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
  const [filter, setFilter] = useState('All Cases');
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  useEffect(() => {
    const fetchMarkers = () => {
      const url = filter === 'All Cases' ? `${API}/map-markers` : `${API}/map-markers?severity=${encodeURIComponent(filter)}`;
      fetch(url)
        .then(res => res.json())
        .then(data => setMarkers(data))
        .catch(err => console.error("Error fetching map markers", err));
    };

    fetchMarkers();
    const interval = setInterval(fetchMarkers, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  return (
    <div className="gov-card maha-map">
      <div className="gov-card-header">
        <h3 className="gov-card-title">Maharashtra Map - Cases</h3>
        <select className="gov-map-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All Cases</option>
          <option>High Issues</option>
          <option>Needs Visit</option>
        </select>
      </div>
      <div className="gov-map-container" style={{ height: '350px', padding: 0, position: 'relative' }}>
        <MapContainer center={[19.7515, 75.7139]} zoom={6} style={{ height: '100%', width: '100%', borderRadius: '8px', zIndex: 1 }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((m) => (
            <CircleMarker 
              key={m.id} 
              center={[m.latitude, m.longitude]} 
              radius={8}
              fillColor={getMarkerColor(m.severity)}
              fillOpacity={0.8}
              color="#fff"
              weight={2}
            >
              <Popup>
                <div style={{ fontSize: '13px' }}>
                  <strong>{m.farmer_name}</strong> ({m.location})<br/>
                  <strong>Crop:</strong> {m.crop}<br/>
                  <strong>Disease:</strong> {m.disease || 'Unknown'}<br/>
                  <strong>Severity:</strong> {m.severity}<br/>
                  <strong>Status:</strong> {m.status}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        
        <div className="gov-map-legend" style={{ zIndex: 1000, bottom: '20px', right: '20px' }}>
          <div className="legend-item"><span className="dot high"></span> High Issues</div>
          <div className="legend-item"><span className="dot moderate"></span> Moderate Issues</div>
          <div className="legend-item"><span className="dot low"></span> Low Issues</div>
          <div className="legend-item"><span className="dot unident"></span> Unidentified (Needs Visit)</div>
        </div>
      </div>
    </div>
  );
};

export default MaharashtraMap;
