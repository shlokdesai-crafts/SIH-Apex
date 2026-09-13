import { useTranslation } from '../i18n/useTranslation';
import './AlertsNotifications.css';
import { GOV_ALERTS } from '../services/govDataService';
const AlertsNotifications = () => {
  const {
    t
  } = useTranslation();
  const alerts = GOV_ALERTS.slice(0, 4);
  return <div className="gov-card alerts-card">
      <div className="gov-card-header">
        <h3 className="gov-card-title">{t("Alerts & Notifications")}</h3>
        <a href="#" className="gov-view-all">{t("View All →")}</a>
      </div>
      <div className="alerts-list">
        {alerts.map(alert => <div key={alert.id} className="alert-item">
            <div className={`alert-icon ${alert.type}`}>{alert.icon}</div>
            <div className="alert-content">
              <span className={`alert-badge ${alert.type}`}>
                {alert.type === 'unident' ? 'Unidentified' : alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
              </span>
              <h4 className="alert-title">{alert.title}</h4>
              <p className="alert-desc">{alert.desc}</p>
              <span className="alert-time">{alert.time}</span>
            </div>
          </div>)}
      </div>
    </div>;
};
export default AlertsNotifications;