import './RecentSubmissions.css';
import { GOV_SUBMISSIONS, GOV_SUMMARY_STATS } from '../services/govDataService';

const RecentSubmissions = () => {
  const submissions = GOV_SUBMISSIONS.slice(0, 5).map(s => ({
    id: s.id,
    name: s.farmerName,
    location: s.location,
    crop: s.crop,
    aiResult: s.aiResult,
    status: s.status,
    actionText: s.actionText,
  }));

  return (
    <div className="gov-card recent-submissions">
      <div className="gov-card-header">
        <h3 className="gov-card-title">Recent Farmer Submissions</h3>
        <a href="#" className="gov-view-all">View All →</a>
      </div>
      
      <div className="gov-tabs">
        <button className="gov-tab active">All ({GOV_SUMMARY_STATS.totalSubmissions.toLocaleString()})</button>
        <button className="gov-tab">Pending ({GOV_SUMMARY_STATS.needsFieldVisit.toLocaleString()})</button>
        <button className="gov-tab">Resolved ({GOV_SUMMARY_STATS.issuesResolved.toLocaleString()})</button>
        <button className="gov-tab highlight">Unidentified ({GOV_SUMMARY_STATS.unidentifiedCases.toLocaleString()})</button>
      </div>

      <div className="gov-table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Image</th>
              <th>Farmer Name</th>
              <th>Location</th>
              <th>Crop</th>
              <th>AI Result</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id}>
                <td><input type="checkbox" /></td>
                <td>
                  <div className="gov-crop-img-placeholder">🍃</div>
                </td>
                <td className="gov-fw-500">{sub.name}</td>
                <td>{sub.location}</td>
                <td>{sub.crop}</td>
                <td>{sub.aiResult}</td>
                <td>
                  <span className={`gov-status-badge ${sub.status === 'Resolved' ? 'success' : 'warning'}`}>
                    {sub.status}
                  </span>
                </td>
                <td>
                  <button className={`gov-action-btn ${sub.status === 'Resolved' ? 'outline' : 'primary'}`}>
                    {sub.actionText}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentSubmissions;
