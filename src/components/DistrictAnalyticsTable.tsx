import './DistrictAnalyticsTable.css';
import { MAHARASHTRA_DISTRICTS } from '../services/govDataService';

const DistrictAnalyticsTable = () => {
  const districts = MAHARASHTRA_DISTRICTS.slice(0, 6).map(d => ({
    name: d.name,
    total: d.total.toLocaleString(),
    resolved: d.resolved.toLocaleString(),
    needsVisit: d.needsVisit,
    unident: d.unident,
  }));

  return (
    <div className="gov-card district-analytics">
      <div className="gov-card-header">
        <h3 className="gov-card-title">District-wise Cases</h3>
        <a href="#" className="gov-view-all">View All →</a>
      </div>
      <div className="gov-table-container">
        <table className="gov-table text-right">
          <thead>
            <tr>
              <th className="text-left">District</th>
              <th>Total</th>
              <th>Resolved</th>
              <th className="text-danger">Needs Visit</th>
              <th className="text-purple">Unidentified</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((d, i) => (
              <tr key={i}>
                <td className="text-left gov-fw-500">{d.name}</td>
                <td>{d.total}</td>
                <td>{d.resolved}</td>
                <td className="text-danger">{d.needsVisit}</td>
                <td className="text-purple">{d.unident}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DistrictAnalyticsTable;
