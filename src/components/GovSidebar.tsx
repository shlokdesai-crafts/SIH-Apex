import { useTranslation } from '../i18n/useTranslation';
import './GovSidebar.css';

interface GovSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const GovSidebar = ({
  activeTab = 'dashboard',
  onTabChange,
  onSelectTab,
  isOpen = false,
  onClose,
}: GovSidebarProps) => {
  const { t } = useTranslation();

  const handleTabChange = (tab: string) => {
    onTabChange?.(tab);
    onSelectTab?.(tab);
    onClose?.();
  };

  return (
    <aside className={`gov-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="gov-sidebar-header">
        <div className="gov-sidebar-brand-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d7d3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>{t("Navigation Menu")}</span>
        </div>
        {onClose && (
          <button className="gov-sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

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
          <span className="nav-label">{t("Dashboard")}</span>
        </li>

        <li
          className={activeTab === 'case-management' || activeTab === 'submissions' || activeTab === 'field-visits' || activeTab === 'unidentified' ? 'active' : ''}
          onClick={() => handleTabChange('case-management')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          <span className="nav-label">{t("Case Management")}</span>
          <span className="badge warning">Active</span>
        </li>

        <li
          className={activeTab === 'crop-health' ? 'active' : ''}
          onClick={() => handleTabChange('crop-health')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M12 22v-9" />
              <path d="M12 13a5 5 0 0 0 5-5c0-4-5-6-5-6s-5 2-5 6a5 5 0 0 0 5 5z" />
              <path d="M12 17a3 3 0 0 0 3-3" />
            </svg>
          </span>
          <span className="nav-label">{t("Crop Health")}</span>
        </li>

        <li
          className={activeTab === 'advisories' ? 'active' : ''}
          onClick={() => handleTabChange('advisories')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
            </svg>
          </span>
          <span className="nav-label">{t("Advisories")}</span>
        </li>

        <li
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => handleTabChange('reports')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </span>
          <span className="nav-label">{t("Reports")}</span>
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
