import { useState } from 'react';
import './MaharashtraMap.css';
import { MAHARASHTRA_DISTRICTS } from '../services/govDataService';

const MaharashtraMap = () => {
  const [selectedDistrictId, setSelectedDistrictId] = useState('nashik');
  const activeDistrict = MAHARASHTRA_DISTRICTS.find(d => d.id === selectedDistrictId) || MAHARASHTRA_DISTRICTS[0];

  return (
    <div className="gov-card maha-map">
      <div className="gov-card-header">
        <h3 className="gov-card-title">Maharashtra Map - Cases</h3>
        <select 
          className="gov-map-select"
          value={selectedDistrictId}
          onChange={(e) => setSelectedDistrictId(e.target.value)}
        >
          {MAHARASHTRA_DISTRICTS.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div className="gov-map-container">
        <div className="gov-map-tooltip">
          <strong>{activeDistrict.name}</strong>
          <p>{activeDistrict.total.toLocaleString()} submissions</p>
          <p>{activeDistrict.needsVisit} needs visit</p>
          <p>{activeDistrict.unident} unidentified</p>
        </div>
        <div className="gov-map-placeholder">
          {/* Stylized representation of Maharashtra */}
          <svg viewBox="0 0 100 100" className="map-svg">
            <path d="M20,40 Q40,10 70,30 T90,70 Q70,90 40,80 T20,40" fill="#c6f6d5" stroke="#48bb78" strokeWidth="2" />
            <circle cx="30" cy="45" r="3" fill="#e53e3e" />
            <circle cx="50" cy="35" r="3" fill="#d69e2e" />
            <circle cx="65" cy="50" r="3" fill="#805ad5" />
            <circle cx="45" cy="65" r="3" fill="#38a169" />
            <circle cx="75" cy="40" r="3" fill="#e53e3e" />
          </svg>
        </div>
        <div className="gov-map-legend">
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
