import './GovernmentDashboard.css';

// Placeholder imports for components we will build next
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

const GovernmentDashboard = () => {
  return (
    <div className="gov-dashboard-container">
      <GovHeader />
      <div className="gov-dashboard-main">
        <GovSidebar />
        <div className="gov-dashboard-content">
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
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboard;
