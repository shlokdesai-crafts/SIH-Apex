import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import StatsRow from './components/StatsRow';
import PanelsRow from './components/PanelsRow';
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
    </>
  );
}

export default App;
