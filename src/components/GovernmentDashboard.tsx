import { useState, useEffect } from 'react';
import './GovernmentDashboard.css';

// Placeholder imports for components we will build next
import GovHeader from './GovHeader';
import GovSidebar from './GovSidebar';
import GovHero from './GovHero';
import GovStatsRow from './GovStatsRow';
import RecentSubmissions from './RecentSubmissions';
import MaharashtraMap from './MaharashtraMap';

import UnidentifiedCasesTable from './UnidentifiedCasesTable';
import DistrictAnalyticsTable from './DistrictAnalyticsTable';

const GovernmentDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1200);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1200) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="gov-dashboard-container">
      <GovHeader onToggleSidebar={toggleSidebar} />
      <div className="gov-dashboard-main">
        <GovSidebar isOpen={isSidebarOpen} />
        <div className={`gov-dashboard-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <GovHero />
          <GovStatsRow />
          
          <div className="gov-dashboard-grid-row-1">
            <RecentSubmissions />
            <MaharashtraMap />
          </div>

          <div className="gov-dashboard-grid-row-2">
            <UnidentifiedCasesTable />
            <DistrictAnalyticsTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboard;
