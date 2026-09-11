import './GovHeader.css';

interface GovHeaderProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

const GovHeader = ({ activeTab = 'dashboard', onSelectTab }: GovHeaderProps) => {
  return (
    <header className="gov-header">
      <div className="gov-header-left" style={{ cursor: 'pointer' }} onClick={() => onSelectTab?.('dashboard')}>
        <div className="gov-logo-container">
          <span className="gov-logo-icon">🌿</span>
          <div className="gov-logo-text">
            <h2>CropGuard</h2>
            <p>Government Portal | Maharashtra Agriculture Department</p>
          </div>
        </div>
      </div>
      
      <div className="gov-header-nav">
        <button 
          className={`gov-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectTab?.('dashboard')}
        >
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
          <div className="gov-avatar">SD</div>
          <div className="gov-user-info">
            <span className="gov-user-name">S. Deshmukh</span>
            <span className="gov-user-role">District Agriculture Officer</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GovHeader;
