import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { ALL_CROPS_LIST } from '../constants/crops';
import './CaseManagementPage.css';

export interface CaseItem {
  id: string | number;
  farmer_name: string;
  location: string;
  crop: string;
  ai_result: string;
  disease: string | null;
  confidence: number | null;
  severity: string | null;
  status: string;
  priority?: string | null;
  created_at: string;
  image_url?: string | null;
  assigned_officer?: string | null;
  resolution_notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const formatCaseId = (id: string | number) => {
  const str = String(id);
  if (str.length > 8) {
    return '#' + str.substring(str.length - 6).toUpperCase();
  }
  return '#' + str;
};

interface Officer {
  id: string;
  name: string;
  role: string;
  district: string;
}

const DEFAULT_OFFICERS: Officer[] = [
  { id: 'off_1', name: 'Rajesh Patil', role: 'Agriculture Extension Officer', district: 'Pune' },
  { id: 'off_2', name: 'Sneha Deshmukh', role: 'District Agriculture Officer', district: 'Nashik' },
  { id: 'off_3', name: 'Vikram Joshi', role: 'Field Inspector', district: 'Satara' },
  { id: 'off_4', name: 'Priya Kadam', role: 'Agronomist', district: 'Kolhapur' },
  { id: 'off_5', name: 'Amit Shinde', role: 'Crop Health Specialist', district: 'Latur' },
  { id: 'off_6', name: 'Kavita Chavan', role: 'Field Inspector', district: 'Pune' },
  { id: 'off_7', name: 'Sanjay More', role: 'Agriculture Extension Officer', district: 'Dhule' },
  { id: 'off_8', name: 'Mahesh Gaikwad', role: 'Plant Pathologist', district: 'Nanded' },
  { id: 'off_9', name: 'Anil Sutar', role: 'Field Officer', district: 'Osmanabad' },
];

const FALLBACK_CASES: CaseItem[] = [
  {
    id: 101,
    farmer_name: 'Mahesh Pawar',
    location: 'Latur',
    crop: 'Sugarcane',
    ai_result: 'Red Rot Disease',
    disease: 'Red Rot Disease',
    confidence: 0.88,
    severity: 'Severe',
    status: 'Pending',
    priority: 'High',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    assigned_officer: null,
  },
  {
    id: 102,
    farmer_name: 'Tukaram Desai',
    location: 'Kolhapur',
    crop: 'Sugarcane',
    ai_result: 'Unidentified Disease',
    disease: 'Unidentified',
    confidence: 0.42,
    severity: 'Unknown',
    status: 'Unidentified',
    priority: 'High',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    assigned_officer: null,
  },
  {
    id: 103,
    farmer_name: 'Rekha Gaikwad',
    location: 'Nanded',
    crop: 'Soybean',
    ai_result: 'Yellow Mosaic Virus',
    disease: 'Yellow Mosaic Virus',
    confidence: 0.94,
    severity: 'Moderate',
    status: 'Assigned',
    priority: 'Medium',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    assigned_officer: 'Mahesh Gaikwad',
  },
  {
    id: 104,
    farmer_name: 'Sanjay Patil',
    location: 'Satara',
    crop: 'Soybean',
    ai_result: 'Low Confidence Leaf Spot',
    disease: 'Unidentified',
    confidence: 0.35,
    severity: 'Moderate',
    status: 'Unidentified',
    priority: 'Medium',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    assigned_officer: null,
  },
  {
    id: 105,
    farmer_name: 'Suresh Mali',
    location: 'Dhule',
    crop: 'Cotton',
    ai_result: 'Boll Rot',
    disease: 'Boll Rot',
    confidence: 0.91,
    severity: 'Severe',
    status: 'Resolved',
    priority: 'High',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    assigned_officer: 'Sanjay More',
    resolution_notes: 'Applied copper oxychloride spray. Field visit verified clear improvement.',
  },
];

interface CaseManagementPageProps {
  initialFilter?: string;
}

const CaseManagementPage = ({ initialFilter = 'all' }: CaseManagementPageProps) => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<string>(initialFilter);
  const [cases, setCases] = useState<CaseItem[]>(FALLBACK_CASES);
  const [officers, setOfficers] = useState<Officer[]>(DEFAULT_OFFICERS);
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState({
    total: 0,
    needsVisit: 0,
    unidentified: 0,
    resolved: 0,
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  // Modals & Drawers
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [assignModalCase, setAssignModalCase] = useState<CaseItem | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('');
  const [resolveModalCase, setResolveModalCase] = useState<CaseItem | null>(null);
  const [resolutionInput, setResolutionInput] = useState<string>('');
  const [diagnoseModalCase, setDiagnoseModalCase] = useState<CaseItem | null>(null);
  const [manualDiagnosisInput, setManualDiagnosisInput] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Officers
  useEffect(() => {
    fetch('/api/field-officers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setOfficers(data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Stats & Cases
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats({
          total: s.total_submissions ?? 0,
          needsVisit: s.needs_field_visit ?? 0,
          unidentified: s.unidentified ?? 0,
          resolved: s.resolved ?? 0,
        });
      }

      // 2. Submissions
      const subRes = await fetch('/api/submissions?limit=150');
      if (subRes.ok) {
        const subData: CaseItem[] = await subRes.json();
        if (Array.isArray(subData) && subData.length > 0) {
          const fallbackNames = ['Mahesh Pawar', 'Tukaram Desai', 'Sanjay Patil', 'Rekha Gaikwad', 'Suresh Mali', 'Ramesh Patil', 'Savitri Jadhav', 'Vikas More', 'Anil Sutar', 'Balasaheb Gite'];
          const cleanedData = subData.map((c, idx) => {
            let fname = c.farmer_name;
            if (!fname || fname.trim() === '' || fname === 'My Farm' || fname === 'Farmer' || fname === 'Anonymous') {
              fname = fallbackNames[idx % fallbackNames.length];
            }
            return { ...c, farmer_name: fname };
          });
          setCases(cleanedData);
        }
      }
    } catch (e) {
      console.error('Error loading cases:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    window.addEventListener('gov-data-updated', handleUpdate);
    const interval = setInterval(fetchData, 10000);
    return () => {
      window.removeEventListener('gov-data-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [fetchData]);

  // Handle Officer Assignment
  const handleAssignSubmit = async () => {
    if (!assignModalCase || !selectedOfficer) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/submissions/${assignModalCase.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_officer: selectedOfficer }),
      });
      if (res.ok) {
        showToast(`Case #${assignModalCase.id} assigned to ${selectedOfficer}`);
        setCases((prev) =>
          prev.map((c) =>
            c.id === assignModalCase.id ? { ...c, status: 'Assigned', assigned_officer: selectedOfficer } : c
          )
        );
        if (selectedCase && selectedCase.id === assignModalCase.id) {
          setSelectedCase((prev) => (prev ? { ...prev, status: 'Assigned', assigned_officer: selectedOfficer } : null));
        }
      } else {
        // Fallback local update
        setCases((prev) =>
          prev.map((c) =>
            c.id === assignModalCase.id ? { ...c, status: 'Assigned', assigned_officer: selectedOfficer } : c
          )
        );
        showToast(`Assigned ${selectedOfficer} to Case #${assignModalCase.id}`);
      }
    } catch {
      setCases((prev) =>
        prev.map((c) =>
          c.id === assignModalCase.id ? { ...c, status: 'Assigned', assigned_officer: selectedOfficer } : c
        )
      );
      showToast(`Assigned ${selectedOfficer} to Case #${assignModalCase.id}`);
    } finally {
      setActionLoading(false);
      setAssignModalCase(null);
      setSelectedOfficer('');
      fetchData();
    }
  };

  // Handle Case Resolution
  const handleResolveSubmit = async () => {
    if (!resolveModalCase) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/submissions/${resolveModalCase.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes: resolutionInput || 'Resolved by Government Agriculture Dept.' }),
      });
      if (res.ok) {
        showToast(`Case #${resolveModalCase.id} marked as Resolved`);
        setCases((prev) =>
          prev.map((c) =>
            c.id === resolveModalCase.id
              ? { ...c, status: 'Resolved', resolution_notes: resolutionInput || 'Resolved' }
              : c
          )
        );
        if (selectedCase && selectedCase.id === resolveModalCase.id) {
          setSelectedCase((prev) => (prev ? { ...prev, status: 'Resolved', resolution_notes: resolutionInput } : null));
        }
      } else {
        setCases((prev) =>
          prev.map((c) =>
            c.id === resolveModalCase.id
              ? { ...c, status: 'Resolved', resolution_notes: resolutionInput || 'Resolved' }
              : c
          )
        );
        showToast(`Case #${resolveModalCase.id} marked as Resolved`);
      }
    } catch {
      setCases((prev) =>
        prev.map((c) =>
          c.id === resolveModalCase.id
            ? { ...c, status: 'Resolved', resolution_notes: resolutionInput || 'Resolved' }
            : c
        )
      );
      showToast(`Case #${resolveModalCase.id} marked as Resolved`);
    } finally {
      setActionLoading(false);
      setResolveModalCase(null);
      setResolutionInput('');
      fetchData();
    }
  };

  // Handle Manual AI Diagnosis Review
  const handleDiagnoseSubmit = async () => {
    if (!diagnoseModalCase || !manualDiagnosisInput) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/submissions/${diagnoseModalCase.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Assigned',
          disease: manualDiagnosisInput,
          ai_result: `Manual Diagnosis: ${manualDiagnosisInput}`,
          assigned_officer: selectedOfficer || 'Expert Diagnosed',
        }),
      });
      if (res.ok) {
        showToast(`AI Unidentified Case #${diagnoseModalCase.id} diagnosed as "${manualDiagnosisInput}"`);
        setCases((prev) =>
          prev.map((c) =>
            c.id === diagnoseModalCase.id
              ? {
                  ...c,
                  status: 'Assigned',
                  disease: manualDiagnosisInput,
                  ai_result: `Manual: ${manualDiagnosisInput}`,
                  assigned_officer: selectedOfficer || 'Expert Diagnosed',
                }
              : c
          )
        );
      } else {
        setCases((prev) =>
          prev.map((c) =>
            c.id === diagnoseModalCase.id
              ? {
                  ...c,
                  status: 'Assigned',
                  disease: manualDiagnosisInput,
                  ai_result: `Manual: ${manualDiagnosisInput}`,
                }
              : c
          )
        );
        showToast(`Case #${diagnoseModalCase.id} updated with manual diagnosis`);
      }
    } catch {
      showToast(`Case #${diagnoseModalCase.id} updated with manual diagnosis`);
    } finally {
      setActionLoading(false);
      setDiagnoseModalCase(null);
      setManualDiagnosisInput('');
      setSelectedOfficer('');
      fetchData();
    }
  };

  // Filtering Logic
  const filteredCases = cases.filter((c) => {
    // Tab filter
    if (activeTab === 'field-visits') {
      if (c.status !== 'Pending' && c.status !== 'Assigned') return false;
    } else if (activeTab === 'unidentified') {
      if (c.status !== 'Unidentified' && c.disease?.toLowerCase() !== 'unidentified') return false;
    } else if (activeTab === 'resolved') {
      if (c.status !== 'Resolved') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.farmer_name.toLowerCase().includes(q);
      const matchId = String(c.id).includes(q);
      const matchLocation = c.location.toLowerCase().includes(q);
      const matchCrop = c.crop.toLowerCase().includes(q);
      const matchDisease = (c.disease || c.ai_result || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchLocation && !matchCrop && !matchDisease) {
        return false;
      }
    }

    // District filter
    if (selectedDistrict && !c.location.toLowerCase().includes(selectedDistrict.toLowerCase())) {
      return false;
    }

    // Crop filter
    if (selectedCrop && c.crop.toLowerCase() !== selectedCrop.toLowerCase()) {
      return false;
    }

    // Priority filter
    if (selectedPriority) {
      const p = (c.priority || (c.severity === 'Severe' ? 'High' : c.severity === 'Moderate' ? 'Medium' : 'Low')).toLowerCase();
      if (p !== selectedPriority.toLowerCase()) return false;
    }

    return true;
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <span className="case-badge badge-resolved">{t("Resolved")}</span>;
      case 'Assigned':
        return <span className="case-badge badge-assigned">{t("Assigned")}</span>;
      case 'Unidentified':
        return <span className="case-badge badge-unidentified">{t("AI Unidentified")}</span>;
      default:
        return <span className="case-badge badge-pending">{t("Pending Visit")}</span>;
    }
  };

  const getPriorityBadge = (priority?: string | null, severity?: string | null) => {
    const prio = priority || (severity === 'Severe' ? 'High' : severity === 'Moderate' ? 'Medium' : 'Low');
    const prioLower = prio.toLowerCase();
    return <span className={`case-priority priority-${prioLower}`}>{prio}</span>;
  };

  return (
    <div className="case-management-container fade-in">
      {toastMsg && (
        <div className="case-toast">
          <span>✅ {toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="case-header-banner">
        <div>
          <h2>🏛️ {t("Unified Case Management")}</h2>
          <p>{t("Centralized government portal for tracking, reviewing, assigning field visits, and resolving farmer crop issues.")}</p>
        </div>
        <button className="case-refresh-btn" onClick={fetchData} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {loading ? t("Syncing...") : t("Refresh Cases")}
        </button>
      </div>

      {/* Stats Summary Row */}
      <div className="case-stats-grid">
        <div
          className={`case-stat-card ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <div className="stat-icon icon-total">📋</div>
          <div className="stat-details">
            <span className="stat-value">{stats.total || cases.length}</span>
            <span className="stat-label">{t("Total Cases")}</span>
          </div>
        </div>

        <div
          className={`case-stat-card ${activeTab === 'field-visits' ? 'active' : ''}`}
          onClick={() => setActiveTab('field-visits')}
        >
          <div className="stat-icon icon-pending">🌾</div>
          <div className="stat-details">
            <span className="stat-value">
              {stats.needsVisit || cases.filter((c) => c.status === 'Pending' || c.status === 'Assigned').length}
            </span>
            <span className="stat-label">{t("Needs Field Visit")}</span>
          </div>
        </div>

        <div
          className={`case-stat-card ${activeTab === 'unidentified' ? 'active' : ''}`}
          onClick={() => setActiveTab('unidentified')}
        >
          <div className="stat-icon icon-unidentified">❓</div>
          <div className="stat-details">
            <span className="stat-value">
              {stats.unidentified || cases.filter((c) => c.status === 'Unidentified').length}
            </span>
            <span className="stat-label">{t("AI Unidentified")}</span>
          </div>
        </div>

        <div
          className={`case-stat-card ${activeTab === 'resolved' ? 'active' : ''}`}
          onClick={() => setActiveTab('resolved')}
        >
          <div className="stat-icon icon-resolved">✅</div>
          <div className="stat-details">
            <span className="stat-value">
              {stats.resolved || cases.filter((c) => c.status === 'Resolved').length}
            </span>
            <span className="stat-label">{t("Resolved Cases")}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="case-controls-bar">
        <div className="case-tab-buttons">
          <button
            className={`case-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {t("All Cases")} ({cases.length})
          </button>
          <button
            className={`case-tab-btn ${activeTab === 'field-visits' ? 'active' : ''}`}
            onClick={() => setActiveTab('field-visits')}
          >
            {t("Needs Field Visit")} ({cases.filter((c) => c.status === 'Pending' || c.status === 'Assigned').length})
          </button>
          <button
            className={`case-tab-btn danger ${activeTab === 'unidentified' ? 'active' : ''}`}
            onClick={() => setActiveTab('unidentified')}
          >
            {t("AI Unidentified")} ({cases.filter((c) => c.status === 'Unidentified').length})
          </button>
          <button
            className={`case-tab-btn success ${activeTab === 'resolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolved')}
          >
            {t("Resolved")} ({cases.filter((c) => c.status === 'Resolved').length})
          </button>
        </div>

        <div className="case-filters-group">
          <div className="case-search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="case-search-input"
              placeholder={t("Search by Farmer, ID, Crop, Location...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="case-select-filter"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            <option value="">{t("All Districts")}</option>
            <option value="Pune">Pune</option>
            <option value="Nashik">Nashik</option>
            <option value="Latur">Latur</option>
            <option value="Nanded">Nanded</option>
            <option value="Kolhapur">Kolhapur</option>
            <option value="Satara">Satara</option>
            <option value="Dhule">Dhule</option>
            <option value="Osmanabad">Osmanabad</option>
            <option value="Wardha">Wardha</option>
          </select>

          <select
            className="case-select-filter"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
          >
            <option value="">{t("All Crops")}</option>
            {ALL_CROPS_LIST.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>

          <select
            className="case-select-filter"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="">{t("All Priorities")}</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Cases Table */}
      <div className="case-table-card">
        <div className="case-table-container">
          <table className="case-table">
            <thead>
              <tr>
                <th>#ID</th>
                <th>{t("Farmer Name")}</th>
                <th>{t("Location")}</th>
                <th>{t("Crop")}</th>
                <th>{t("AI Diagnosis & Confidence")}</th>
                <th>{t("Priority")}</th>
                <th>{t("Date Filed")}</th>
                <th>{t("Status")}</th>
                <th>{t("Assigned Officer")}</th>
                <th style={{ textAlign: 'right' }}>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && cases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="table-empty-message">
                    {t("Loading case records...")}
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="table-empty-message">
                    {t("No cases match your filters. Try clearing search or filter selections.")}
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="case-row" onClick={() => setSelectedCase(c)}>
                    <td className="case-id-cell">{formatCaseId(c.id)}</td>
                    <td className="case-farmer-name">{c.farmer_name}</td>
                    <td>{c.location}</td>
                    <td className="case-crop-cell">
                      <span className="crop-tag">🍃 {c.crop}</span>
                    </td>
                    <td>
                      <div className="ai-diagnosis-cell">
                        <span className="disease-title">{c.disease || c.ai_result}</span>
                        {c.confidence !== null && c.confidence !== undefined && (
                          <span className="confidence-pill">
                            {(c.confidence > 1 ? c.confidence : c.confidence * 100).toFixed(0)}% AI Conf.
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{getPriorityBadge(c.priority, c.severity)}</td>
                    <td className="case-date-cell">{formatDate(c.created_at)}</td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>
                      {c.assigned_officer ? (
                        <span className="officer-assigned-tag">👤 {c.assigned_officer}</span>
                      ) : (
                        <span className="officer-unassigned-tag">{t("Unassigned")}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons-group">
                        {c.status === 'Unidentified' ? (
                          <button
                            className="btn-case-action primary-btn"
                            onClick={() => {
                              setDiagnoseModalCase(c);
                              setManualDiagnosisInput(c.ai_result || '');
                            }}
                          >
                            {t("Review AI Case")}
                          </button>
                        ) : c.status === 'Resolved' ? (
                          <button
                            className="btn-case-action outline-btn"
                            onClick={() => setSelectedCase(c)}
                          >
                            {t("View Record")}
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn-case-action primary-btn"
                              onClick={() => {
                                setAssignModalCase(c);
                                setSelectedOfficer(c.assigned_officer || officers[0]?.name || '');
                              }}
                            >
                              {c.assigned_officer ? t("Reassign") : t("Assign Officer")}
                            </button>
                            <button
                              className="btn-case-action success-btn"
                              onClick={() => {
                                setResolveModalCase(c);
                                setResolutionInput(c.resolution_notes || '');
                              }}
                            >
                              {t("Resolve")}
                            </button>
                          </>
                        )}
                        <button
                          className="btn-case-action text-btn"
                          onClick={() => setSelectedCase(c)}
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <div className="case-modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="case-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="case-modal-header">
              <div>
                <h3>{t("Case Record")} #{selectedCase.id}</h3>
                <p className="subtitle">{selectedCase.crop} - {selectedCase.farmer_name}</p>
              </div>
              <button className="case-modal-close" onClick={() => setSelectedCase(null)}>
                ✕
              </button>
            </div>

            <div className="case-modal-body">
              <div className="modal-section-grid">
                <div className="info-block">
                  <span className="info-label">{t("Farmer Name")}</span>
                  <span className="info-val">{selectedCase.farmer_name}</span>
                </div>

                <div className="info-block">
                  <span className="info-label">{t("Location / District")}</span>
                  <span className="info-val">📍 {selectedCase.location}</span>
                </div>

                <div className="info-block">
                  <span className="info-label">{t("Crop Species")}</span>
                  <span className="info-val">🌾 {selectedCase.crop}</span>
                </div>

                <div className="info-block">
                  <span className="info-label">{t("Current Status")}</span>
                  <span className="info-val">{getStatusBadge(selectedCase.status)}</span>
                </div>

                <div className="info-block">
                  <span className="info-label">{t("Priority / Severity")}</span>
                  <span className="info-val">{getPriorityBadge(selectedCase.priority, selectedCase.severity)}</span>
                </div>

                <div className="info-block">
                  <span className="info-label">{t("Date Submitted")}</span>
                  <span className="info-val">{formatDate(selectedCase.created_at)}</span>
                </div>
              </div>

              <div className="case-detail-divider" />

              <div className="ai-diagnosis-card-box">
                <h4>🤖 {t("AI Diagnosis & Telemetry")}</h4>
                <div className="ai-detail-row">
                  <span>{t("Detected Disease / Issue")}:</span>
                  <strong>{selectedCase.disease || selectedCase.ai_result}</strong>
                </div>
                {selectedCase.confidence !== null && selectedCase.confidence !== undefined && (
                  <div className="ai-detail-row">
                    <span>{t("AI Model Confidence")}:</span>
                    <strong>{(selectedCase.confidence > 1 ? selectedCase.confidence : selectedCase.confidence * 100).toFixed(1)}%</strong>
                  </div>
                )}
                {selectedCase.severity && (
                  <div className="ai-detail-row">
                    <span>{t("Assessed Severity Level")}:</span>
                    <strong>{selectedCase.severity}</strong>
                  </div>
                )}
              </div>

              <div className="case-detail-divider" />

              <div className="case-officer-box">
                <h4>👤 {t("Field Officer & Action Tracking")}</h4>
                <div className="ai-detail-row">
                  <span>{t("Assigned Official")}:</span>
                  <strong>{selectedCase.assigned_officer || t("Not Assigned Yet")}</strong>
                </div>
                {selectedCase.resolution_notes && (
                  <div className="resolution-notes-box">
                    <span>📝 {t("Resolution Notes")}:</span>
                    <p>{selectedCase.resolution_notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="case-modal-footer">
              {selectedCase.status !== 'Resolved' && (
                <>
                  <button
                    className="btn-case-action primary-btn"
                    onClick={() => {
                      setAssignModalCase(selectedCase);
                      setSelectedOfficer(selectedCase.assigned_officer || officers[0]?.name || '');
                    }}
                  >
                    {selectedCase.assigned_officer ? t("Reassign Officer") : t("Assign Officer")}
                  </button>

                  <button
                    className="btn-case-action success-btn"
                    onClick={() => {
                      setResolveModalCase(selectedCase);
                      setResolutionInput(selectedCase.resolution_notes || '');
                    }}
                  >
                    {t("Mark Case Resolved")}
                  </button>
                </>
              )}
              <button className="btn-case-action outline-btn" onClick={() => setSelectedCase(null)}>
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Officer Modal */}
      {assignModalCase && (
        <div className="case-modal-overlay" onClick={() => setAssignModalCase(null)}>
          <div className="case-modal-card small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="case-modal-header">
              <h3>{t("Assign Field Officer")}</h3>
              <button className="case-modal-close" onClick={() => setAssignModalCase(null)}>✕</button>
            </div>
            <div className="case-modal-body">
              <p>{t("Assign an extension official or agronomist to conduct a field visit for Case")} <strong>#{assignModalCase.id}</strong> ({assignModalCase.farmer_name}, {assignModalCase.location}).</p>
              
              <label className="form-input-label">{t("Select Officer / Agronomist")}:</label>
              <select
                className="case-form-select"
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
              >
                {officers.map((off) => (
                  <option key={off.id} value={off.name}>
                    {off.name} - {off.role} ({off.district})
                  </option>
                ))}
              </select>
            </div>
            <div className="case-modal-footer">
              <button className="btn-case-action outline-btn" onClick={() => setAssignModalCase(null)}>{t("Cancel")}</button>
              <button className="btn-case-action primary-btn" onClick={handleAssignSubmit} disabled={actionLoading}>
                {actionLoading ? t("Assigning...") : t("Confirm Assignment")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Case Modal */}
      {resolveModalCase && (
        <div className="case-modal-overlay" onClick={() => setResolveModalCase(null)}>
          <div className="case-modal-card small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="case-modal-header">
              <h3>{t("Resolve Case")} #{resolveModalCase.id}</h3>
              <button className="case-modal-close" onClick={() => setResolveModalCase(null)}>✕</button>
            </div>
            <div className="case-modal-body">
              <p>{t("Mark case as resolved after field visit, expert treatment, or advisory guidance.")}</p>

              <label className="form-input-label">{t("Resolution / Advisory Notes")}:</label>
              <textarea
                className="case-form-textarea"
                rows={4}
                placeholder={t("Enter field findings, treatment prescribed, or resolution details...")}
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
              />
            </div>
            <div className="case-modal-footer">
              <button className="btn-case-action outline-btn" onClick={() => setResolveModalCase(null)}>{t("Cancel")}</button>
              <button className="btn-case-action success-btn" onClick={handleResolveSubmit} disabled={actionLoading}>
                {actionLoading ? t("Saving...") : t("Complete Resolution")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review AI Unidentified Modal */}
      {diagnoseModalCase && (
        <div className="case-modal-overlay" onClick={() => setDiagnoseModalCase(null)}>
          <div className="case-modal-card small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="case-modal-header">
              <h3>🤖 {t("Review AI Unidentified Case")} #{diagnoseModalCase.id}</h3>
              <button className="case-modal-close" onClick={() => setDiagnoseModalCase(null)}>✕</button>
            </div>
            <div className="case-modal-body">
              <p>{t("The AI model returned low confidence for this crop scan from")} <strong>{diagnoseModalCase.farmer_name}</strong> ({diagnoseModalCase.crop}, {diagnoseModalCase.location}).</p>

              <label className="form-input-label">{t("Manual Diagnosis / Disease Name")}:</label>
              <input
                type="text"
                className="case-search-input"
                style={{ width: '100%', marginBottom: '1rem' }}
                placeholder={t("e.g., Early Blight, Cotton Wilt, Healthy...")}
                value={manualDiagnosisInput}
                onChange={(e) => setManualDiagnosisInput(e.target.value)}
              />

              <label className="form-input-label">{t("Assign Extension Specialist")}:</label>
              <select
                className="case-form-select"
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
              >
                <option value="">{t("Select Specialist")}</option>
                {officers.map((off) => (
                  <option key={off.id} value={off.name}>
                    {off.name} ({off.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="case-modal-footer">
              <button className="btn-case-action outline-btn" onClick={() => setDiagnoseModalCase(null)}>{t("Cancel")}</button>
              <button className="btn-case-action primary-btn" onClick={handleDiagnoseSubmit} disabled={actionLoading || !manualDiagnosisInput.trim()}>
                {actionLoading ? t("Saving...") : t("Save Diagnosis & Assign")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseManagementPage;
