import React, { useState } from 'react';
import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import StatsRow from './components/StatsRow';
import PanelsRow from './components/PanelsRow';
import ScanCrop from './components/ScanCrop';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'home' && (
import MyFarm from './pages/MyFarm/MyFarm';

function App() {
  const [activeNav, setActiveNav] = useState('home');

  return (
    <>
      <Header activeNav={activeNav} onNavigate={setActiveNav} />
      {activeNav === 'farm' ? (
        <MyFarm />
      ) : (
        <>
          <Hero />
          <StatsRow />
          <PanelsRow />
        </>
      )}
      {activeTab === 'scan' && <ScanCrop />}
    </>
  );
}

export default App;
