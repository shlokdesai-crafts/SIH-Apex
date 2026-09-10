import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import type { Language } from '../i18n/translations';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { ScanResultData } from '../pages/Dashboard';
import type { LocationResult } from '../services/locationService';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface PanelsRowProps {
  scanResult?: ScanResultData | null;
  locationData?: LocationResult | null;
  setActiveTab?: (tab: string) => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15);
  }, [center, map]);
  return null;
}

export default function PanelsRow({ scanResult, locationData, setActiveTab }: PanelsRowProps = {}) {
  const [activeMapTab, setActiveMapTab] = useState('fields');
  const [micActive, setMicActive] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const handleScanClick = () => {
    if (setActiveTab) {
      setActiveTab('scan');
      window.scrollTo(0, 0);
    } else {
      alert(t('panels.scanAlert'));
    }
  };

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };

  const hasRisk = scanResult && scanResult.severity !== 'Low' && scanResult.severity !== 'Verified' && scanResult.severity !== 'None';
  
  // Show toast if high risk is detected
  const [toastVisible, setToastVisible] = useState(false);
  useEffect(() => {
    if (hasRisk && locationData) {
      setToastVisible(true);
      const timer = setTimeout(() => setToastVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [hasRisk, locationData]);

  // Default to Maharashtra if no location
  const center: [number, number] = locationData ? [locationData.lat, locationData.lng] : [19.7515, 75.7139];

  // Wire voice language buttons to the global language context
  const handleVoiceLangClick = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <section className="panels-row" id="panels-row">
      {/* Scan Crop Panel */}
      <div className="panel scan-panel" id="scan-panel">
        <div className="panel-header-row">
          <div className="scan-cam-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
          </div>
          <div className="scan-header-text">
            <h2 className="panel-title">{t('panels.scanCrop')}</h2>
            <p className="panel-subtitle">{t('panels.scanSubtitle')}</p>
          </div>
        </div>
        <div className="scan-images-row">
          <div className="scan-img-wrap"><img src="images/crop_leaf1.jpg" alt="Crop leaf disease 1" className="scan-thumb" /></div>
          <div className="scan-img-wrap"><img src="images/crop_leaf2.jpg" alt="Crop leaf disease 2" className="scan-thumb" /></div>
          <div className="scan-img-wrap"><img src="images/crop_leaf3.jpg" alt="Crop leaf disease 3" className="scan-thumb" /></div>
        </div>
        <button className="scan-btn" id="scan-crop-btn" onClick={handleScanClick}>
          {t('panels.scanBtn')}
        </button>
      </div>

      {/* Field Map & Risk Zones Panel */}
      <div className="panel map-panel" id="map-panel">
        <div className="map-panel-header">
          <h2 className="panel-title">{t('panels.fieldMap')}</h2>
          <a href="#" className="view-full-map" id="view-full-map-btn">{t('panels.viewFullMap')}</a>
        </div>
        <div className="map-tabs">
          <button className={`map-tab ${activeMapTab === 'fields' ? 'active' : ''}`} onClick={() => setActiveMapTab('fields')}>{t('panels.myFields')}</button>
          <button className={`map-tab ${activeMapTab === 'satellite' ? 'active' : ''}`} onClick={() => setActiveMapTab('satellite')}>{t('panels.satelliteView')}</button>
        </div>
        <div className="map-container" id="map-container" style={{ position: 'relative' }}>
          <MapContainer
            center={center}
            zoom={locationData ? 15 : 6}
            zoomControl={false}
            scrollWheelZoom={true}
            ref={setMapInstance}
            style={{ width: '100%', height: '100%', borderRadius: '8px', zIndex: 0 }}
          >
            {activeMapTab === 'satellite' ? (
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            ) : (
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}
            
            <MapUpdater center={center} />
            
            {/* User's Field */}
            <Polygon
              positions={[
                [center[0] - 0.002, center[1] - 0.002],
                [center[0] + 0.002, center[1] - 0.002],
                [center[0] + 0.002, center[1] + 0.002],
                [center[0] - 0.002, center[1] + 0.002],
              ]}
              pathOptions={{
                fillColor: hasRisk ? '#d32f2f' : '#388e3c',
                color: hasRisk ? '#b71c1c' : '#1b5e20',
                fillOpacity: 0.5,
                weight: 2
              }}
            >
              <Popup>
                <strong>{scanResult?.crop || 'Your Crop'}</strong><br />
                {hasRisk ? (
                  <>
                    Disease: {scanResult?.disease}<br />
                    Severity: {scanResult?.severity}<br />
                    <span style={{color: 'red'}}>High Risk of Spread!</span>
                  </>
                ) : (
                  <span style={{color: 'green'}}>Healthy Field</span>
                )}
              </Popup>
            </Polygon>

            {/* Nearby Neighbor 1 */}
            <Polygon
              positions={[
                [center[0] - 0.002, center[1] + 0.0025],
                [center[0] + 0.003, center[1] + 0.0025],
                [center[0] + 0.003, center[1] + 0.005],
                [center[0] - 0.002, center[1] + 0.005],
              ]}
              pathOptions={{
                fillColor: hasRisk ? '#d32f2f' : '#388e3c', // Turns red if user has risk (spread)
                color: hasRisk ? '#b71c1c' : '#1b5e20',
                fillOpacity: 0.5,
                weight: 2
              }}
            >
              <Popup>
                <strong>Neighbor Farm 1</strong><br />
                {hasRisk ? <span style={{color: 'red'}}>Alerted: At Risk!</span> : <span style={{color: 'green'}}>Safe</span>}
              </Popup>
            </Polygon>

            {/* Nearby Neighbor 2 */}
            <Polygon
              positions={[
                [center[0] - 0.005, center[1] - 0.002],
                [center[0] - 0.0025, center[1] - 0.002],
                [center[0] - 0.0025, center[1] + 0.004],
                [center[0] - 0.005, center[1] + 0.004],
              ]}
              pathOptions={{
                fillColor: hasRisk ? '#fbc02d' : '#388e3c', // Turns yellow (moderate risk)
                color: hasRisk ? '#f57f17' : '#1b5e20',
                fillOpacity: 0.5,
                weight: 2
              }}
            >
              <Popup>
                <strong>Neighbor Farm 2</strong><br />
                {hasRisk ? <span style={{color: '#f57f17'}}>Alerted: Moderate Risk</span> : <span style={{color: 'green'}}>Safe</span>}
              </Popup>
            </Polygon>
            
          </MapContainer>

          {hasRisk && locationData && (
            <div className="map-label high-risk-label" id="field1-label" style={{ position: 'absolute', top: '40%', left: '45%', zIndex: 10 }}>
              <span>{scanResult?.crop || 'Crop'} Field</span><br />
              <span>High Risk - {scanResult?.disease}</span>
            </div>
          )}
          
          <div className="map-controls" id="map-controls" style={{ zIndex: 10 }}>
            <button className="map-ctrl-btn" aria-label="Zoom in" onClick={handleZoomIn}>+</button>
            <button className="map-ctrl-btn" aria-label="Zoom out" onClick={handleZoomOut}>−</button>
            <button className="map-ctrl-btn" aria-label="Locate" onClick={() => mapInstance?.flyTo(center, 15)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2h-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06z" />
              </svg>
            </button>
          </div>
          <div className="map-info-bar" id="map-info-bar" style={{ zIndex: 10, background: 'rgba(255,255,255,0.9)' }}>
            <strong>{locationData ? `${scanResult?.crop || 'Farm'} in ${locationData.district}` : t('panels.field1Cotton')}</strong>
            <span>{hasRisk ? `Alert: ${scanResult?.disease} detected!` : t('panels.fieldInfo')}</span>
          </div>

          {toastVisible && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#d32f2f',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              zIndex: 1000,
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 'bold'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              Alert broadcasted to nearby farmers about High Risk {scanResult?.disease}!
            </div>
          )}
        </div>
      </div>

      {/* AI Voice Assistant Panel */}
      <div className="panel voice-panel" id="voice-panel">
        <div className="voice-panel-header">
          <div className="voice-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <div className="voice-header-text">
            <h2 className="panel-title">{t('panels.aiVoice')}</h2>
            <p className="panel-subtitle">{t('panels.voiceSubtitle')}</p>
          </div>
        </div>

        <div className="voice-waveform-area" id="voice-waveform">
          <div className="voice-wave-bars">
            <span className="wave-bar" style={{ height: '14px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '22px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '32px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '18px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '10px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
          </div>
          <button 
            className="mic-btn" 
            id="mic-btn" 
            aria-label="Speak"
            onClick={() => setMicActive(!micActive)}
            style={{ background: micActive ? 'linear-gradient(135deg, #c62828, #e53935)' : 'linear-gradient(135deg, #7c3aed, #9c27b0)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
          <div className="voice-wave-bars">
            <span className="wave-bar" style={{ height: '10px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '18px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '32px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '22px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '14px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
          </div>
        </div>

        <div className="voice-query-text" id="voice-query">
          {t('panels.voiceQuery')}
        </div>

        <div className="voice-lang-btns" id="voice-lang-btns">
          <button className={`lang-select-btn ${language === 'mr' ? 'active' : ''}`} onClick={() => handleVoiceLangClick('mr')}>{t('lang.marathi')}</button>
          <button className={`lang-select-btn ${language === 'hi' ? 'active' : ''}`} onClick={() => handleVoiceLangClick('hi')}>{t('lang.hindi')}</button>
          <button className={`lang-select-btn ${language === 'en' ? 'active' : ''}`} onClick={() => handleVoiceLangClick('en')}>{t('lang.english')}</button>
        </div>

        <div className="voice-tap-hint" id="voice-tap-hint">{t('panels.tapToSpeak')}</div>
      </div>
    </section>
  );
}
