import { useTranslation } from '../i18n/useTranslation';
import { useEffect, useState, useCallback } from 'react';
import './RecentSubmissions.css';
import { GOV_SUBMISSIONS, GOV_SUMMARY_STATS } from '../services/govDataService';
interface Submission {
  id: number;
  farmer_name: string;
  location: string;
  crop: string;
  ai_result: string;
  disease: string | null;
  confidence: number | null;
  severity: string | null;
  status: string;
  created_at: string;
}
const API = 'http://localhost:8000/api';
const statusClass = (status: string) => {
  if (status === 'Resolved') return 'success';
  if (status === 'Unidentified') return 'danger';
  if (status === 'Assigned') return 'info';
  return 'warning'; // Pending
};
const DEFAULT_SUBMISSIONS: Submission[] = GOV_SUBMISSIONS.map(s => ({
  id: s.id,
  farmer_name: s.farmerName,
  location: s.location,
  crop: s.crop,
  ai_result: s.aiResult,
  disease: s.issue || null,
  confidence: s.confidence,
  severity: s.severity,
  status: s.status === 'Needs Visit' ? 'Assigned' : s.status,
  created_at: s.date || new Date().toISOString()
}));
const RecentSubmissions = () => {
  const {
    t
  } = useTranslation();
  const [submissions, setSubmissions] = useState<Submission[]>(DEFAULT_SUBMISSIONS);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    total: GOV_SUMMARY_STATS.totalSubmissions,
    pending: GOV_SUMMARY_STATS.needsFieldVisit,
    resolved: GOV_SUMMARY_STATS.issuesResolved,
    unidentified: GOV_SUMMARY_STATS.unidentifiedCases
  });
  const [loading, setLoading] = useState(false);
  const fetchStats = useCallback(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(s => {
      if (s && s.total_submissions !== undefined) {
        setCounts({
          total: s.total_submissions,
          pending: s.needs_field_visit,
          resolved: s.resolved,
          unidentified: s.unidentified
        });
      }
    }).catch(() => {});
  }, []);
  const fetchSubmissions = useCallback((statusFilter: string | null) => {
    setLoading(true);
    const url = statusFilter ? `${API}/submissions?status=${statusFilter}&limit=50` : `${API}/submissions?limit=50`;
    fetch(url).then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setSubmissions(data);
      } else {
        const filtered = statusFilter ? DEFAULT_SUBMISSIONS.filter(s => {
          if (statusFilter === 'Pending') return s.status === 'Pending' || s.status === 'Assigned';
          return s.status.toLowerCase() === statusFilter.toLowerCase();
        }) : DEFAULT_SUBMISSIONS;
        setSubmissions(filtered);
      }
    }).catch(() => {
      const filtered = statusFilter ? DEFAULT_SUBMISSIONS.filter(s => {
        if (statusFilter === 'Pending') return s.status === 'Pending' || s.status === 'Assigned';
        return s.status.toLowerCase() === statusFilter.toLowerCase();
      }) : DEFAULT_SUBMISSIONS;
      setSubmissions(filtered);
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    fetchStats();
    fetchSubmissions(null);
    const interval = setInterval(() => {
      fetchStats();
      fetchSubmissions(activeTab);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, fetchStats, fetchSubmissions]);
  const handleTabChange = (tab: string | null) => {
    setActiveTab(tab);
    fetchSubmissions(tab);
  };
  const handleAction = async (sub: Submission) => {
    const endpoint = sub.status === 'Resolved' ? null : sub.status === 'Assigned' ? `${API}/submissions/${sub.id}/resolve` : sub.status === 'Unidentified' ? `${API}/submissions/${sub.id}/assign` : `${API}/submissions/${sub.id}/assign`;
    if (!endpoint) return;
    try {
      await fetch(endpoint, {
        method: 'POST'
      });
    } catch {
      setSubmissions(prev => prev.map(s => {
        if (s.id === sub.id) {
          const nextStatus = s.status === 'Assigned' ? 'Resolved' : 'Assigned';
          return {
            ...s,
            status: nextStatus
          };
        }
        return s;
      }));
    }
    fetchStats();
    fetchSubmissions(activeTab);
  };
  const actionLabel = (status: string) => {
    if (status === 'Resolved') return 'View Advice';
    if (status === 'Assigned') return 'Mark Resolved';
    if (status === 'Unidentified') return 'Assign Officer';
    return 'Assign Officer';
  };
  const actionStyle = (status: string) => {
    if (status === 'Resolved') return 'outline';
    if (status === 'Assigned') return 'success';
    return 'primary';
  };
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };
  return <div className="gov-card recent-submissions">
      <div className="gov-card-header">
        <h3 className="gov-card-title">{t("Recent Farmer Submissions")}</h3>
        <span className="gov-view-all" style={{
        fontSize: '0.8rem',
        color: '#888'
      }}>{t("Auto-refreshes every 10s")}</span>
      </div>

      <div className="gov-tabs">
        <button className={`gov-tab ${activeTab === null ? 'active' : ''}`} onClick={() => handleTabChange(null)}>{t("All (")}{(counts.total ?? 0).toLocaleString()})
        </button>
        <button className={`gov-tab ${activeTab === 'Pending' ? 'active' : ''}`} onClick={() => handleTabChange('Pending')}>{t("Pending (")}{(counts.pending ?? 0).toLocaleString()})
        </button>
        <button className={`gov-tab ${activeTab === 'Resolved' ? 'active' : ''}`} onClick={() => handleTabChange('Resolved')}>{t("Resolved (")}{(counts.resolved ?? 0).toLocaleString()})
        </button>
        <button className={`gov-tab highlight ${activeTab === 'Unidentified' ? 'active' : ''}`} onClick={() => handleTabChange('Unidentified')}>{t("Unidentified (")}{(counts.unidentified ?? 0).toLocaleString()})
        </button>
      </div>

      <div className="gov-table-container">
        {loading ? <p style={{
        padding: '1rem',
        textAlign: 'center',
        color: '#888'
      }}>{t("Loading…")}</p> : submissions.length === 0 ? <p style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#aaa'
      }}>{t("No submissions yet. Farmers will appear here after they submit crop scans.")}</p> : <table className="gov-table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>{t("Icon")}</th>
                <th>{t("Farmer Name")}</th>
                <th>{t("Location")}</th>
                <th>{t("Crop")}</th>
                <th>{t("AI Result")}</th>
                <th>{t("Severity")}</th>
                <th>{t("Date")}</th>
                <th>{t("Status")}</th>
                <th>{t("Action")}</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => <tr key={sub.id}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div className="gov-crop-img-placeholder">🍃</div>
                  </td>
                  <td className="gov-fw-500">{sub.farmer_name}</td>
                  <td>{sub.location}</td>
                  <td>{sub.crop}</td>
                  <td>
                    {sub.ai_result}
                    {sub.confidence !== null && sub.confidence !== undefined ? ` (${(sub.confidence * 100).toFixed(0)}%)` : ''}
                  </td>
                  <td>{sub.severity ?? '—'}</td>
                  <td style={{
              fontSize: '0.78rem',
              color: '#888'
            }}>{formatDate(sub.created_at)}</td>
                  <td>
                    <span className={`gov-status-badge ${statusClass(sub.status)}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td>
                    <button className={`gov-action-btn ${actionStyle(sub.status)}`} onClick={() => handleAction(sub)} disabled={sub.status === 'Resolved'}>
                      {actionLabel(sub.status)}
                    </button>
                  </td>
                </tr>)}
            </tbody>
          </table>}
      </div>
    </div>;
};
export default RecentSubmissions;