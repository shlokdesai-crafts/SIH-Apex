import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import './GovHeader.css';

interface GovHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const GovHeader = ({ activeTab, onTabChange }: GovHeaderProps = {}) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSwitchToFarmer = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.fullName || 'S. Deshmukh';

  return (
    <header className="gov-header">
      <div className="gov-header-left">
        <div className="gov-logo-container">
          <div className="gov-logo-leaf">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 26, height: 26 }}>
              <path d="M16 28V16M16 16C16 10 21 6 27 6C27 12 23 17 16 16ZM16 16C16 10 11 6 5 6C5 12 9 17 16 16Z" stroke="#86efac" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="#22c55e" fillOpacity="0.4" />
            </svg>
          </div>
          <div className="gov-logo-text">
            <h2>CropGuard</h2>
            <p>Government Portal</p>
            <p className="gov-logo-dept">Maharashtra Agriculture Department</p>
          </div>
        </div>
      </div>
      
      <div className="gov-header-nav">
        <button
          className={`gov-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange?.('dashboard')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          Dashboard
        </button>
        <button
          className={`gov-nav-btn ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => onTabChange?.('submissions')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </span>
          Farmer Submissions
        </button>
        <button
          className={`gov-nav-btn ${activeTab === 'field-visits' ? 'active' : ''}`}
          onClick={() => onTabChange?.('field-visits')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          Field Visits
        </button>
        <button
          className={`gov-nav-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => onTabChange?.('knowledge')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </span>
          Knowledge Base
        </button>
        <button
          className={`gov-nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => onTabChange?.('reports')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          Reports
        </button>
        <button
          className={`gov-nav-btn ${activeTab === 'schemes' ? 'active' : ''}`}
          onClick={() => onTabChange?.('schemes')}
        >
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
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
        </button>
      </div>

      <div className="gov-header-right">
        <div className="gov-region-select">
          <select defaultValue="Maharashtra">
            <option value="Maharashtra">Maharashtra</option>
          </select>
          <span className="gov-select-arrow">▾</span>
        </div>
        <div className="gov-notifications" title="12 Notifications">
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span className="badge">12</span>
        </div>
        <div className="gov-user-profile" title="Officer Profile">
          <div className="gov-avatar">SD</div>
          <div className="gov-user-info">
            <span className="gov-user-name">{displayName}</span>
            <span className="gov-user-role">District Agriculture Officer ▾</span>
          </div>
        </div>
        <button
          className="gov-switch-portal-btn"
          onClick={handleSwitchToFarmer}
          title="Switch to Farmer Portal"
        >
          <span className="icon">👨‍🌾</span>
          <span>Switch to Farmer</span>
        </button>
      </div>
    </header>
  );
};

export default GovHeader;
