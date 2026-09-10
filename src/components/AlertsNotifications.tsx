import './AlertsNotifications.css';

const AlertsNotifications = () => {
  const alerts = [
    { id: 1, type: 'high', title: 'New pest outbreak detected in Jalgaon district', desc: '124 farmer reports', time: '2 hours ago', icon: '🐞' },
    { id: 2, type: 'unident', title: 'Unidentified crop case in Latur taluka', desc: 'Needs field verification', time: '3 hours ago', icon: '❓' },
    { id: 3, type: 'medium', title: 'Water stress reports increasing in Marathwada', desc: '3 districts affected', time: '5 hours ago', icon: '💧' },
    { id: 4, type: 'low', title: 'Weather Alert: Heavy rainfall expected in Konkan region', desc: 'Next 48 hours', time: '6 hours ago', icon: '🌧️' },
  ];

  return (
    <div className="gov-card alerts-card">
      <div className="gov-card-header">
        <h3 className="gov-card-title">Alerts & Notifications</h3>
        <a href="#" className="gov-view-all">View All →</a>
      </div>
      <div className="alerts-list">
        {alerts.map((alert) => (
          <div key={alert.id} className="alert-item">
            <div className={`alert-icon ${alert.type}`}>{alert.icon}</div>
            <div className="alert-content">
              <span className={`alert-badge ${alert.type}`}>
                {alert.type === 'unident' ? 'Unidentified' : alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
              </span>
              <h4 className="alert-title">{alert.title}</h4>
              <p className="alert-desc">{alert.desc}</p>
              <span className="alert-time">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsNotifications;
