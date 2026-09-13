import { useTranslation } from '../i18n/useTranslation';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import './GovHeader.css';

interface GovHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  onToggleSidebar?: () => void;
}

const GovHeader = ({
  activeTab: _activeTab = 'dashboard',
  onTabChange,
  onSelectTab,
  onToggleSidebar
}: GovHeaderProps = {}) => {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const initials =
    user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'GO';

  const displayName = user?.fullName || 'Government Official';

  const handleSwitchToFarmer = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (tab: string) => {
    onTabChange?.(tab);
    onSelectTab?.(tab);
  };

  return (
    <header className="gov-header">
      <div
        className="gov-header-left"
        style={{ cursor: 'pointer' }}
        onClick={() => handleTabChange('dashboard')}
      >
        <div className="gov-logo-container">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSidebar?.();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            title="Toggle Sidebar"
          >
            ?
          </button>

          <div className="gov-logo-leaf">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: 26, height: 26 }}
            >
              <path
                d="M16 28V16M16 16C16 10 21 6 27 6C27 12 23 17 16 16ZM16 16C16 10 11 6 5 6C5 12 9 17 16 16Z"
                stroke="#86efac"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="#22c55e"
                fillOpacity="0.4"
              />
            </svg>
          </div>

          <div className="gov-logo-text">
            <h2>{t("CropGuard")}</h2>
            <p>{t("Government Portal")}</p>
            <p className="gov-logo-dept">{t("Maharashtra Agriculture Department")}</p>
          </div>
        </div>
      </div>

      <div className="gov-header-nav">
        <button
          className="gov-nav-btn"
          onClick={() => handleTabChange('dashboard')}
        >
          <span className="icon">¦</span>
          {t("Dashboard")}
        </button>

        <button
          className="gov-nav-btn"
          onClick={() => handleTabChange('crop-health')}
        >
          <span className="icon">??</span>
          {t("Crop Health")}
        </button>

        <button
          className="gov-nav-btn"
          onClick={() => handleTabChange('submissions')}
        >
          <span className="icon">??</span>
          {t("Farmer Submissions")}
        </button>

        <button
          className="gov-nav-btn"
          onClick={() => handleTabChange('field-visits')}
        >
          <span className="icon">??</span>
          {t("Field Visits")}
        </button>

        <button
          className="gov-nav-btn"
          onClick={() => handleTabChange('knowledge')}
        >
          <span className="icon">??</span>
          {t("Knowledge Base")}
        </button>

        <button
          className="gov-nav-btn"
          onClick={() => handleTabChange('reports')}
        >
          <span className="icon">??</span>
          {t("Reports")}
        </button>

        <button
          className="gov-nav-btn"
          onClick={() => handleTabChange('schemes')}
        >
          <span className="icon">??</span>
          {t("Schemes")}
        </button>
      </div>

      <div className="gov-header-right">
        <div className="gov-region-select">
          <select defaultValue="Maharashtra">
            <option value="Maharashtra">{t("Maharashtra")}</option>
          </select>
          <span className="gov-select-arrow">?</span>
        </div>

        <div className="gov-notifications" title="12 Notifications">
          <span className="icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 18, height: 18 }}
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span className="badge">12</span>
        </div>

        <div className="gov-user-profile" title="Officer Profile">
          <div className="gov-avatar">{initials}</div>
          <div className="gov-user-info">
            <span className="gov-user-name">{displayName}</span>
            <span className="gov-user-role">{t("District Agriculture Officer")}</span>
          </div>
        </div>

        <button
          className="gov-logout-btn"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          title="Logout"
        >
          <span className="icon">??</span>
          {t("Logout")}
        </button>

        <button
          className="gov-switch-portal-btn"
          onClick={handleSwitchToFarmer}
          title="Switch to Farmer Portal"
        >
          <span className="icon">?????</span>
          <span>Switch to Farmer</span>
        </button>
      </div>
    </header>
  );
};

export default GovHeader;


