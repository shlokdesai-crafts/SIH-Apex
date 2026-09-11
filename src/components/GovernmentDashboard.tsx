import { useState } from 'react';
import './GovernmentDashboard.css';

import GovHeader from './GovHeader';
import GovSidebar from './GovSidebar';
import GovHero from './GovHero';
import GovStatsRow from './GovStatsRow';
import RecentSubmissions from './RecentSubmissions';
import MaharashtraMap from './MaharashtraMap';
import AlertsNotifications from './AlertsNotifications';
import AIAdvisoryPreview from './AIAdvisoryPreview';
import UnidentifiedCasesTable from './UnidentifiedCasesTable';
import DistrictAnalyticsTable from './DistrictAnalyticsTable';
import GovSettings from './GovSettings';

const GovernmentDashboard = () => {
  // Default to 'settings' to display the Government Officer Settings page matching UI reference
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="gov-dashboard-container">
      <GovHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="gov-dashboard-main">
        <GovSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="gov-dashboard-content">
          {activeTab === 'settings' ? (
            <GovSettings />
          ) : (
            <>
              <GovHero />
              <GovStatsRow />
              
              <div className="gov-dashboard-grid-row-1">
                <RecentSubmissions />
                <MaharashtraMap />
                <AlertsNotifications />
              </div>

              <div className="gov-dashboard-grid-row-2">
                <AIAdvisoryPreview />
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
