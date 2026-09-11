import './GovStatsRow.css';
import { GOV_SUMMARY_STATS } from '../services/govDataService';

const GovStatsRow = () => {
  return (
    <div className="gov-stats-row">
      <div className="gov-stat-card">
        <div className="gov-stat-icon success-light">
          <span>📷</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Total Farmer Submissions</p>
          <h3 className="gov-stat-value">{GOV_SUMMARY_STATS.totalSubmissions.toLocaleString()}</h3>
          <p className="gov-stat-trend positive">{GOV_SUMMARY_STATS.totalSubmissionsTrend}</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon success">
          <span>✅</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Issues Resolved</p>
          <h3 className="gov-stat-value">{GOV_SUMMARY_STATS.issuesResolved.toLocaleString()}</h3>
          <p className="gov-stat-trend positive">{GOV_SUMMARY_STATS.issuesResolvedTrend}</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon warning">
          <span>⚠️</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Needs Field Visit</p>
          <h3 className="gov-stat-value">{GOV_SUMMARY_STATS.needsFieldVisit.toLocaleString()}</h3>
          <p className="gov-stat-trend negative">{GOV_SUMMARY_STATS.needsFieldVisitTrend}</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon info">
          <span>🌿</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Crops Analyzed</p>
          <h3 className="gov-stat-value">{GOV_SUMMARY_STATS.cropsAnalyzed}</h3>
          <p className="gov-stat-desc">Major crops in Maharashtra</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon danger">
          <span>❓</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Unidentified Cases</p>
          <h3 className="gov-stat-value">{GOV_SUMMARY_STATS.unidentifiedCases.toLocaleString()}</h3>
          <p className="gov-stat-trend negative">{GOV_SUMMARY_STATS.unidentifiedCasesTrend}</p>
        </div>
      </div>
    </div>
  );
};

export default GovStatsRow;
