import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import NeedsVisitPage from './NeedsVisitPage';
import AIUnidentifiedPage from './AIUnidentifiedPage';
import DistrictInsightsPage from './DistrictInsightsPage';
import './OperationsHubPage.css';

const OperationsHubPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('needs-visit');

  return (
    <div className="operations-hub-page page-layout fade-in">
      <div className="page-header">
        <h2 className="page-title">{t("Operations Hub")}</h2>
        <p className="page-subtitle">{t("Centralized dashboard for field visits, AI diagnoses, and district insights.")}</p>
      </div>

      <div className="hub-tabs">
        <button 
          className={`hub-tab ${activeTab === 'needs-visit' ? 'active' : ''}`}
          onClick={() => setActiveTab('needs-visit')}
        >
          <span className="icon">📍</span> {t("Needs Field Visit")}
        </button>
        <button 
          className={`hub-tab ${activeTab === 'ai-unidentified' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-unidentified')}
        >
          <span className="icon">❓</span> {t("AI Unidentified")}
        </button>
        <button 
          className={`hub-tab ${activeTab === 'district-insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('district-insights')}
        >
          <span className="icon">📊</span> {t("District Insights")}
        </button>
      </div>

      <div className="hub-content">
        {activeTab === 'needs-visit' && <NeedsVisitPage />}
        {activeTab === 'ai-unidentified' && <AIUnidentifiedPage />}
        {activeTab === 'district-insights' && <DistrictInsightsPage />}
      </div>
    </div>
  );
};

export default OperationsHubPage;
