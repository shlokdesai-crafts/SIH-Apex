import './GovSidebar.css';

interface GovSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const GovSidebar = ({ activeTab = 'settings', onTabChange }: GovSidebarProps) => {
  return (
    <aside className="gov-sidebar">
      <ul className="gov-sidebar-nav">
        <li
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => onTabChange?.('dashboard')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          Dashboard
        </li>
        <li
          className={activeTab === 'submissions' ? 'active' : ''}
          onClick={() => onTabChange?.('submissions')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </span>
          Farmer Submissions
        </li>
        <li
          className={activeTab === 'field-visits' ? 'active' : ''}
          onClick={() => onTabChange?.('field-visits')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          Needs Field Visit
          <span className="badge warning">24</span>
        </li>
        <li
          className={activeTab === 'unidentified' ? 'active' : ''}
          onClick={() => onTabChange?.('unidentified')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          AI Unidentified
          <span className="badge danger">8</span>
        </li>
        <li
          className={activeTab === 'insights' ? 'active' : ''}
          onClick={() => onTabChange?.('insights')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          District Insights
        </li>
        <li
          className={activeTab === 'crop-health' ? 'active' : ''}
          onClick={() => onTabChange?.('crop-health')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M12 22v-9" />
              <path d="M12 13a5 5 0 0 0 5-5c0-4-5-6-5-6s-5 2-5 6a5 5 0 0 0 5 5z" />
              <path d="M12 17a3 3 0 0 0 3-3" />
            </svg>
          </span>
          Crop Health
        </li>
        <li
          className={activeTab === 'advisories' ? 'active' : ''}
          onClick={() => onTabChange?.('advisories')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
            </svg>
          </span>
          Advisories
        </li>
        <li
          className={activeTab === 'schemes' ? 'active' : ''}
          onClick={() => onTabChange?.('schemes')}
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
          Schemes
        </li>
        <li
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => onTabChange?.('reports')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </span>
          Reports
        </li>
        <li
          className={activeTab === 'team' ? 'active' : ''}
          onClick={() => onTabChange?.('team')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          Team Management
        </li>
        <li
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => onTabChange?.('settings')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-svg-icon">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          Settings
        </li>
      </ul>

      {/* Sustainability Banner matching UI Reference */}
      <div className="gov-sidebar-footer-card">
        <div className="gov-sidebar-leaf-icon">
          <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Seedling with 2 leaves and stem */}
            <path d="M18 40 C18 24, 30 18, 32 6 C22 6, 14 14, 12 24 C11 27, 11 32, 18 40 Z" fill="#2d8a4e" />
            <path d="M18 40 C16 28, 8 26, 4 20 C4 28, 10 34, 18 40 Z" fill="#48bb78" />
            <line x1="18" y1="42" x2="18" y2="18" stroke="#1b5e20" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M14 42 C16 43, 20 43, 22 42" stroke="#1b5e20" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="gov-sidebar-card-text">
          <span className="card-top-line">For a</span>
          <span className="card-highlight-line">Healthier Tomorrow</span>
          <span className="card-sub-line">Healthy Crops</span>
          <span className="card-sub-line">Prosperous Maharashtra</span>
        </div>
      </div>
    </aside>
  );
};

export default GovSidebar;
