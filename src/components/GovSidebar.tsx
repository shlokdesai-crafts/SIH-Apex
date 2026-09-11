import './GovSidebar.css';

interface GovSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

const GovSidebar = ({ activeTab = 'dashboard', onSelectTab }: GovSidebarProps) => {
  return (
    <aside className="gov-sidebar">
      <ul className="gov-sidebar-nav">
        <li 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => onSelectTab?.('dashboard')}
        >
          <span className="icon">🏠</span> Dashboard
        </li>
        <li><span className="icon">📄</span> Farmer Submissions</li>
        <li>
          <span className="icon">📍</span> Needs Field Visit
          <span className="badge warning">24</span>
        </li>
        <li>
          <span className="icon">❓</span> AI Unidentified
          <span className="badge danger">8</span>
        </li>
        <li><span className="icon">📊</span> District Insights</li>
        <li 
          className={activeTab === 'crop-health' ? 'active' : ''}
          onClick={() => onSelectTab?.('crop-health')}
        >
          <span className="icon">🌿</span> Crop Health
        </li>
        <li><span className="icon">💡</span> Advisories</li>
        <li><span className="icon">🏛️</span> Schemes</li>
        <li><span className="icon">📑</span> Reports</li>
        <li><span className="icon">👥</span> Team Management</li>
        <li><span className="icon">⚙️</span> Settings</li>
      </ul>
    </aside>
  );
};

export default GovSidebar;
