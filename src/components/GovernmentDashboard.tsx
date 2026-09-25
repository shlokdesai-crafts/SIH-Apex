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
import GovAdvisoriesPage from './GovAdvisoriesPage';
import CaseManagementPage from './CaseManagementPage';
import GovReportsPage from './GovReportsPage';
import GovSettings from './GovSettings';

interface GovernmentDashboardProps {
  initialTab?: string;
}

const GovernmentDashboard = ({ initialTab = 'dashboard' }: GovernmentDashboardProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname === '/case-management') return 'case-management';
    if (location.pathname === '/crop-health') return 'crop-health';
    if (location.pathname === '/advisories') return 'advisories';
    if (location.pathname === '/reports') return 'reports';
    if (location.pathname === '/settings') return 'settings';
    return initialTab;
  });

  useEffect(() => {
    if (location.pathname === '/case-management') {
      setActiveTab('case-management');
    } else if (location.pathname === '/crop-health') {
      setActiveTab('crop-health');
    } else if (location.pathname === '/advisories') {
      setActiveTab('advisories');
    } else if (location.pathname === '/reports') {
      setActiveTab('reports');
    } else if (location.pathname === '/settings') {
      setActiveTab('settings');
    } else if (location.pathname === '/' || location.pathname === '/dashboard') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);

    if (tab === 'case-management' || tab === 'submissions' || tab === 'field-visits' || tab === 'unidentified') {
      navigate('/case-management');
    } else if (tab === 'crop-health') {
      navigate('/crop-health');
    } else if (tab === 'advisories') {
      navigate('/advisories');
    } else if (tab === 'reports') {
      navigate('/reports');
    } else if (tab === 'settings') {
      navigate('/settings');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="gov-dashboard-container">
      <GovHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSelectTab={handleTabChange}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="gov-dashboard-main">
        {sidebarOpen && (
          <div className="gov-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        <GovSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSelectTab={handleTabChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="gov-dashboard-content">
          {activeTab === 'case-management' || activeTab === 'submissions' || activeTab === 'field-visits' || activeTab === 'unidentified' ? (
            <CaseManagementPage
              initialFilter={
                activeTab === 'field-visits'
                  ? 'field-visits'
                  : activeTab === 'unidentified'
                  ? 'unidentified'
                  : 'all'
              }
            />
          ) : activeTab === 'crop-health' ? (
            <CropHealth />
          ) : activeTab === 'advisories' ? (
            <GovAdvisoriesPage />
          ) : activeTab === 'reports' ? (
            <GovReportsPage />
          ) : activeTab === 'settings' ? (
            <GovSettings />
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


