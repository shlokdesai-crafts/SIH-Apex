import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { AuthContext } from '../auth/AuthContext';
import type { Language } from '../i18n/translations';

export default function Header() {
  const [activeNav, setActiveNav] = useState('home');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { t, language, setLanguage } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, navId: string) => {
    e.preventDefault();
    setActiveNav(navId);
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
    navigate('/login', { replace: true });
  };

  const languageDisplayMap: Record<Language, string> = {
    en: 'English',
    hi: 'हिंदी',
    mr: 'मराठी',
  };

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="navbar" id="main-navbar">
      <div className="nav-brand">
        <div className="nav-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16" cy="22" rx="10" ry="7" fill="#2d8a3e" />
            <path d="M16 22 C12 14, 6 10, 10 4 C14 10, 22 8, 22 4 C24 10, 20 16, 16 22Z" fill="#4CAF50" />
            <path d="M16 22 C14 16, 10 12, 16 6 C16 12, 20 16, 16 22Z" fill="#81C784" opacity="0.7" />
          </svg>
        </div>
        <div className="nav-brand-text">
          <span className="nav-title">{t('header.brand')}</span>
          <span className="nav-subtitle">{t('header.subtitle')}</span>
        </div>
      </div>

      <nav className="nav-links" id="main-nav">
        <a href="#" className={`nav-link ${activeNav === 'home' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'home')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          {t('nav.home')}
        </a>
        <a href="#" className={`nav-link ${activeNav === 'scan' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'scan')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M3 9V5a2 2 0 0 1 2-2h4M3 15v4a2 2 0 0 0 2 2h4M21 9V5a2 2 0 0 0-2-2h-4M21 15v4a2 2 0 0 1-2 2h-4" /></svg>
          {t('nav.scanCrop')}
        </a>
        <a href="#" className={`nav-link ${activeNav === 'risk' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'risk')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          {t('nav.riskForecast')}
        </a>
        <a href="#" className={`nav-link ${activeNav === 'farm' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'farm')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          {t('nav.myFarm')}
        </a>
        <a href="#" className={`nav-link ${activeNav === 'advisory' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'advisory')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
          {t('nav.advisory')}
        </a>
        <a href="#" className={`nav-link ${activeNav === 'more' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'more')}>
          <span className="more-dots">•••</span>
          {t('nav.more')}
        </a>
      </nav>

      <div className="nav-right">
        <div className="lang-dropdown-wrapper" ref={dropdownRef}>
          <button className="lang-btn" id="lang-toggle" onClick={() => setLangDropdownOpen(!langDropdownOpen)} aria-expanded={langDropdownOpen} aria-haspopup="listbox">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="lang-globe-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
            <span>{languageDisplayMap[language]}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={`lang-chevron ${langDropdownOpen ? 'open' : ''}`}><path d="M7 10l5 5 5-5z" /></svg>
          </button>
          {langDropdownOpen && (
            <div className="lang-dropdown" role="listbox" aria-label={t('lang.selectLanguage')}>
              <button className={`lang-option ${language === 'en' ? 'active' : ''}`} role="option" aria-selected={language === 'en'} onClick={() => handleLanguageSelect('en')}><span className="lang-option-label">English</span><span className="lang-option-native">EN</span>{language === 'en' && <span className="lang-check">✓</span>}</button>
              <button className={`lang-option ${language === 'hi' ? 'active' : ''}`} role="option" aria-selected={language === 'hi'} onClick={() => handleLanguageSelect('hi')}><span className="lang-option-label">हिंदी</span><span className="lang-option-native">HI</span>{language === 'hi' && <span className="lang-check">✓</span>}</button>
              <button className={`lang-option ${language === 'mr' ? 'active' : ''}`} role="option" aria-selected={language === 'mr'} onClick={() => handleLanguageSelect('mr')}><span className="lang-option-label">मराठी</span><span className="lang-option-native">MR</span>{language === 'mr' && <span className="lang-check">✓</span>}</button>
            </div>
          )}
        </div>

        <button className="notif-btn" id="notif-btn" aria-label={t('header.notifications')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
          <span className="notif-badge">3</span>
        </button>

        <div className="user-profile-wrapper" ref={userMenuRef}>
          <div className="user-profile" id="user-profile-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="user-avatar-initials" id="user-avatar-img">{userInitials}</div>
            <div className="user-info">
              <span className="user-name">{user?.fullName || 'User'}</span>
              <span className="user-loc">{user?.location ? `${t('auth.farmerLabel')} | ${user.location}` : t('header.userRole')}</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#333" className={`lang-chevron ${userMenuOpen ? 'open' : ''}`}><path d="M7 10l5 5 5-5z" /></svg>
          </div>
          {userMenuOpen && (
            <div className="user-menu-dropdown">
              <div className="user-menu-header">
                <div className="user-avatar-initials large">{userInitials}</div>
                <div>
                  <div className="user-menu-name">{user?.fullName}</div>
                  <div className="user-menu-phone">{user?.phone}</div>
                </div>
              </div>
              <div className="user-menu-divider"></div>
              <button className="user-menu-item" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
