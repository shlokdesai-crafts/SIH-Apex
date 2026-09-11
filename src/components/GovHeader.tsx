import { useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import './GovHeader.css';

interface GovHeaderProps {
  onToggleSidebar?: () => void;
}

const GovHeader = ({ onToggleSidebar }: GovHeaderProps) => {
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
          <button 
            onClick={onToggleSidebar} 
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
          >
            ☰
          </button>
          <span className="gov-logo-icon">🌿</span>
          <div className="gov-logo-text">
            <h2>CropGuard</h2>
            <p>Government Portal | Maharashtra Agriculture Department</p>
          </div>
        </div>
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
          </div>
          <button className="gov-logout-btn" onClick={handleLogout} title="Logout">
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default GovHeader;
