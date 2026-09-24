import { useTranslation } from '../i18n/useTranslation';
import { useState, useEffect } from 'react';
import './UnidentifiedCasesTable.css';

interface UnidentifiedCase {
  id: string;
  farmer_name: string;
  location: string;
  crop: string;
  ai_result: string;
  disease?: string | null;
  severity?: string | null;
  status: string;
  created_at: string;
  assigned_officer?: string | null;
  resolution_notes?: string | null;
  image_url?: string | null;
}

interface Officer {
  id: string;
  name: string;
  role: string;
  district: string;
}

const API = '/api';

const UnidentifiedCasesTable = () => {
  const { t } = useTranslation();

  const [cases, setCases] = useState<UnidentifiedCase[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [viewingCase, setViewingCase] = useState<UnidentifiedCase | null>(null);
  const [assigningCase, setAssigningCase] = useState<UnidentifiedCase | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('');
  const [reviewCase, setReviewCase] = useState<UnidentifiedCase | null>(null);
  const [expertDiagnosis, setExpertDiagnosis] = useState<string>('');

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchUnidentifiedCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/submissions?status=unidentified&limit=50`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCases(data);
        }
      }
    } catch (e) {
      console.error('Error fetching unidentified cases:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidentifiedCases();
    fetch(`${API}/field-officers`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOfficers(data);
      })
      .catch((e) => console.error('Error fetching officers:', e));

    const handleUpdate = () => fetchUnidentifiedCases();
    window.addEventListener('gov-data-updated', handleUpdate);
    return () => window.removeEventListener('gov-data-updated', handleUpdate);
  }, []);

  const handleConfirmAssign = async () => {
    if (!assigningCase || !selectedOfficer) return;
    setActionLoading(true);
    try {
      await fetch(`${API}/submissions/${assigningCase.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_officer: selectedOfficer }),
      });
      setAssigningCase(null);
      window.dispatchEvent(new CustomEvent('gov-data-updated'));
      fetchUnidentifiedCases();
    } catch (e) {
      console.error('Error assigning officer:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDiagnosis = async () => {
    if (!reviewCase || !expertDiagnosis.trim()) return;
    setActionLoading(true);
    try {
      await fetch(`${API}/submissions/${reviewCase.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease: expertDiagnosis.trim(),
          ai_result: expertDiagnosis.trim(),
          status: 'Assigned',
        }),
      });
      setReviewCase(null);
      window.dispatchEvent(new CustomEvent('gov-data-updated'));
      fetchUnidentifiedCases();
    } catch (e) {
      console.error('Error updating diagnosis:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveCase = async (subId: string) => {
    setActionLoading(true);
    try {
      await fetch(`${API}/submissions/${subId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes: 'Diagnosed and resolved by District Agriculture Team' }),
      });
      setViewingCase(null);
      window.dispatchEvent(new CustomEvent('gov-data-updated'));
      fetchUnidentifiedCases();
    } catch (e) {
      console.error('Error resolving case:', e);
    } finally {
      setActionLoading(false);
    }
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
    <div className="gov-card unident-cases" id="unidentified-cases-section">
      <div className="gov-card-header">
        <h3 className="gov-card-title">{t("Unidentified Cases – Expert Review Required")}</h3>
        <span className="gov-view-all">{t("Official Department Review Queue")}</span>
      </div>

      <div className="gov-table-container">
        {loading ? (
          <p style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
            {t("Fetching unidentified cases...")}
          </p>
        ) : cases.length === 0 ? (
          <div className="gov-empty-unidentified">
            <span className="empty-icon">✅</span>
            <h4>{t("No unidentified cases currently")}</h4>
            <p>{t("All submitted scans have been identified and categorized by AI and field experts.")}</p>
          </div>
        ) : (
          <table className="gov-table">
            <thead>
              <tr>
                <th>#Case ID</th>
                <th>{t("Farmer Name")}</th>
                <th>{t("District")}</th>
                <th>{t("Crop")}</th>
                <th>{t("Date")}</th>
                <th>{t("Status")}</th>
                <th>{t("Assigned Officer")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td className="case-id-code">#{c.id.length > 8 ? c.id.substring(c.id.length - 6).toUpperCase() : c.id}</td>
                  <td className="gov-fw-500">{c.farmer_name}</td>
                  <td>📍 {c.location}</td>
                  <td>🌾 {c.crop}</td>
                  <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{formatDate(c.created_at)}</td>
                  <td>
                    <span className="gov-status-badge danger">
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.assigned_officer ? (
                      <span className="officer-pill">👤 {c.assigned_officer}</span>
                    ) : (
                      <span className="unassigned-text">{t("Unassigned")}</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        className="gov-action-btn secondary"
                        onClick={() => setViewingCase(c)}
                        title="View Full Case Details"
                      >
                        {t("Open Case")}
                      </button>

                      <button
                        className="gov-action-btn primary"
                        onClick={() => {
                          setReviewCase(c);
                          setExpertDiagnosis(c.disease && !c.disease.toLowerCase().includes('unidentified') ? c.disease : 'Fungal Leaf Spot');
                        }}
                      >
                        {t("Review/Identify")}
                      </button>

                      <button
                        className="gov-action-btn outline"
                        onClick={() => {
                          setAssigningCase(c);
                          setSelectedOfficer(officers[0]?.name || 'Rajesh Patil');
                        }}
                      >
                        {t("Assign Visit")}
                      </button>

                      <button
                        className="gov-action-btn success"
                        style={{ background: '#10b981', color: '#fff', border: 'none' }}
                        onClick={() => handleResolveCase(c.id)}
                        disabled={actionLoading}
                        title="Resolve Case"
                      >
                        {t("Resolve")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Open Case Detail Modal */}
      {viewingCase && (
        <div className="gov-modal-overlay">
          <div className="gov-modal-content">
            <h4>📋 {t("Case Details Drawer")}</h4>
            <p className="sub">
              Case #{viewingCase.id.substring(viewingCase.id.length - 6).toUpperCase()} — {viewingCase.farmer_name}
            </p>

            <div className="case-detail-rows">
              <div>
                <strong>{t("Farmer Name")}:</strong> {viewingCase.farmer_name}
              </div>
              <div>
                <strong>{t("District Location")}:</strong> 📍 {viewingCase.location}
              </div>
              <div>
                <strong>{t("Crop Species")}:</strong> 🌾 {viewingCase.crop}
              </div>
              <div>
                <strong>{t("AI Result")}:</strong> 🧪 {viewingCase.ai_result || 'Unidentified Scan'}
              </div>
              <div>
                <strong>{t("Status")}:</strong> <span className="gov-status-badge danger">{viewingCase.status}</span>
              </div>
              <div>
                <strong>{t("Submission Date")}:</strong> 📅 {formatDate(viewingCase.created_at)}
              </div>
              {viewingCase.assigned_officer && (
                <div>
                  <strong>{t("Assigned Field Officer")}:</strong> 👤 {viewingCase.assigned_officer}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                className="btn-confirm"
                onClick={() => {
                  const target = viewingCase;
                  setViewingCase(null);
                  setReviewCase(target);
                  setExpertDiagnosis(target.disease && target.disease !== 'AI Unidentified' ? target.disease : 'Fungal Leaf Spot');
                }}
              >
                🔬 {t("Identify Disease")}
              </button>
              <button
                className="btn-confirm secondary"
                onClick={() => handleResolveCase(viewingCase.id)}
                disabled={actionLoading}
              >
                ✅ {t("Mark Resolved")}
              </button>
              <button className="btn-cancel" onClick={() => setViewingCase(null)}>
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Identify Disease Modal */}
      {reviewCase && (
        <div className="gov-modal-overlay">
          <div className="gov-modal-content">
            <h4>🔬 {t("Agronomist Expert Disease Diagnosis")}</h4>
            <p>
              Case #{reviewCase.id.substring(reviewCase.id.length - 6).toUpperCase()} — {reviewCase.farmer_name} ({reviewCase.crop})
            </p>

            <div className="modal-field">
              <label>{t("Verified Disease Diagnosis")}:</label>
              <input
                type="text"
                value={expertDiagnosis}
                onChange={(e) => setExpertDiagnosis(e.target.value)}
                placeholder="e.g. Red Rot Disease, Early Blight, Yellow Mosaic Virus..."
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setReviewCase(null)}>
                {t("Cancel")}
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirmDiagnosis}
                disabled={actionLoading || !expertDiagnosis.trim()}
              >
                {actionLoading ? t("Saving...") : t("Save Diagnosis & Assign")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Officer Modal */}
      {assigningCase && (
        <div className="gov-modal-overlay">
          <div className="gov-modal-content">
            <h4>👤 {t("Assign Field Extension Officer")}</h4>
            <p>
              Case #{assigningCase.id.substring(assigningCase.id.length - 6).toUpperCase()} — {assigningCase.farmer_name} ({assigningCase.crop})
            </p>

            <div className="modal-field">
              <label>{t("Select Extension Officer")}:</label>
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
              <button className="btn-cancel" onClick={() => setAssigningCase(null)}>
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

export default UnidentifiedCasesTable;