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
  onToggleSidebar,
}: GovHeaderProps = {}) => {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  interface NotificationItem {
    id: string;
    title: string;
    desc: string;
    time: string;
    icon: string;
    type: 'high' | 'unident' | 'medium' | 'low';
    isRead: boolean;
    targetTab?: string;
    targetSection?: string;
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Unidentified Cases Alert',
      desc: 'Expert agronomist review required for unclassified crop scans.',
      time: '10 mins ago',
      icon: '🔬',
      type: 'unident',
      isRead: false,
      targetSection: 'unidentified-cases-section',
    },
    {
      id: 'n2',
      title: 'Pest Outbreak in Jalgaon',
      desc: '124 farmer reports – Immediate bollworm containment required.',
      time: '2 hours ago',
      icon: '🐞',
      type: 'high',
      isRead: false,
      targetTab: 'case-management',
    },
    {
      id: 'n3',
      title: 'Tomato Early Blight Surge',
      desc: '86 farmer reports in Ahmednagar following 82% canopy humidity.',
      time: '3 hours ago',
      icon: '🍅',
      type: 'high',
      isRead: false,
      targetTab: 'case-management',
    },
    {
      id: 'n4',
      title: 'Field Visit Assigned',
      desc: 'Officer Sneha Deshmukh assigned to Nashik onion crop inspection.',
      time: '5 hours ago',
      icon: '👤',
      type: 'medium',
      isRead: true,
      targetTab: 'case-management',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setNotifMenuOpen(false);

    if (item.targetSection) {
      const el = document.getElementById(item.targetSection);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    if (item.targetTab) {
      handleTabChange(item.targetTab);
    }
  };

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
      {/* ── Left: Brand & Portal Logo ── */}
      <div className="gov-header-left">
        {onToggleSidebar && (
          <button
            className="gov-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar Menu"
            title="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <div
          className="gov-logo-clickable"
          onClick={() => handleTabChange('dashboard')}
          title="Go to Government Dashboard"
        >
          <div className="gov-logo-badge">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="gov-logo-icon"
            >
              <path
                d="M16 28V16M16 16C16 10 21 6 27 6C27 12 23 17 16 16ZM16 16C16 10 11 6 5 6C5 12 9 17 16 16Z"
                stroke="#86efac"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="#22c55e"
                fillOpacity="0.4"
              />
            </svg>
          </div>

          <div className="gov-logo-text">
            <div className="gov-brand-row">
              <span className="gov-brand-title">CropGuard</span>
              <span className="gov-brand-pill">Gov Portal</span>
            </div>
            <span className="gov-logo-dept">Maharashtra Dept of Agriculture</span>
          </div>
        </div>
      </div>


      {/* ── Center: Main Portal Navigation ── */}
      <nav className="gov-header-nav">
        <button
          className={`gov-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>{t("Dashboard")}</span>
        </button>

        <button
          className={`gov-nav-btn ${activeTab === 'case-management' || activeTab === 'submissions' || activeTab === 'field-visits' || activeTab === 'unidentified' ? 'active' : ''}`}
          onClick={() => handleTabChange('case-management')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>{t("Case Management")}</span>
        </button>

        <button
          className={`gov-nav-btn ${activeTab === 'crop-health' ? 'active' : ''}`}
          onClick={() => handleTabChange('crop-health')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20" />
          </svg>
          <span>{t("Crop Health")}</span>
        </button>

        <button
          className={`gov-nav-btn ${activeTab === 'advisories' ? 'active' : ''}`}
          onClick={() => handleTabChange('advisories')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
          </svg>
          <span>{t("Advisories")}</span>
        </button>

        <button
          className={`gov-nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleTabChange('reports')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>{t("Reports")}</span>
        </button>
      </nav>

      {/* ── Right: Jurisdiction, Notifications & Profile ── */}
      <div className="gov-header-right">
        <div className="gov-region-select" title="Selected Jurisdiction State">
          <span className="gov-region-flag">🏛️</span>
          <select defaultValue="Maharashtra">
            <option value="Maharashtra">{t("Maharashtra")}</option>
          </select>
          <span className="gov-select-arrow">▼</span>
        </div>

        {/* ── Notifications Icon & Dropdown ── */}
        <div className="gov-notif-wrapper" ref={notifMenuRef}>
          <button
            className="gov-notifications"
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            title={`${unreadCount} Unread Notifications`}
            aria-expanded={notifMenuOpen}
            aria-haspopup="true"
            style={{ border: 'none' }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="18"
              height="18"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {notifMenuOpen && (
            <div className="gov-notif-dropdown">
              <div className="gov-notif-header">
                <div className="gov-notif-title">
                  <span>🔔 {t("Notifications & Alerts")}</span>
                  {unreadCount > 0 && <span className="gov-notif-count">{unreadCount} new</span>}
                </div>
                {unreadCount > 0 && (
                  <button className="gov-notif-action-btn" onClick={handleMarkAllRead}>
                    {t("Mark all read")}
                  </button>
                )}
              </div>

              <div className="gov-notif-list">
                {notifications.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    {t("No notifications right now")}
                  </p>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`gov-notif-item ${!item.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className={`gov-notif-icon ${item.type}`}>{item.icon}</div>
                      <div className="gov-notif-body">
                        <div className="gov-notif-item-title">{t(item.title)}</div>
                        <div className="gov-notif-item-desc">{t(item.desc)}</div>
                        <span className="gov-notif-item-time">{item.time}</span>
                      </div>
                      {!item.isRead && <span className="gov-notif-dot" />}
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="gov-notif-footer">
                  <button onClick={handleClearNotifications}>{t("Clear All Notifications")}</button>
                </div>
              )}
            </div>
          )}
        </div>

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
              <span className="gov-account-title">{t("Officer")}</span>
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

              <button
                className="gov-dropdown-item"
                onClick={() => {
                  setAccountMenuOpen(false);
                  handleTabChange('settings');
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05-1.82 1.82-.05-.05a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V22h-2.58v-.08a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.05.05-1.82-1.82.05-.05A1.7 1.7 0 0 0 6.02 17a1.7 1.7 0 0 0-1.56-1.04H4v-2.58h.08A1.7 1.7 0 0 0 5.64 12.3a1.7 1.7 0 0 0-.34-1.88l-.05-.05 1.82-1.82.05.05A1.7 1.7 0 0 0 9 8.94a1.7 1.7 0 0 0 1.04-1.56V7h2.58v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.05-.05 1.82 1.82-.05.05a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 18.58 13H18v2h.02a1.7 1.7 0 0 0 1.38 0Z" />
                </svg>
                <span>{t("Department Settings & Profile")}</span>
              </button>

              <button className="gov-dropdown-item" onClick={handleSwitchToFarmer}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <polyline points="16 11 18 13 22 9" />
                </svg>
                <span>Switch to Farmer Portal</span>
              </button>

              <div className="gov-dropdown-divider" />

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
