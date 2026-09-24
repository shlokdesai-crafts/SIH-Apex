import { useState, useEffect, useContext } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import StatsRow from '../components/StatsRow';
import PanelsRow from '../components/PanelsRow';
import ScanCrop from '../components/ScanCrop';
import AdvisoryOverview from '../components/AdvisoryOverview';
import FertilizerRecommendation from '../components/FertilizerRecommendation';
import RiskForecast from '../components/RiskForecast';
import MyFarm from './MyFarm/MyFarm';
import { AuthContext } from '../auth/AuthContext';
import { FarmProvider } from '../context/FarmContext';
import { detectLocation, getBrowserPosition, forwardGeocode, type LocationResult } from '../services/locationService';
import { fetchWeather, type WeatherData } from '../services/weatherService';

export interface ScanResultData {
  score: number;
  crop: string;
  disease: string;
  severity: string;
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('home');
  const [previousTab, setPreviousTab] = useState<string>('home');
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

  const handleNavigateTab = (newTab: string) => {
    if (newTab !== activeTab) {
      if (activeTab !== 'fertilizer') {
        setPreviousTab(activeTab);
      }
      setActiveTab(newTab);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        let lat, lng;
        try {
          if (user?.location) {
            const loc = await forwardGeocode(user.location);
            setLocationData(loc);
            lat = loc.lat;
            lng = loc.lng;
          } else {
            const loc = await detectLocation();
            setLocationData(loc);
            lat = loc.lat;
            lng = loc.lng;
          }
        } catch (e) {
          console.warn('Location detection/geocoding failed, falling back to GPS only', e);
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
  }, [user]);

  return (
    <FarmProvider>
      <Header activeTab={activeTab === 'fertilizer' ? 'advisory' : activeTab} setActiveTab={handleNavigateTab} />
      {activeTab === 'home' && (
        <>
          <Hero />
          <StatsRow scanResult={scanResult} weatherData={weatherData} locationData={locationData} />
          <PanelsRow scanResult={scanResult} locationData={locationData} setActiveTab={handleNavigateTab} />
        </>
      )}
      {activeTab === 'farm' && <MyFarm onNavigateTab={handleNavigateTab} />}
      {activeTab === 'scan' && (
        <ScanCrop 
          onScanComplete={(data) => setScanResult(data)} 
          onNavigateTab={handleNavigateTab} 
        />
      )}
      {activeTab === 'risk' && <RiskForecast weatherData={weatherData} locationData={locationData} scanResult={scanResult} />}
      {activeTab === 'advisory' && (
        <AdvisoryOverview 
          scanResult={scanResult} 
          onBack={() => {
            const dest = previousTab === 'farm' ? 'farm' : (previousTab === 'scan' ? 'scan' : 'home');
            setActiveTab(dest);
          }} 
          onOpenFertilizer={() => setActiveTab('fertilizer')} 
          onNavigateTab={handleNavigateTab}
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
