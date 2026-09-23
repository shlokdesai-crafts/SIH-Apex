import { useTranslation } from '../i18n/useTranslation';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GovStatsRow.css';

interface Stats {
  total_submissions: number;
  resolved: number;
  needs_field_visit: number;
  crops_analyzed: number;
  unidentified: number;
}

interface GovStatsRowProps {
  onSelectFilter?: (filter: string) => void;
}

const GovStatsRow = ({ onSelectFilter }: GovStatsRowProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching live stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (n: number | undefined) => (n !== undefined ? n.toLocaleString('en-IN') : '0');

  const handleCardClick = (filterType: string) => {
    if (onSelectFilter) {
      onSelectFilter(filterType);
    }

    if (filterType === 'unidentified') {
      const unidentEl = document.getElementById('unidentified-cases-section');
      if (unidentEl) {
        unidentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigate('/case-management');
      }
    } else if (filterType === 'field-visits') {
      navigate('/case-management');
    } else if (filterType === 'all') {
      navigate('/case-management');
    }
  };

  return (
    <div className="gov-stats-row">
      <div
        className="gov-stat-card clickable"
        onClick={() => handleCardClick('all')}
        title="View All Submissions"
      >
        <div className="gov-stat-icon success-light">
          <span>📷</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">{t("Total Farmer Submissions")}</p>
          <h3 className="gov-stat-value">
            {loading ? '...' : fmt(stats?.total_submissions)}
          </h3>
          <p className="gov-stat-desc">{t("Official Department System")}</p>
        </div>
      </div>

      <div
        className="gov-stat-card clickable"
        onClick={() => handleCardClick('resolved')}
        title="View Resolved Cases"
      >
        <div className="gov-stat-icon success">
          <span>✅</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">{t("Issues Resolved")}</p>
          <h3 className="gov-stat-value">
            {loading ? '...' : fmt(stats?.resolved)}
          </h3>
          <p className="gov-stat-desc">{t("Cleared & Healthy Crops")}</p>
        </div>
      </div>

      <div
        className="gov-stat-card clickable"
        onClick={() => handleCardClick('field-visits')}
        title="View Field Visits"
      >
        <div className="gov-stat-icon warning">
          <span>⚠️</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">{t("Needs Field Visit")}</p>
          <h3 className="gov-stat-value">
            {loading ? '...' : fmt(stats?.needs_field_visit)}
          </h3>
          <p className="gov-stat-desc">{t("Assigned / Inspection Pending")}</p>
        </div>
      </div>

      <div className="gov-stat-card">
        <div className="gov-stat-icon info">
          <span>🌿</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">{t("Crops Analyzed")}</p>
          <h3 className="gov-stat-value">
            {loading ? '...' : fmt(stats?.crops_analyzed)}
          </h3>
          <p className="gov-stat-desc">{t("Monitored Crop Varieties")}</p>
        </div>
      </div>

      <div
        className="gov-stat-card clickable highlight-danger"
        onClick={() => handleCardClick('unidentified')}
        title="Click to Filter & View Unidentified Cases"
      >
        <div className="gov-stat-icon danger">
          <span>🔬</span>
        </div>
        <div className="gov-stat-info">
          <p className="gov-stat-title">{t("Unidentified Cases")}</p>
          <h3 className="gov-stat-value">
            {loading ? '...' : fmt(stats?.unidentified)}
          </h3>
          <p className="gov-stat-desc action-link">🔍 {t("Click to Review & Identify")}</p>
        </div>
      </div>
    </div>
  );
};

export default GovStatsRow;
