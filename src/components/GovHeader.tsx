import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { AuthContext } from '../auth/AuthContext';
import './GovHeader.css';

interface GovHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  onToggleSidebar?: () => void;
}

const GovHeader = ({
  activeTab = 'dashboard',
  onTabChange,
  onSelectTab,
  onToggleSidebar
}: GovHeaderProps = {}) => {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials =
    user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'GO';

  const displayName = user?.fullName || 'District Officer';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSwitchToFarmer = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleTabChange = (tab: string) => {
    onTabChange?.(tab);
    onSelectTab?.(tab);
  };

  return (
    <header className="gov-header">
      <div className="gov-header-left">
        <div className="gov-logo-container">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSidebar?.();
            }}
            className="gov-hamburger-btn"
            title="Toggle Sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div
            className="gov-logo-clickable"
            onClick={() => handleTabChange('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div className="gov-logo-leaf">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: 24, height: 24 }}
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
      </div>

      <nav className="gov-header-nav">
        <button
          className={`gov-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>{t("Dashboard")}</span>
        </button>

        <button
          className={`gov-nav-btn ${activeTab === 'crop-health' ? 'active' : ''}`}
          onClick={() => handleTabChange('crop-health')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12A10 10 0 0 1 12 2z" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>{t("Crop Health")}</span>
        </button>

        <button
          className={`gov-nav-btn ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => handleTabChange('submissions')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>{t("Farmer Submissions")}</span>
        </button>

        <button
          className={`gov-nav-btn ${activeTab === 'field-visits' ? 'active' : ''}`}
          onClick={() => handleTabChange('field-visits')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{t("Field Visits")}</span>
        </button>

        <button
          className={`gov-nav-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => handleTabChange('knowledge')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>{t("Knowledge Base")}</span>
        </button>

        <button
          className={`gov-nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleTabChange('reports')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>{t("Reports")}</span>
        </button>

        <button
          className={`gov-nav-btn ${activeTab === 'schemes' ? 'active' : ''}`}
          onClick={() => handleTabChange('schemes')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>{t("Schemes")}</span>
        </button>
      </nav>

      <div className="gov-header-right">
        <div className="gov-region-select">
          <select defaultValue="Maharashtra">
            <option value="Maharashtra">{t("Maharashtra")}</option>
          </select>
          <span className="gov-select-arrow">▼</span>
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
              style={{ width: 17, height: 17 }}
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span className="badge">12</span>
        </div>

        {/* ── Account Dropdown & Logout ── */}
        <div className="gov-account-wrapper" ref={accountMenuRef}>
          <button
            className={`gov-account-btn ${accountMenuOpen ? 'active' : ''}`}
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            title="Account Menu"
            aria-expanded={accountMenuOpen}
            aria-haspopup="true"
          >
            <div className="gov-avatar">{initials}</div>
            <div className="gov-account-text">
              <span className="gov-account-title">{t("Account")}</span>
              <span className="gov-account-name">{displayName}</span>
            </div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`gov-chevron ${accountMenuOpen ? 'open' : ''}`}
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {accountMenuOpen && (
            <div className="gov-account-dropdown">
              <div className="gov-dropdown-header">
                <div className="gov-avatar-large">{initials}</div>
                <div className="gov-dropdown-details">
                  <div className="gov-dropdown-name">{displayName}</div>
                  <div className="gov-dropdown-role">{user?.role || t("District Agriculture Officer")}</div>
                  <div className="gov-dropdown-dept">🏛️ Maharashtra Agriculture Department</div>
                  {user?.phone && <div className="gov-dropdown-phone">📞 {user.phone}</div>}
                </div>
              </div>

              <div className="gov-dropdown-status">
                <span className="gov-status-dot" />
                <span>Active Official Session</span>
              </div>

              <div className="gov-dropdown-divider" />

              <button className="gov-dropdown-item" onClick={handleSwitchToFarmer}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <polyline points="16 11 18 13 22 9" />
                </svg>
                <span>Switch to Farmer Portal</span>
              </button>

              <div className="gov-dropdown-divider" />

              {/* Functional Logout button directly below account */}
              <button
                className="gov-dropdown-logout-btn"
                onClick={handleLogout}
                title="Log out of session"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>{t("Logout")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default GovHeader;
