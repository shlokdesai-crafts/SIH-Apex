import './GovSidebar.css';

const GovSidebar = () => {
  return (
    <aside className="gov-sidebar">
      <ul className="gov-sidebar-nav">
        <li className="active"><span className="icon">🏠</span> Dashboard</li>
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
        <li><span className="icon">🌿</span> Crop Health</li>
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
