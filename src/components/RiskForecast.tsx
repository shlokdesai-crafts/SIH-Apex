import { useState } from 'react';
import './RiskForecast.css';
import type { WeatherData } from '../services/weatherService';
import type { LocationResult } from '../services/locationService';
import { useFarm } from '../context/FarmContext';
import type { ScanResultData } from '../pages/Dashboard';

interface RiskForecastProps {
  weatherData?: WeatherData | null;
  locationData?: LocationResult | null;
  scanResult?: ScanResultData | null;
}

export default function RiskForecast({ weatherData, locationData, scanResult }: RiskForecastProps = {}) {
  const { farmState } = useFarm();
  const [selectedCrop, setSelectedCrop] = useState(scanResult?.crop || 'Cotton');

  // Dynamic farm-connected crop data
  const baseCrops: Record<string, any> = {
    Cotton: {
      stage: 'Flowering',
      overallRisk: 'Moderate',
      riskClass: 'moderate',
      trend: '↑',
      riskDesc: 'Bollworm risk increasing in next 3 days',
      confidence: 82,
      weatherImpact: 'Impact on Cotton (Flowering Stage)'
    },
    Soybean: {
      stage: 'Pod Development',
      overallRisk: 'Low',
      riskClass: 'low',
      trend: '↓',
      riskDesc: 'Favorable conditions, low disease risk',
      confidence: 90,
      weatherImpact: 'Impact on Soybean (Pod Development)'
    },
    Tomato: {
      stage: 'Fruiting',
      overallRisk: 'High',
      riskClass: 'high',
      trend: '↑',
      riskDesc: 'Early Blight risk elevated due to warm humidity',
      confidence: 92,
      weatherImpact: 'Foliar disease risk elevated in current climate'
    },
    Onion: {
      stage: 'Bulb Formation',
      overallRisk: 'Low',
      riskClass: 'low',
      trend: '↓',
      riskDesc: 'Favorable conditions, healthy bulb formation',
      confidence: 88,
      weatherImpact: 'Minimal weather-induced risk observed'
    },
    Potato: {
      stage: 'Tuber Bulking',
      overallRisk: 'Moderate',
      riskClass: 'moderate',
      trend: '↑',
      riskDesc: 'Late Blight watch: monitor lower canopy',
      confidence: 84,
      weatherImpact: 'Soil moisture favorable but requires canopy inspection'
    },
    Sugarcane: {
      stage: 'Tillering',
      overallRisk: 'High',
      riskClass: 'high',
      trend: '↑',
      riskDesc: 'Red rot risk increasing due to humidity',
      confidence: 75,
      weatherImpact: 'Impact on Sugarcane (Tillering)'
    }
  };

  // Overlay real scan data from farmState
  const cropData = { ...baseCrops };
  if (farmState && farmState.crops) {
    farmState.crops.forEach(fc => {
      const isDiseased = fc.status === 'Diseased';
      const isAtRisk = fc.status === 'At Risk';
      cropData[fc.name] = {
        stage: cropData[fc.name]?.stage || 'Vegetative',
        overallRisk: isDiseased ? 'High' : isAtRisk ? 'Moderate' : 'Low',
        riskClass: isDiseased ? 'high' : isAtRisk ? 'moderate' : 'low',
        trend: isDiseased ? '↑' : isAtRisk ? '↑' : '↓',
        riskDesc: fc.detectedDisease 
          ? `${fc.detectedDisease} detected in recent scan` 
          : isDiseased 
          ? 'Active disease symptoms detected' 
          : 'Normal growing conditions',
        confidence: isDiseased ? 92 : 88,
        weatherImpact: isDiseased 
          ? 'Disease spore proliferation alert in humid canopy' 
          : `Monitored on ${fc.areaHa} Ha field`
      };
    });
  }

  const currentData = cropData[selectedCrop] || cropData['Cotton'];

  // Calculate dynamic weather risk based on real weatherData
  let weatherRiskLevel = 'Moderate';
  let weatherRiskClass = 'mod';
  let weatherRiskText = 'Normal weather conditions expected';
  
  if (weatherData) {
    const highHumidityDays = weatherData.daily?.filter((_, i) => i < 3 && weatherData.humidity > 75).length || 0;
    const rainyDays = weatherData.daily?.filter((d, i) => i < 3 && d.precipitation > 5).length || 0;
    
    if (rainyDays > 0 && highHumidityDays > 0) {
      weatherRiskLevel = 'High';
      weatherRiskClass = 'high';
      weatherRiskText = 'High humidity and rain expected in next 3 days';
    } else if (highHumidityDays > 0) {
      weatherRiskLevel = 'High';
      weatherRiskClass = 'high';
      weatherRiskText = 'High humidity expected in next 3 days';
    } else if (rainyDays > 0) {
      weatherRiskLevel = 'Moderate';
      weatherRiskClass = 'mod';
      weatherRiskText = 'Moderate rainfall expected soon';
    } else if (weatherData.temperature > 35) {
      weatherRiskLevel = 'High';
      weatherRiskClass = 'high';
      weatherRiskText = 'Extreme heat expected, increasing stress';
    } else {
      weatherRiskLevel = 'Low';
      weatherRiskClass = 'low';
      weatherRiskText = 'Favorable weather conditions expected';
    }
  }

  return (
    <div className="risk-forecast-container">
      {/* Top Header Section */}
      <div className="rf-header">
        <div className="rf-title-group">
          <h1>Risk Forecast</h1>
          <p>Know the risk before visible damage spreads.</p>
        </div>
        
        <div className="rf-info-bar">
          <div className="rf-info-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d8a3e" strokeWidth="2">
              <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z"/>
              <path d="M12 22V2"/>
            </svg>
            <div className="rf-info-text">
              <span className="rf-info-label">Crop</span>
              <select 
                className="rf-crop-select" 
                value={selectedCrop} 
                onChange={(e) => setSelectedCrop(e.target.value)}
              >
                {farmState && farmState.crops && farmState.crops.length > 0 ? (
                  farmState.crops.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.status})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Cotton">Cotton</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Sugarcane">Sugarcane</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="rf-info-divider"></div>
          
          <div className="rf-info-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d8a3e" strokeWidth="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <div className="rf-info-text">
              <span className="rf-info-label">Growth Stage</span>
              <span className="rf-info-value">{currentData.stage}</span>
            </div>
          </div>
          <div className="rf-info-divider"></div>
          
          <div className="rf-info-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d8a3e" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <div className="rf-info-text">
              <span className="rf-info-label">Location</span>
              <span className="rf-info-value">{locationData ? `${locationData.district}, ${locationData.state}` : 'Akola, Maharashtra'}</span>
            </div>
          </div>
          <div className="rf-info-divider"></div>
          
          <div className="rf-info-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d8a3e" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div className="rf-info-text">
              <span className="rf-info-label">Last updated</span>
              <span className="rf-info-value">Just now</span>
            </div>
          </div>
          
          <button className="rf-refresh-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d8a3e" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="rf-grid">
        
        {/* Card 1: Overall Crop Risk */}
        <div className="rf-card">
          <div className="rf-card-header">
            <div className="rf-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d8a3e" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <h3>Overall Crop Risk</h3>
            </div>
            <a href="#" className="rf-link">View Details &rarr;</a>
          </div>
          <div className="rf-overall-risk-content">
            <div className="rf-overall-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#ffa000">
                <path d="M12 2L1 21h22M12 6l7.53 13H4.47M11 10v4h2v-4m-2 6v2h2v-2"></path>
              </svg>
            </div>
            <div className="rf-overall-info">
              <div className="rf-risk-level">
                <span className={`rf-risk-text ${scanResult ? (scanResult.severity === 'High' ? 'high' : scanResult.severity === 'Moderate' ? 'mod' : 'low') : currentData.riskClass}`}>
                  {scanResult ? scanResult.severity : currentData.overallRisk}
                </span>
                <span className="rf-risk-trend">{currentData.trend}</span>
              </div>
              <p className="rf-risk-desc">
                {scanResult ? `${scanResult.disease === 'Healthy' ? 'No major issues' : scanResult.disease} detected in recent scan` : currentData.riskDesc}
              </p>
            </div>
          </div>
          <div className="rf-confidence">
            <div className="rf-confidence-text">{scanResult ? Math.round(scanResult.score) : currentData.confidence}% Confidence</div>
            <div className="rf-progress-bar">
              <div className="rf-progress-fill" style={{ width: `${scanResult ? scanResult.score : currentData.confidence}%`, backgroundColor: '#4caf50' }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: 7-Day Risk Forecast */}
        <div className="rf-card rf-card-span-2">
          <div className="rf-card-header">
            <div className="rf-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d8a3e" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6"></path>
              </svg>
              <h3>7-Day Risk Forecast</h3>
            </div>
          </div>
          <div className="rf-chart-container">
            {/* Simple SVG Chart */}
            <svg viewBox="0 0 500 150" className="rf-line-chart" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef5350" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#ffca28" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#66bb6a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g className="rf-chart-grid">
                <line x1="0" y1="20" x2="500" y2="20" stroke="#eee" />
                <line x1="0" y1="65" x2="500" y2="65" stroke="#eee" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#eee" />
              </g>
              <path d="M 0 110 L 83 80 L 166 65 L 250 30 L 333 65 L 416 80 L 500 110 L 500 150 L 0 150 Z" fill="url(#chart-gradient)" />
              <polyline points="0,110 83,80 166,65 250,30 333,65 416,80 500,110" fill="none" stroke="#ffca28" strokeWidth="3" />
              {/* Data points */}
              <circle cx="0" cy="110" r="5" fill="#66bb6a" />
              <circle cx="83" cy="80" r="5" fill="#ffca28" />
              <circle cx="166" cy="65" r="5" fill="#ffca28" />
              <circle cx="250" cy="30" r="5" fill="#ef5350" />
              <circle cx="333" cy="65" r="5" fill="#ffca28" />
              <circle cx="416" cy="80" r="5" fill="#ffca28" />
              <circle cx="500" cy="110" r="5" fill="#ffca28" />
            </svg>
            <div className="rf-chart-labels">
              <div className="rf-label"><span>Today</span><br/>7 Sep</div>
              <div className="rf-label"><span>+1 Day</span><br/>8 Sep</div>
              <div className="rf-label"><span>+2 Days</span><br/>9 Sep</div>
              <div className="rf-label"><span>+3 Days</span><br/>10 Sep</div>
              <div className="rf-label"><span>+4 Days</span><br/>11 Sep</div>
              <div className="rf-label"><span>+5 Days</span><br/>12 Sep</div>
              <div className="rf-label"><span>+7 Days</span><br/>14 Sep</div>
            </div>
            <div className="rf-chart-legend">
              <span className="legend-item"><span className="dot low"></span> Low Risk</span>
              <span className="legend-item"><span className="dot mod"></span> Moderate Risk</span>
              <span className="legend-item"><span className="dot high"></span> High Risk</span>
            </div>
          </div>
        </div>

        {/* Card 3: Risk by Issue Type */}
        <div className="rf-card">
          <div className="rf-card-header">
            <div className="rf-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d8a3e" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <h3>Risk by Issue Type</h3>
            </div>
            <a href="#" className="rf-link">View Details &rarr;</a>
          </div>
          <div className="rf-issue-list">
            {/* Dynamic Issue from Scan */}
            {scanResult && scanResult.disease && scanResult.disease.toLowerCase() !== 'healthy plant' ? (
              <div className="rf-issue-item">
                <div className="rf-issue-name">
                  <div className="bug-icon">⚠️</div>
                  <span>{scanResult.disease}</span>
                </div>
                <div className={`rf-issue-level ${scanResult.severity === 'High' ? 'high' : scanResult.severity === 'Moderate' ? 'mod' : 'low'}`}>{scanResult.severity}</div>
                <div className="rf-issue-bar"><div className={`fill ${scanResult.severity === 'High' ? 'high' : scanResult.severity === 'Moderate' ? 'mod' : 'low'}`} style={{width: scanResult.severity === 'High' ? '90%' : scanResult.severity === 'Moderate' ? '60%' : '30%'}}></div></div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                {scanResult && scanResult.disease.toLowerCase() === 'healthy plant' 
                  ? 'Your scanned crop is completely healthy!'
                  : 'Scan a crop to see potential issues.'}
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Key Risk Factors */}
        <div className="rf-card">
          <div className="rf-card-header">
            <div className="rf-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d8a3e" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              <h3>Key Risk Factors</h3>
            </div>
          </div>
          <div className="rf-factors-grid">
            <div className="rf-factor">
              <div className="rf-factor-icon weather">🌧️</div>
              <h4>Weather</h4>
              <span className={`badge ${weatherRiskClass}`}>{weatherRiskLevel}</span>
              <p>{weatherRiskText}</p>
            </div>
            <div className="rf-factor">
              <div className="rf-factor-icon stage">🌱</div>
              <h4>Crop Stage</h4>
              <span className="badge mod">Moderate</span>
              <p>Flowering stage is more susceptible</p>
            </div>
            <div className="rf-factor">
              <div className="rf-factor-icon cases">👥</div>
              <h4>Nearby Cases</h4>
              <span className="badge high">High</span>
              <p>Increasing reports from nearby farms</p>
            </div>
            <div className="rf-factor">
              <div className="rf-factor-icon history">📊</div>
              <h4>Historical Data</h4>
              <span className="badge mod">Moderate</span>
              <p>Bollworm common in this period</p>
            </div>
          </div>
        </div>

        {/* Card 5: Weather Forecast */}
        <div className="rf-card rf-weather-card-wide">
          <div className="rf-card-header">
            <div className="rf-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d8a3e" strokeWidth="2">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
              </svg>
              <h3>Weather Forecast <span>(Next 7 Days)</span></h3>
            </div>
            <a href="#" className="rf-link">View Forecast &rarr;</a>
          </div>
          <div className="rf-weather-content">
            <div className="rf-weather-stats">
              <div className="rf-weather-stat">
                <div className="icon">🌡️</div>
                <div className="data">
                  <span className="val">{weatherData ? `${weatherData.temperature}°C` : '28°C'}</span>
                  <span className="lbl">Avg. Temp.</span>
                </div>
              </div>
              <div className="rf-weather-stat">
                <div className="icon">💧</div>
                <div className="data">
                  <span className="val">{weatherData ? `${weatherData.humidity}%` : '72%'}</span>
                  <span className="lbl">Avg. Humidity</span>
                </div>
              </div>
              <div className="rf-weather-stat">
                <div className="icon">🌧️</div>
                <div className="data">
                  <span className="val">{weatherData ? `${weatherData.precipitation} mm` : '12 mm'}</span>
                  <span className="lbl">Total Rainfall</span>
                </div>
              </div>
              <div className="rf-weather-stat">
                <div className="icon">💨</div>
                <div className="data">
                  <span className="val">{weatherData ? `${weatherData.windSpeed} km/h` : '12 km/h'}</span>
                  <span className="lbl">Avg. Wind</span>
                </div>
              </div>
            </div>

            {/* 7-Day Scrollable Row */}
            {weatherData?.daily && (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px' }}>
                {weatherData.daily.map((day, i) => {
                  const date = new Date(day.time);
                  const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  let icon = '☁️';
                  if (day.weatherCode === 0 || day.weatherCode === 1) icon = '☀️';
                  else if (day.weatherCode === 2 || day.weatherCode === 3) icon = '⛅';
                  else if (day.weatherCode >= 45 && day.weatherCode <= 48) icon = '🌫️';
                  else if (day.weatherCode >= 51 && day.weatherCode <= 65) icon = '🌧️';
                  else if (day.weatherCode >= 71 && day.weatherCode <= 75) icon = '❄️';
                  else if (day.weatherCode >= 95 && day.weatherCode <= 99) icon = '⛈️';

                  return (
                    <div key={day.time} style={{ minWidth: '65px', padding: '12px 8px', background: i === 0 ? '#e8f5e9' : '#f8f9fa', borderRadius: '8px', textAlign: 'center', border: i === 0 ? '1px solid #81c784' : '1px solid #e0e0e0' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: i === 0 ? '#2e7d32' : '#333' }}>{dayName}</div>
                      <div style={{ fontSize: '1.5rem', margin: '4px 0' }}>{icon}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#333' }}>{day.tempMax}°</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{day.tempMin}°</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rf-weather-impact">
              <div className="icon">🌱</div>
              <div className="impact-text">
                <h4>{currentData.weatherImpact}</h4>
                <p>High humidity and moderate rainfall may increase pest reproduction risk.</p>
              </div>
              <div className={`impact-badge ${currentData.riskClass}`}>{currentData.overallRisk}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
