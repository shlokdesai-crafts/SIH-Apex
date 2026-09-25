import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { AuthContext } from '../auth/AuthContext';
import type { Language } from '../i18n/translations';
import { GOV_ALERTS } from '../services/govDataService';

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  activeNav?: string;
  onNavigate?: (navId: string) => void;
}

interface HeaderNotification {
  id: number | string;
  title: string;
  desc: string;
  time: string;
  icon: string;
  type: string;
  isRead: boolean;
}

export default function Header({
  activeTab,
  setActiveTab,
  activeNav,
  onNavigate
}: HeaderProps) {
  const [localActiveNav, setLocalActiveNav] = useState('home');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<HeaderNotification[]>(() =>
    GOV_ALERTS.map((alert, idx) => ({
      id: alert.id,
      title: alert.title,
      desc: alert.desc,
      time: alert.time,
      icon: alert.icon,
      type: alert.type,
      isRead: idx >= 3,
    }))
  );

  const {
    t,
    language,
    setLanguage
  } = useTranslation();
  const {
    user,
    logout
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, navId: string) => {
    e.preventDefault();
    if (setActiveTab) {
      setActiveTab(navId);
    } else if (onNavigate) {
      onNavigate(navId);
    } else {
      setLocalActiveNav(navId);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setMobileNavOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setLangDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', {
      replace: true
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (id: number | string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const languageDisplayMap: Record<Language, string> = {
    en: 'English',
    hi: 'हिंदी',
    mr: 'मराठी'
  };
  const userDisplayName = user?.fullName || 'Farmer';
  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'F';
  const userRoleDisplay = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : t('auth.farmerLabel');
  const currentNav = activeTab !== undefined ? activeTab : activeNav !== undefined ? activeNav : localActiveNav;

  return (
    <header className="navbar" id="main-navbar" ref={mobileNavRef}>
      <div className="nav-brand">
        <button
          className="mobile-nav-toggle-btn"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileNavOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {mobileNavOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <div className="nav-logo">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4L6 12v12c0 11.1 7.68 21.48 18 24 10.32-2.52 18-12.9 18-24V12L24 4z" fill="#e8f5e9" stroke="#2d7d3a" strokeWidth="2"/>
            <path d="M24 38V24M24 24c0-6 5-10 11-10-1 6-5 11-11 10zM24 24c0-6-5-10-11-10 1 6 5 11 11 10z" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#81C784" fillOpacity="0.4"/>
            <circle cx="24" cy="12" r="3" fill="#FFB300"/>
          </svg>
        </div>
        <div className="nav-brand-text">
          <span className="nav-title">{t('header.brand')}</span>
          <span className="nav-subtitle">{t('header.subtitle')}</span>
        </div>
      </div>

      <nav className="nav-links" id="main-nav">
        <a href="#" className={`nav-link ${currentNav === 'home' ? 'active' : ''}`} onClick={e => handleNavClick(e, 'home')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          {t('nav.home')}
        </a>
        <a href="#" className={`nav-link ${currentNav === 'scan' ? 'active' : ''}`} onClick={e => handleNavClick(e, 'scan')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M3 9V5a2 2 0 0 1 2-2h4M3 15v4a2 2 0 0 0 2 2h4M21 9V5a2 2 0 0 0-2-2h-4M21 15v4a2 2 0 0 1-2 2h-4" /></svg>
          {t('nav.scanCrop')}
        </a>
        <a href="#" className={`nav-link ${currentNav === 'risk' ? 'active' : ''}`} onClick={e => handleNavClick(e, 'risk')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          {t('nav.riskForecast')}
        </a>
        <a href="#" className={`nav-link ${currentNav === 'farm' ? 'active' : ''}`} onClick={e => handleNavClick(e, 'farm')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          {t('nav.myFarm')}
        </a>
        <a href="#" className={`nav-link ${currentNav === 'advisory' ? 'active' : ''}`} onClick={e => handleNavClick(e, 'advisory')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
          {t('nav.advisory')}
        </a>
      </nav>

      <div className="nav-right">
        <div className="lang-dropdown-wrapper" ref={dropdownRef}>
          <button className="lang-btn" id="lang-toggle" onClick={() => setLangDropdownOpen(!langDropdownOpen)} aria-expanded={langDropdownOpen} aria-haspopup="listbox">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="lang-globe-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
            <span>{languageDisplayMap[language]}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={`lang-chevron ${langDropdownOpen ? 'open' : ''}`}><path d="M7 10l5 5 5-5z" /></svg>
          </button>
          {langDropdownOpen && <div className="lang-dropdown" role="listbox" aria-label={t('lang.selectLanguage')}>
              <button className={`lang-option ${language === 'en' ? 'active' : ''}`} role="option" aria-selected={language === 'en'} onClick={() => handleLanguageSelect('en')}><span className="lang-option-label">{t("English")}</span><span className="lang-option-native">{t("EN")}</span>{language === 'en' && <span className="lang-check">✓</span>}</button>
              <button className={`lang-option ${language === 'hi' ? 'active' : ''}`} role="option" aria-selected={language === 'hi'} onClick={() => handleLanguageSelect('hi')}><span className="lang-option-label">हिंदी</span><span className="lang-option-native">{t("HI")}</span>{language === 'hi' && <span className="lang-check">✓</span>}</button>
              <button className={`lang-option ${language === 'mr' ? 'active' : ''}`} role="option" aria-selected={language === 'mr'} onClick={() => handleLanguageSelect('mr')}><span className="lang-option-label">मराठी</span><span className="lang-option-native">{t("MR")}</span>{language === 'mr' && <span className="lang-check">✓</span>}</button>
            </div>}
        </div>

        <div className="user-profile-wrapper" ref={userMenuRef}>
          <div className="user-profile" id="user-profile-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} role="button" tabIndex={0} aria-expanded={userMenuOpen}>
            <div className="user-avatar-initials" id="user-avatar-img">{userInitials}</div>
            <div className="user-info">
              <span className="user-name">{userDisplayName}</span>
              <span className="user-loc">{user?.location ? `${userRoleDisplay} | ${user.location}` : userRoleDisplay}</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#333" className={`lang-chevron ${userMenuOpen ? 'open' : ''}`}><path d="M7 10l5 5 5-5z" /></svg>
          </div>
          {userMenuOpen && (
            <div className="user-menu-dropdown" id="user-profile-menu">
              <div className="user-menu-header">
                <div className="user-avatar-initials large">{userInitials}</div>
                <div className="user-menu-details">
                  <div className="user-menu-name">{userDisplayName}</div>
                  <div className="user-menu-role">{userRoleDisplay}</div>
                  {user?.location && <div className="user-menu-meta">📍 {user.location}</div>}
                  {user?.phone && <div className="user-menu-meta">📞 {user.phone}</div>}
                </div>
              </div>
              <div className="user-menu-divider"></div>
              <button className="user-menu-item" onClick={handleLogout} id="user-logout-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-drawer" id="mobile-nav-drawer">
          <div className="mobile-nav-user-header">
            <div className="user-avatar-initials">{userInitials}</div>
            <div className="mobile-nav-user-info">
              <span className="mobile-user-name">{userDisplayName}</span>
              <span className="mobile-user-role">{userRoleDisplay} {user?.location ? `| ${user.location}` : ''}</span>
            </div>
          </div>
          <nav className="mobile-nav-links">
            <a href="#" className={`mobile-nav-link ${currentNav === 'home' ? 'active' : ''}`} onClick={e => { handleNavClick(e, 'home'); setMobileNavOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
              <span>{t('nav.home')}</span>
            </a>
            <a href="#" className={`mobile-nav-link ${currentNav === 'scan' ? 'active' : ''}`} onClick={e => { handleNavClick(e, 'scan'); setMobileNavOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M3 9V5a2 2 0 0 1 2-2h4M3 15v4a2 2 0 0 0 2 2h4M21 9V5a2 2 0 0 0-2-2h-4M21 15v4a2 2 0 0 1-2 2h-4" /></svg>
              <span>{t('nav.scanCrop')}</span>
            </a>
            <a href="#" className={`mobile-nav-link ${currentNav === 'risk' ? 'active' : ''}`} onClick={e => { handleNavClick(e, 'risk'); setMobileNavOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              <span>{t('nav.riskForecast')}</span>
            </a>
            <a href="#" className={`mobile-nav-link ${currentNav === 'farm' ? 'active' : ''}`} onClick={e => { handleNavClick(e, 'farm'); setMobileNavOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              <span>{t('nav.myFarm')}</span>
            </a>
            <a href="#" className={`mobile-nav-link ${currentNav === 'advisory' ? 'active' : ''}`} onClick={e => { handleNavClick(e, 'advisory'); setMobileNavOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              <span>{t('nav.advisory')}</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
