import { useEffect, useState } from 'react';
import './GovStatsRow.css';

interface Stats {
  total_submissions: number;
  resolved: number;
  needs_field_visit: number;
  crops_analyzed: number;
  unidentified: number;
}

const GovStatsRow = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = () => {
    fetch('http://localhost:8000/api/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {/* silently keep previous values */});
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // refresh every 10 s
    return () => clearInterval(interval);
  }, []);

  const fmt = (n: number | undefined) =>
    n !== undefined ? n.toLocaleString('en-IN') : '—';

  return (
    <div className="gov-stats-row">
      <div className="gov-stat-card">
        <div className="gov-stat-icon success-light">
          <span>📷</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Total Farmer Submissions</p>
          <h3 className="gov-stat-value">{fmt(stats?.total_submissions)}</h3>
          <p className="gov-stat-desc">Live from database</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon success">
          <span>✅</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Issues Resolved</p>
          <h3 className="gov-stat-value">{fmt(stats?.resolved)}</h3>
          <p className="gov-stat-desc">Healthy / resolved scans</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon warning">
          <span>⚠️</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Needs Field Visit</p>
          <h3 className="gov-stat-value">{fmt(stats?.needs_field_visit)}</h3>
          <p className="gov-stat-desc">Pending / assigned</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon info">
          <span>🌿</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Crops Analyzed</p>
          <h3 className="gov-stat-value">{fmt(stats?.crops_analyzed)}</h3>
          <p className="gov-stat-desc">Distinct crop types</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon danger">
          <span>❓</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">Unidentified Cases</p>
          <h3 className="gov-stat-value">{fmt(stats?.unidentified)}</h3>
          <p className="gov-stat-desc">Could not identify crop</p>
        </div>
      </div>
    </div>
  );
};

export default GovStatsRow;
