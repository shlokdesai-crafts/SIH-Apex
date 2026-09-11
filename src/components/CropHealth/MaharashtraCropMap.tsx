import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MAHARASHTRA_DISTRICTS, type DistrictMetric } from '../../services/govDataService';
import { MAHARASHTRA_GEOJSON } from '../../data/maharashtraGeoJSON';

// Default Maharashtra Center & Bounds
const MH_CENTER: [number, number] = [19.45, 76.10];
const MH_BOUNDS: [[number, number], [number, number]] = [
  [15.4, 72.4],
  [22.2, 81.1],
];

interface MaharashtraCropMapProps {
  selectedDistrict: string;
  onSelectDistrict: (districtId: string) => void;
  onMarkerClick?: (district: DistrictMetric) => void;
}

// Helper component to handle flying/zooming on district selection
function MapController({ 
  selectedDistrict, 
  setMapInstance 
}: { 
  selectedDistrict: string; 
  setMapInstance: (map: L.Map) => void; 
}) {
  const map = useMap();

  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);

  useEffect(() => {
    if (!map) return;
    if (selectedDistrict === 'all') {
      map.flyTo(MH_CENTER, 6.8, { duration: 1.2 });
    } else {
      const dist = MAHARASHTRA_DISTRICTS.find(d => d.id === selectedDistrict);
      if (dist) {
        map.flyTo([dist.lat, dist.lng], 9.2, { duration: 1.2 });
      }
    }
  }, [selectedDistrict, map]);

  return null;
}

export default function MaharashtraCropMap({
  selectedDistrict,
  onSelectDistrict,
  onMarkerClick
}: MaharashtraCropMapProps) {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };

  const handleReset = () => {
    onSelectDistrict('all');
    if (mapInstance) mapInstance.flyTo(MH_CENTER, 6.8);
  };

  return (
    <div className="ch-map-container" style={{ position: 'relative', width: '100%', height: '230px' }}>
      {/* Zoom & Locate Controls */}
      <div className="ch-map-controls" style={{ zIndex: 1000 }}>
        <button 
          className="ch-map-btn" 
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom in"
        >
          +
        </button>
        <button 
          className="ch-map-btn" 
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      <button 
        className="ch-map-locate-btn"
        onClick={handleReset}
        title="Reset to Maharashtra"
        aria-label="Reset view"
        style={{ zIndex: 1000 }}
      >
        ⌖
      </button>

      {/* React Leaflet Map */}
      <MapContainer
        center={MH_CENTER}
        zoom={6.8}
        minZoom={6}
        maxZoom={12}
        maxBounds={MH_BOUNDS}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#eaf2ea', borderRadius: '10px' }}
      >
        {/* Clean, high-contrast CartoDB Voyager tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController 
          selectedDistrict={selectedDistrict} 
          setMapInstance={setMapInstance} 
        />

        {/* Real Maharashtra State Boundary Outline */}
        <GeoJSON
          data={MAHARASHTRA_GEOJSON}
          style={{
            fillColor: '#16a34a',
            fillOpacity: 0.08,
            color: '#15803d',
            weight: 2,
            dashArray: '4, 4',
          }}
        />

        {/* District Markers with Live Government Data */}
        {MAHARASHTRA_DISTRICTS.map((dist) => {
          const isSelected = selectedDistrict === 'all' || selectedDistrict === dist.id;
          const color = dist.status === 'healthy' 
            ? '#16a34a' 
            : dist.status === 'at-risk' 
              ? '#eab308' 
              : '#ef4444';

          return (
            <CircleMarker
              key={dist.id}
              center={[dist.lat, dist.lng]}
              radius={isSelected && selectedDistrict === dist.id ? 10 : 7}
              pathOptions={{
                fillColor: color,
                fillOpacity: isSelected ? 0.9 : 0.4,
                color: '#ffffff',
                weight: 2,
              }}
              eventHandlers={{
                click: () => {
                  onSelectDistrict(dist.id);
                  if (onMarkerClick) {
                    onMarkerClick(dist);
                  }
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                  {dist.name} ({dist.status.toUpperCase()})
                </div>
                <div style={{ fontSize: '10px', color: '#475569' }}>
                  {dist.topCrop} • {(dist.areaHa / 1000).toLocaleString()}k Ha • IMD: {dist.rainfallDeparturePct >= 0 ? `+${dist.rainfallDeparturePct}%` : `${dist.rainfallDeparturePct}%`}
                </div>
              </Tooltip>

              <Popup>
                <div style={{ padding: '4px', minWidth: '190px', fontFamily: 'sans-serif' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{dist.name}</strong>
                    <span 
                      style={{
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: color
                      }}
                    >
                      {dist.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', lineHeight: '1.45', color: '#334155' }}>
                    <div style={{ background: '#f8fafc', padding: '4px 6px', borderRadius: '4px', marginBottom: '4px' }}>
                      <div style={{ fontSize: '9px', color: '#15803d', fontWeight: 600 }}>OFFICIAL GOV DATA (DES & IMD)</div>
                      <div>Cultivated: <strong>{(dist.areaHa / 1000).toLocaleString()}k Ha</strong></div>
                      <div>Production: <strong>{(dist.productionTonnes / 1000).toLocaleString()}k Tonnes</strong></div>
                      <div>Rainfall Departure: <strong>{dist.rainfallDeparturePct >= 0 ? `+${dist.rainfallDeparturePct}%` : `${dist.rainfallDeparturePct}%`}</strong></div>
                    </div>
                    <div><strong>Primary Crop:</strong> {dist.topCrop}</div>
                    <div>Submissions: {dist.total.toLocaleString()} (Resolved: {dist.resolved})</div>
                    {dist.keyRiskFactor && (
                      <div style={{ marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '4px', color: '#991b1b', fontSize: '10px' }}>
                        <strong>Risk:</strong> {dist.keyRiskFactor}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="ch-map-legend-box" style={{ zIndex: 1000 }}>
        <div className="ch-map-legend-row">
          <span className="ch-legend-dot healthy" />
          <span>Healthy</span>
        </div>
        <div className="ch-map-legend-row">
          <span className="ch-legend-dot at-risk" />
          <span>At Risk</span>
        </div>
        <div className="ch-map-legend-row">
          <span className="ch-legend-dot diseased" />
          <span>Diseased</span>
        </div>
      </div>
    </div>
  );
}
