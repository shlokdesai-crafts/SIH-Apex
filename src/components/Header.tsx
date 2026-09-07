import React from 'react';

interface HeaderProps {
  activeNav: string;
  onNavigate: (navId: string) => void;
}

export default function Header({ activeNav, onNavigate }: HeaderProps) {

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, navId: string) => {
    e.preventDefault();
    onNavigate(navId);
  };

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
          <span className="nav-title">CropGuard</span>
          <span className="nav-subtitle">Healthy Crops. Stronger Maharashtra</span>
        </div>
      </div>

      <nav className="nav-links" id="main-nav">
        <a href="#" className={`nav-link ${activeNav === 'home' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'home')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </a>
        <a href="#" className={`nav-link ${activeNav === 'scan' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'scan')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M3 9V5a2 2 0 0 1 2-2h4M3 15v4a2 2 0 0 0 2 2h4M21 9V5a2 2 0 0 0-2-2h-4M21 15v4a2 2 0 0 1-2 2h-4" />
          </svg>
          Scan Crop
        </a>
        <a href="#" className={`nav-link ${activeNav === 'risk' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'risk')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Risk Forecast
        </a>
        <a href="#" className={`nav-link ${activeNav === 'farm' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'farm')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          My Farm
        </a>
        <a href="#" className={`nav-link ${activeNav === 'advisory' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'advisory')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Advisory
        </a>
        <a href="#" className={`nav-link ${activeNav === 'more' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'more')}>
          <span className="more-dots">•••</span>
          More
        </a>
      </nav>

      <div className="nav-right">
        <button className="lang-btn" id="lang-toggle">
          <span>English</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        <button className="notif-btn" id="notif-btn" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          <span className="notif-badge">3</span>
        </button>
        <div className="user-profile" id="user-profile-btn">
          <img src="images/ramesh_avatar.jpg" alt="Ramesh Patil" className="user-avatar" id="user-avatar-img" />
          <div className="user-info">
            <span className="user-name">Ramesh Patil</span>
            <span className="user-loc">Farmer | Akola, Maharashtra</span>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#333">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
      </div>
    </header>
  );
}
