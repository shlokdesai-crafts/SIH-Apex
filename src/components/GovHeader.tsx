import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import './GovHeader.css';

const GovHeader = () => {
  const { user, logout } = useContext(AuthContext);

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'GO';

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="gov-header">
      <div className="gov-header-left">
        <div className="gov-logo-container">
          <span className="gov-logo-icon">🌿</span>
          <div className="gov-logo-text">
            <h2>CropGuard</h2>
            <p>Government Portal | Maharashtra Agriculture Department</p>
          </div>
        </div>
      </div>
      
      <div className="gov-header-nav">
        <button className="gov-nav-btn active">
          <span className="icon">🏠</span> Dashboard
        </button>
        <button className="gov-nav-btn">
          <span className="icon">📄</span> Farmer Submissions
        </button>
        <button className="gov-nav-btn">
          <span className="icon">📍</span> Field Visits
        </button>
        <button className="gov-nav-btn">
          <span className="icon">📚</span> Knowledge Base
        </button>
        <button className="gov-nav-btn">
          <span className="icon">📊</span> Reports
        </button>
        <button className="gov-nav-btn">
          <span className="icon">🏛️</span> Schemes
        </button>
      </div>

      <div className="gov-header-right">
        <div className="gov-region-select">
          <select>
            <option>Maharashtra</option>
          </select>
        </div>
        <div className="gov-notifications">
          <span className="icon">🔔</span>
          <span className="badge">12</span>
        </div>
        <div className="gov-user-profile">
          <div className="gov-avatar">{initials}</div>
          <div className="gov-user-info">
            <span className="gov-user-name">{user?.fullName || 'Government Official'}</span>
            <span className="gov-user-role">District Agriculture Officer</span>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: 0, 
                marginTop: '4px', 
                color: '#ff4d4f', 
                fontSize: '12px', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                textAlign: 'left',
                textDecoration: 'underline'
              }}
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GovHeader;
