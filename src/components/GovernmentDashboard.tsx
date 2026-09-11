import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './GovernmentDashboard.css';

import GovHeader from './GovHeader';
import GovSidebar from './GovSidebar';
import GovHero from './GovHero';
import GovStatsRow from './GovStatsRow';
import RecentSubmissions from './RecentSubmissions';
import MaharashtraMap from './MaharashtraMap';

import UnidentifiedCasesTable from './UnidentifiedCasesTable';
import DistrictAnalyticsTable from './DistrictAnalyticsTable';
import CropHealth from './CropHealth/CropHealth';

interface GovernmentDashboardProps {
  initialTab?: string;
}

const GovernmentDashboard = ({ initialTab = 'dashboard' }: GovernmentDashboardProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname === '/crop-health') return 'crop-health';
    return initialTab;
  });

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

  useEffect(() => {
    if (location.pathname === '/crop-health') {
      setActiveTab('crop-health');
    } else if (location.pathname === '/' || location.pathname === '/dashboard') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'crop-health') {
      navigate('/crop-health');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="gov-dashboard-container">
      <GovHeader activeTab={activeTab} onSelectTab={handleTabChange} onToggleSidebar={toggleSidebar} />
      <div className="gov-dashboard-main">
        <GovSidebar activeTab={activeTab} onSelectTab={handleTabChange} isOpen={isSidebarOpen} />
        <div className={`gov-dashboard-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          {activeTab === 'crop-health' ? (
            <CropHealth />
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboard;
