import { useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import StatsRow from '../components/StatsRow';
import PanelsRow from '../components/PanelsRow';
import ScanCrop from '../components/ScanCrop';
import RiskForecast from '../components/RiskForecast';
import AdvisoryOverview from '../components/AdvisoryOverview';
import FertilizerRecommendation from '../components/FertilizerRecommendation';
import MyFarm from './MyFarm/MyFarm';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'home' && (
        <>
          <Hero />
          <StatsRow />
          <PanelsRow />
        </>
      )}
      {activeTab === 'farm' && <MyFarm />}
      {activeTab === 'scan' && <ScanCrop />}
      {activeTab === 'risk' && <RiskForecast />}
      {activeTab === 'advisory' && (
        <AdvisoryOverview
          onBack={() => setActiveTab('home')}
          onOpenFertilizer={() => setActiveTab('fertilizer')}
        />
      )}
      {activeTab === 'fertilizer' && (
        <FertilizerRecommendation onBack={() => setActiveTab('advisory')} />
      )}
      {activeTab === 'more' && (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>More - Work in Progress</h2>
          <p>This page is not yet implemented.</p>
        </div>
      )}
    </>
  );
}
