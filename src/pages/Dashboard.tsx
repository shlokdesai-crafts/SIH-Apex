import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import StatsRow from '../components/StatsRow';
import PanelsRow from '../components/PanelsRow';
import ScanCrop from '../components/ScanCrop';
import AdvisoryOverview from '../components/AdvisoryOverview';
import FertilizerRecommendation from '../components/FertilizerRecommendation';
import RiskForecast from '../components/RiskForecast';
import MyFarm from './MyFarm/MyFarm';
import { FarmProvider } from '../context/FarmContext';
import { detectLocation, getBrowserPosition, type LocationResult } from '../services/locationService';
import { fetchWeather, type WeatherData } from '../services/weatherService';

export interface ScanResultData {
  score: number;
  crop: string;
  disease: string;
  severity: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [scanResult, setScanResult] = useState<ScanResultData | null>(() => {
    try {
      const stored = localStorage.getItem('cropguard_history');
      if (stored) {
        const history = JSON.parse(stored);
        if (history && history.length > 0) {
          const latest = history[0];
          return {
            score: latest.confidence || 0,
            crop: latest.crop || 'Unknown',
            disease: latest.disease || 'Unknown',
            severity: latest.severity || 'Low'
          };
        }
      }
    } catch(e) {}
    return null;
  });
  const [locationData, setLocationData] = useState<LocationResult | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    async function init() {
      try {
        let lat, lng;
        try {
          const loc = await detectLocation();
          setLocationData(loc);
          lat = loc.lat;
          lng = loc.lng;
        } catch (e) {
          console.warn('Reverse geocoding failed, falling back to GPS only', e);
          const pos = await getBrowserPosition();
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
        
        const weather = await fetchWeather(lat, lng);
        setWeatherData(weather);
      } catch (err) {
        console.error('Failed to get location or weather', err);
      }
    }
    init();
  }, []);

  return (
    <FarmProvider>
      <Header activeTab={activeTab === 'fertilizer' ? 'advisory' : activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'home' && (
        <>
          <Hero />
          <StatsRow scanResult={scanResult} weatherData={weatherData} locationData={locationData} />
          <PanelsRow scanResult={scanResult} locationData={locationData} setActiveTab={setActiveTab} />
        </>
      )}
      {activeTab === 'farm' && <MyFarm onNavigateTab={setActiveTab} />}
      {activeTab === 'scan' && <ScanCrop onScanComplete={(data) => setScanResult(data)} />}
      {activeTab === 'risk' && <RiskForecast weatherData={weatherData} locationData={locationData} scanResult={scanResult} />}
      {activeTab === 'advisory' && (
        <AdvisoryOverview 
          onBack={() => setActiveTab('home')} 
          onOpenFertilizer={() => setActiveTab('fertilizer')} 
        />
      )}
      {activeTab === 'fertilizer' && (
        <FertilizerRecommendation 
          onBack={() => setActiveTab('advisory')} 
        />
      )}
      {activeTab === 'more' && (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>More - Work in Progress</h2>
          <p>This page is not yet implemented.</p>
        </div>
      )}
    </FarmProvider>
  );
}
