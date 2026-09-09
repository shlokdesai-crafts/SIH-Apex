import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import StatsRow from './components/StatsRow';
import PanelsRow from './components/PanelsRow';
import ScanCrop from './components/ScanCrop';
import RiskForecast from './components/RiskForecast';
import Login from './components/Login';
import GovernmentDashboard from './components/GovernmentDashboard';
import MyFarm from './pages/MyFarm/MyFarm';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');

  const handleLogin = (role: string) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (userRole === 'government') {
    return <GovernmentDashboard />;
  }

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
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Advisory - Work in Progress</h2>
          <p>This page is not yet implemented.</p>
        </div>
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

export default App;
