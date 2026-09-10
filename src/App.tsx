import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import StatsRow from './components/StatsRow';
import PanelsRow from './components/PanelsRow';
import ScanCrop from './components/ScanCrop';
import MyFarm from './pages/MyFarm/MyFarm';

function App() {
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
      {activeTab === 'scan' && <ScanCrop />}
      {activeTab === 'farm' && <MyFarm />}
    </>
  );
}

export default App;

