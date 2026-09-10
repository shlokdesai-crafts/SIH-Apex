import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import type { Language } from '../i18n/translations';

export default function PanelsRow() {
  const [activeMapTab, setActiveMapTab] = useState('fields');
  const [micActive, setMicActive] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  const handleScanClick = () => {
    alert(t('panels.scanAlert'));
  };

  const handleZoomIn = () => console.log('Zoom in');
  const handleZoomOut = () => console.log('Zoom out');

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
        <div className="map-container" id="map-container">
          <img src="images/field_map.jpg" alt="Field map with risk zones" className="map-img" id="map-img" />
          <div className="map-label high-risk-label" id="field1-label">
            <span>{t('panels.field1')}</span><br /><span>{t('panels.highRisk')}</span>
          </div>
          <div className="map-controls" id="map-controls">
            <button className="map-ctrl-btn" aria-label="Zoom in" onClick={handleZoomIn}>+</button>
            <button className="map-ctrl-btn" aria-label="Zoom out" onClick={handleZoomOut}>−</button>
            <button className="map-ctrl-btn" aria-label="Locate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06z" />
              </svg>
            </button>
          </div>
          <div className="map-info-bar" id="map-info-bar">
            <strong>{t('panels.field1Cotton')}</strong>
            <span>{t('panels.fieldInfo')}</span>
          </div>
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
