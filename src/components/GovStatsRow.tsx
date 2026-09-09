import './GovStatsRow.css';

const GovStatsRow = () => {
  return (
    <div className="gov-stats-row">
      <div className="gov-stat-card">
        <div className="gov-stat-icon success-light">
          <span>📷</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Total Farmer Submissions</p>
          <h3 className="gov-stat-value">12,842</h3>
          <p className="gov-stat-trend positive">↑ 18% vs last month</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon success">
          <span>✅</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Issues Resolved</p>
          <h3 className="gov-stat-value">10,436</h3>
          <p className="gov-stat-trend positive">↑ 22% vs last month</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon warning">
          <span>⚠️</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Needs Field Visit</p>
          <h3 className="gov-stat-value">1,286</h3>
          <p className="gov-stat-trend negative">↑ 5% vs last month</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon info">
          <span>🌿</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Crops Analyzed</p>
          <h3 className="gov-stat-value">18</h3>
          <p className="gov-stat-desc">Major crops in Maharashtra</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon danger">
          <span>❓</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Unidentified Cases</p>
          <h3 className="gov-stat-value">412</h3>
          <p className="gov-stat-trend negative">↑ 12% vs last month</p>
        </div>
      </div>
    </div>
  );
};

export default GovStatsRow;
