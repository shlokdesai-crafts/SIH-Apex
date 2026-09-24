import { useTranslation } from '../i18n/useTranslation';
import { useEffect, useState, useCallback } from 'react';
import './RecentSubmissions.css';

interface Submission {
  id: string;
  farmer_name: string;
  location: string;
  crop: string;
  ai_result: string;
  disease?: string | null;
  confidence?: number | null;
  severity?: string | null;
  status: string;
  created_at: string;
  assigned_officer?: string | null;
  resolution_notes?: string | null;
}

interface Officer {
  id: string;
  name: string;
  role: string;
  district: string;
}

const API = '/api';

const statusClass = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'resolved') return 'success';
  if (s === 'unidentified' || s.includes('unidentified')) return 'danger';
  if (s === 'assigned') return 'info';
  return 'warning';
};

const RecentSubmissions = () => {
  const { t } = useTranslation();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    unidentified: 0,
  });
  const [loading, setLoading] = useState(false);
  const [officers, setOfficers] = useState<Officer[]>([]);

  // Assign Officer Modal state
  const [assigningSub, setAssigningSub] = useState<Submission | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Fetch Officers List
  useEffect(() => {
    fetch(`${API}/field-officers`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOfficers(data);
      })
      .catch((e) => console.error('Error fetching officers:', e));
  }, []);

  const fetchStats = useCallback(() => {
    fetch(`${API}/stats`)
      .then((r) => r.json())
      .then((s) => {
        if (s && s.total_submissions !== undefined) {
          setCounts({
            total: s.total_submissions,
            pending: s.needs_field_visit,
            resolved: s.resolved,
            unidentified: s.unidentified,
          });
        }
      })
      .catch(() => {});
  }, []);

  const fetchSubmissions = useCallback((statusFilter: string | null) => {
    setLoading(true);
    const url = statusFilter
      ? `${API}/submissions?status=${encodeURIComponent(statusFilter)}&limit=50`
      : `${API}/submissions?limit=50`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubmissions(data);
        } else {
          setSubmissions([]);
        }
      })
      .catch((e) => {
        console.error('Error fetching submissions:', e);
        setSubmissions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
    fetchSubmissions(activeTab);
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

  const handleActionClick = (sub: Submission) => {
    const s = sub.status.toLowerCase();
    if (s === 'resolved') {
      return;
    }
    if (s === 'assigned') {
      // Mark as Resolved
      handleResolveCase(sub.id);
    } else {
      // Open Assign Officer modal
      setAssigningSub(sub);
      setSelectedOfficer(officers[0]?.name || 'Rajesh Patil');
    }
  };

  const handleResolveCase = async (subId: string) => {
    setActionLoading(true);
    try {
      await fetch(`${API}/submissions/${subId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes: 'Resolved by District Officer via Government Dashboard' }),
      });
      fetchStats();
      fetchSubmissions(activeTab);
    } catch (e) {
      console.error('Error resolving case:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assigningSub || !selectedOfficer) return;
    setActionLoading(true);
    try {
      await fetch(`${API}/submissions/${assigningSub.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_officer: selectedOfficer }),
      });
      setAssigningSub(null);
      fetchStats();
      fetchSubmissions(activeTab);
    } catch (e) {
      console.error('Error assigning officer:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const actionLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'resolved') return 'Resolved';
    if (s === 'assigned') return 'Mark Resolved';
    return 'Assign Officer';
  };

  const actionStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'resolved') return 'outline';
    if (s === 'assigned') return 'success';
    return 'primary';
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="gov-card recent-submissions">
      <div className="gov-card-header">
        <h3 className="gov-card-title">{t("Recent Farmer Submissions")}</h3>
        <span className="gov-view-all" style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {t("Live Field Intelligence")}
        </span>
      </div>

      <div className="gov-tabs">
        <button
          className={`gov-tab ${activeTab === null ? 'active' : ''}`}
          onClick={() => handleTabChange(null)}
        >
          {t("All")} ({(counts.total ?? 0).toLocaleString()})
        </button>
        <button
          className={`gov-tab ${activeTab === 'Pending' ? 'active' : ''}`}
          onClick={() => handleTabChange('Pending')}
        >
          {t("Pending")} ({(counts.pending ?? 0).toLocaleString()})
        </button>
        <button
          className={`gov-tab ${activeTab === 'Resolved' ? 'active' : ''}`}
          onClick={() => handleTabChange('Resolved')}
        >
          {t("Resolved")} ({(counts.resolved ?? 0).toLocaleString()})
        </button>
        <button
          className={`gov-tab highlight ${activeTab === 'Unidentified' ? 'active' : ''}`}
          onClick={() => handleTabChange('Unidentified')}
        >
          {t("Unidentified")} ({(counts.unidentified ?? 0).toLocaleString()})
        </button>
      </div>

      <div className="gov-table-container">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            {t("Loading active submissions...")}
          </p>
        ) : submissions.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            {t("No submissions found matching filter.")}
          </p>
        ) : (
          <table className="gov-table">
            <thead>
              <tr>
                <th>#Case ID</th>
                <th>{t("Farmer Name")}</th>
                <th>{t("Location")}</th>
                <th>{t("Crop")}</th>
                <th>{t("AI Result")}</th>
                <th>{t("Severity")}</th>
                <th>{t("Assigned Officer")}</th>
                <th>{t("Date")}</th>
                <th>{t("Status")}</th>
                <th>{t("Action")}</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="case-id-code">#{sub.id.substring(sub.id.length - 6).toUpperCase()}</td>
                  <td className="gov-fw-500">{sub.farmer_name}</td>
                  <td>📍 {sub.location}</td>
                  <td>🌾 {sub.crop}</td>
                  <td>
                    <strong>{sub.disease || sub.ai_result}</strong>
                    {sub.confidence !== null && sub.confidence !== undefined
                      ? ` (${(sub.confidence * 100).toFixed(0)}%)`
                      : ''}
                  </td>
                  <td>{sub.severity ?? 'Medium'}</td>
                  <td>
                    {sub.assigned_officer ? (
                      <span className="officer-pill">👤 {sub.assigned_officer}</span>
                    ) : (
                      <span className="unassigned-text">{t("Unassigned")}</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{formatDate(sub.created_at)}</td>
                  <td>
                    <span className={`gov-status-badge ${statusClass(sub.status)}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`gov-action-btn ${actionStyle(sub.status)}`}
                      onClick={() => handleActionClick(sub)}
                      disabled={sub.status.toLowerCase() === 'resolved' || actionLoading}
                    >
                      {actionLabel(sub.status)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Officer Modal */}
      {assigningSub && (
        <div className="gov-modal-overlay">
          <div className="gov-modal-content">
            <h4>👤 {t("Assign Extension Field Officer")}</h4>
            <p>Case #{assigningSub.id.substring(assigningSub.id.length - 6).toUpperCase()} — {assigningSub.farmer_name} ({assigningSub.crop})</p>

            <div className="modal-field">
              <label>{t("Select Government Officer")}:</label>
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
              >
                {officers.map((off) => (
                  <option key={off.id} value={off.name}>
                    {off.name} ({off.role} - {off.district})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setAssigningSub(null)}>
                {t("Cancel")}
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirmAssign}
                disabled={actionLoading}
              >
                {actionLoading ? t("Assigning...") : t("Confirm Assignment")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentSubmissions;
