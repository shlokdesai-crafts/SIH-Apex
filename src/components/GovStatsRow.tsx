import { useTranslation } from '../i18n/useTranslation';
import { useEffect, useState } from 'react';
import './GovStatsRow.css';
import { GOV_SUMMARY_STATS } from '../services/govDataService';
interface Stats {
  total_submissions: number;
  resolved: number;
  needs_field_visit: number;
  crops_analyzed: number;
  unidentified: number;
}
const GovStatsRow = () => {
  const {
    t
  } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const fetchStats = () => {
    fetch('http://localhost:8000/api/stats').then(r => r.json()).then(data => setStats(data)).catch(() => {/* silently keep previous values */});
  };
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // refresh every 10 s
    return () => clearInterval(interval);
  }, []);
  const fmt = (n: number | undefined) => n !== undefined ? n.toLocaleString('en-IN') : '—';
  return <div className="gov-stats-row">
      <div className="gov-stat-card">
        <div className="gov-stat-icon success-light">
          <span>📷</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">{t("Total Farmer Submissions")}</p>
          <h3 className="gov-stat-value">
            {stats?.total_submissions !== undefined ? fmt(stats.total_submissions) : GOV_SUMMARY_STATS.totalSubmissions.toLocaleString('en-IN')}
          </h3>
          {stats?.total_submissions !== undefined ? <p className="gov-stat-desc">{t("Live from database")}</p> : <p className="gov-stat-trend positive">{GOV_SUMMARY_STATS.totalSubmissionsTrend}</p>}
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon success">
          <span>✅</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">{t("Issues Resolved")}</p>
          <h3 className="gov-stat-value">
            {stats?.resolved !== undefined ? fmt(stats.resolved) : GOV_SUMMARY_STATS.issuesResolved.toLocaleString('en-IN')}
          </h3>
          {stats?.resolved !== undefined ? <p className="gov-stat-desc">{t("Healthy / resolved scans")}</p> : <p className="gov-stat-trend positive">{GOV_SUMMARY_STATS.issuesResolvedTrend}</p>}
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon warning">
          <span>⚠️</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">{t("Needs Field Visit")}</p>
          <h3 className="gov-stat-value">
            {stats?.needs_field_visit !== undefined ? fmt(stats.needs_field_visit) : GOV_SUMMARY_STATS.needsFieldVisit.toLocaleString('en-IN')}
          </h3>
          {stats?.needs_field_visit !== undefined ? <p className="gov-stat-desc">{t("Pending / assigned")}</p> : <p className="gov-stat-trend negative">{GOV_SUMMARY_STATS.needsFieldVisitTrend}</p>}
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon info">
          <span>🌿</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">{t("Crops Analyzed")}</p>
          <h3 className="gov-stat-value">
            {stats?.crops_analyzed !== undefined ? fmt(stats.crops_analyzed) : GOV_SUMMARY_STATS.cropsAnalyzed}
          </h3>
          <p className="gov-stat-desc">
            {stats?.crops_analyzed !== undefined ? 'Distinct crop types' : 'Major crops in Maharashtra'}
          </p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon danger">
          <span>❓</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">{t("Unidentified Cases")}</p>
          <h3 className="gov-stat-value">
            {stats?.unidentified !== undefined ? fmt(stats.unidentified) : GOV_SUMMARY_STATS.unidentifiedCases.toLocaleString('en-IN')}
          </h3>
          {stats?.unidentified !== undefined ? <p className="gov-stat-desc">{t("Could not identify crop")}</p> : <p className="gov-stat-trend negative">{GOV_SUMMARY_STATS.unidentifiedCasesTrend}</p>}
        </div>
      </div>
    </div>;
};
export default GovStatsRow;