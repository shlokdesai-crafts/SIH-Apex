import { useTranslation } from '../i18n/useTranslation';
import './GovSidebar.css';

interface GovSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  isOpen?: boolean;
}

const GovSidebar = ({
  activeTab = 'dashboard',
  onTabChange,
  onSelectTab,
  isOpen: _isOpen = false
}: GovSidebarProps) => {
  const { t } = useTranslation();

  const handleTabChange = (tab: string) => {
    onTabChange?.(tab);
    onSelectTab?.(tab);
  };

  return (
    <aside className={`gov-sidebar ${_isOpen ? 'open' : ''}`}>
      <ul className="gov-sidebar-nav">
        <li
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => handleTabChange('dashboard')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          {t("Dashboard")}
        </li>

        <li
          className={activeTab === 'case-management' || activeTab === 'submissions' || activeTab === 'field-visits' || activeTab === 'unidentified' ? 'active' : ''}
          onClick={() => handleTabChange('case-management')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          {t("Case Management")}
          <span className="badge warning">Active</span>
        </li>

        <li
          className={activeTab === 'insights' ? 'active' : ''}
          onClick={() => handleTabChange('insights')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          {t("District Insights")}
        </li>

        <li
          className={activeTab === 'crop-health' ? 'active' : ''}
          onClick={() => handleTabChange('crop-health')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M12 22v-9" />
              <path d="M12 13a5 5 0 0 0 5-5c0-4-5-6-5-6s-5 2-5 6a5 5 0 0 0 5 5z" />
              <path d="M12 17a3 3 0 0 0 3-3" />
            </svg>
          </span>
          {t("Crop Health")}
        </li>

        <li
          className={activeTab === 'advisories' ? 'active' : ''}
          onClick={() => handleTabChange('advisories')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
            </svg>
          </span>
          {t("Advisories")}
        </li>

        <li
          className={activeTab === 'schemes' ? 'active' : ''}
          onClick={() => handleTabChange('schemes')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <line x1="3" y1="21" x2="21" y2="21" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <polyline points="3 10 12 3 21 10" />
              <line x1="5" y1="10" x2="5" y2="21" />
              <line x1="9" y1="10" x2="9" y2="21" />
              <line x1="15" y1="10" x2="15" y2="21" />
              <line x1="19" y1="10" x2="19" y2="21" />
            </svg>
          </span>
          {t("Schemes")}
        </li>

        <li
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => handleTabChange('reports')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </span>
          {t("Reports")}
        </li>

        <li
          className={activeTab === 'team' || activeTab === 'team-management' ? 'active' : ''}
          onClick={() => handleTabChange('team')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          {t("Team Management")}
        </li>

        <li
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => handleTabChange('settings')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05-1.82 1.82-.05-.05a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V22h-2.58v-.08a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.05.05-1.82-1.82.05-.05A1.7 1.7 0 0 0 6.02 17a1.7 1.7 0 0 0-1.56-1.04H4v-2.58h.08A1.7 1.7 0 0 0 5.64 12.3a1.7 1.7 0 0 0-.34-1.88l-.05-.05 1.82-1.82.05.05A1.7 1.7 0 0 0 9 8.94a1.7 1.7 0 0 0 1.04-1.56V7h2.58v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.05-.05 1.82 1.82-.05.05a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 18.58 13H18v2h.02a1.7 1.7 0 0 0 1.38 0Z" />
            </svg>
          </span>
          {t("Settings")}
        </li>
      </ul>

      <div className="gov-sidebar-footer-card">
        <div className="gov-sidebar-leaf-icon">
          <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 40 C18 24, 30 18, 32 6 C22 6, 14 14, 12 24 C11 27, 11 32, 18 40 Z" fill="#2d8a4e" />
            <path d="M18 40 C16 28, 8 26, 4 20 C4 28, 10 34, 18 40 Z" fill="#48bb78" />
            <line x1="18" y1="42" x2="18" y2="18" stroke="#1b5e20" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M14 42 C16 43, 20 43, 22 42" stroke="#1b5e20" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="gov-sidebar-card-text">
          <span className="card-top-line">{t("For a")}</span>
          <span className="card-highlight-line">{t("Healthier Tomorrow")}</span>
          <span className="card-sub-line">{t("Healthy Crops")}</span>
          <span className="card-sub-line">{t("Prosperous Maharashtra")}</span>
        </div>
      </div>
    </aside>
  );
};

export default GovSidebar;




