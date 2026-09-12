import { useTranslation } from '../i18n/useTranslation';
import './DistrictAnalyticsTable.css';
import { MAHARASHTRA_DISTRICTS } from '../services/govDataService';
const DistrictAnalyticsTable = () => {
  const {
    t
  } = useTranslation();
  const districts = MAHARASHTRA_DISTRICTS.slice(0, 6).map(d => ({
    name: d.name,
    total: d.total.toLocaleString(),
    resolved: d.resolved.toLocaleString(),
    needsVisit: d.needsVisit,
    unident: d.unident
  }));
  return <div className="gov-card district-analytics">
      <div className="gov-card-header">
        <h3 className="gov-card-title">{t("District-wise Cases")}</h3>
        <a href="#" className="gov-view-all">{t("View All →")}</a>
      </div>
      <div className="gov-table-container">
        <table className="gov-table text-right">
          <thead>
            <tr>
              <th className="text-left">{t("District")}</th>
              <th>{t("Total")}</th>
              <th>{t("Resolved")}</th>
              <th className="text-danger">{t("Needs Visit")}</th>
              <th className="text-purple">{t("Unidentified")}</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((d, i) => <tr key={i}>
                <td className="text-left gov-fw-500">{d.name}</td>
                <td>{d.total}</td>
                <td>{d.resolved}</td>
                <td className="text-danger">{d.needsVisit}</td>
                <td className="text-purple">{d.unident}</td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export default DistrictAnalyticsTable;