import { useTranslation } from '../i18n/useTranslation';
import './DistrictInsightsPage.css';
import { MAHARASHTRA_DISTRICTS } from '../services/govDataService';

const DistrictInsightsPage = () => {
  const { t } = useTranslation();

  // Aggregate some totals
  const totalCases = MAHARASHTRA_DISTRICTS.reduce((acc, d) => acc + d.total, 0);
  const totalResolved = MAHARASHTRA_DISTRICTS.reduce((acc, d) => acc + d.resolved, 0);
  const totalNeedsVisit = MAHARASHTRA_DISTRICTS.reduce((acc, d) => acc + d.needsVisit, 0);
  const totalUnident = MAHARASHTRA_DISTRICTS.reduce((acc, d) => acc + d.unident, 0);

  return (
    <div className="district-insights-page page-layout fade-in">
      <div className="insights-overview-cards">
        <div className="gov-card stat-card primary">
          <h3>{t("Total Cases")}</h3>
          <p className="stat-value">{totalCases.toLocaleString()}</p>
        </div>
        <div className="gov-card stat-card success">
          <h3>{t("Resolved")}</h3>
          <p className="stat-value">{totalResolved.toLocaleString()}</p>
        </div>
        <div className="gov-card stat-card warning">
          <h3>{t("Needs Visit")}</h3>
          <p className="stat-value">{totalNeedsVisit.toLocaleString()}</p>
        </div>
        <div className="gov-card stat-card danger">
          <h3>{t("Unidentified")}</h3>
          <p className="stat-value">{totalUnident.toLocaleString()}</p>
        </div>
      </div>

      <div className="gov-card full-page-table">
        <div className="gov-card-header">
          <h3 className="gov-card-title">{t("District-wise Breakdown")}</h3>
          <div className="table-actions">
            <button className="gov-action-btn outline small">{t("Export CSV")}</button>
          </div>
        </div>
        <div className="gov-table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table className="gov-table text-right">
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
              <tr>
                <th className="text-left">{t("District")}</th>
                <th>{t("Total Cases")}</th>
                <th>{t("Resolved")}</th>
                <th>{t("Needs Visit")}</th>
                <th>{t("Unidentified")}</th>
                <th>{t("Resolution Rate")}</th>
              </tr>
            </thead>
            <tbody>
              {MAHARASHTRA_DISTRICTS.map((d, i) => {
                const resolutionRate = ((d.resolved / d.total) * 100).toFixed(1);
                return (
                  <tr key={i}>
                    <td className="text-left gov-fw-500">{d.name}</td>
                    <td>{d.total.toLocaleString()}</td>
                    <td className="text-success">{d.resolved.toLocaleString()}</td>
                    <td className="text-warning">{d.needsVisit}</td>
                    <td className="text-danger">{d.unident}</td>
                    <td>
                      <div className="progress-cell">
                        <span>{resolutionRate}%</span>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${resolutionRate}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DistrictInsightsPage;
