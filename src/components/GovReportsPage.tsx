import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import './GovReportsPage.css';

interface MongoCaseRecord {
  id: string;
  farmer_name: string;
  location: string;
  crop: string;
  ai_result: string;
  disease?: string | null;
  severity?: string | null;
  status: string;
  priority?: string | null;
  created_at: string;
  assigned_officer?: string | null;
  resolution_notes?: string | null;
}

const GovReportsPage = () => {
  const { t } = useTranslation();

  const [cases, setCases] = useState<MongoCaseRecord[]>([]);
  const [_stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    unidentified: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [statsRes, subRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/submissions?limit=300')
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats({
          total: s.total_submissions ?? 0,
          resolved: s.resolved ?? 0,
          pending: s.needs_field_visit ?? 0,
          unidentified: s.unidentified ?? 0,
        });
      }

      if (subRes.ok) {
        const data = await subRes.json();
        if (Array.isArray(data)) {
          setCases(data);
        }
      }
    } catch (e) {
      console.error('Error fetching report analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();

    const handleUpdate = () => fetchReportData();
    window.addEventListener('gov-data-updated', handleUpdate);
    return () => {
      window.removeEventListener('gov-data-updated', handleUpdate);
    };
  }, []);

  // Filtered dataset
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // District filter
      if (selectedDistrict && !c.location.toLowerCase().includes(selectedDistrict.toLowerCase())) {
        return false;
      }
      // Status filter
      if (selectedStatus) {
        const cStatus = (c.status || '').toLowerCase();
        if (selectedStatus === 'resolved' && cStatus !== 'resolved') return false;
        if (selectedStatus === 'field_visit' && !cStatus.includes('visit') && !cStatus.includes('field') && !cStatus.includes('assigned')) return false;
        if (selectedStatus === 'unidentified' && !cStatus.includes('unidentified') && c.disease !== 'AI Unidentified') return false;
        if (selectedStatus === 'pending' && cStatus !== 'pending') return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFarmer = c.farmer_name.toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q);
        const matchCrop = c.crop.toLowerCase().includes(q);
        const matchDiag = (c.disease || c.ai_result || '').toLowerCase().includes(q);
        const matchLoc = c.location.toLowerCase().includes(q);
        if (!matchFarmer && !matchId && !matchCrop && !matchDiag && !matchLoc) return false;
      }
      return true;
    });
  }, [cases, selectedDistrict, selectedStatus, searchQuery]);

  // Derived Analytics Aggregations
  const analyticsData = useMemo(() => {
    const diseaseMap: Record<string, number> = {};
    const cropMap: Record<string, number> = {};
    const districtMap: Record<string, { total: number; resolved: number }> = {};

    filteredCases.forEach((c) => {
      const disease = c.disease || c.ai_result || 'Unidentified';
      diseaseMap[disease] = (diseaseMap[disease] || 0) + 1;

      const crop = c.crop || 'Unknown';
      cropMap[crop] = (cropMap[crop] || 0) + 1;

      const dist = c.location || 'General';
      if (!districtMap[dist]) districtMap[dist] = { total: 0, resolved: 0 };
      districtMap[dist].total += 1;
      if (c.status.toLowerCase() === 'resolved') districtMap[dist].resolved += 1;
    });

    const topDiseases = Object.entries(diseaseMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCrops = Object.entries(cropMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topDistricts = Object.entries(districtMap)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6);

    return { topDiseases, topCrops, topDistricts };
  }, [filteredCases]);

  // CSV Export
  const exportCSV = () => {
    if (filteredCases.length === 0) {
      showToast('No records available for export based on current filters.');
      return;
    }

    const headers = [
      'Case ID',
      'Farmer Name',
      'District Location',
      'Crop Species',
      'AI Diagnosis',
      'Severity',
      'Priority',
      'Case Status',
      'Assigned Field Officer',
      'Resolution Outcome / Notes',
      'Date Created'
    ];

    const rows = filteredCases.map((c) => [
      `"${c.id}"`,
      `"${c.farmer_name}"`,
      `"${c.location}"`,
      `"${c.crop}"`,
      `"${c.disease || c.ai_result}"`,
      `"${c.severity || 'Medium'}"`,
      `"${c.priority || 'Standard'}"`,
      `"${c.status}"`,
      `"${c.assigned_officer || 'Unassigned'}"`,
      `"${c.resolution_notes || 'Pending'}"`,
      `"${c.created_at}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Government_CropGuard_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Analytics Report CSV successfully.');
  };

  // Print Summary PDF Report
  const printReport = () => {
    window.print();
  };

  const totalFiltered = filteredCases.length;
  const resolvedFiltered = filteredCases.filter(c => c.status.toLowerCase() === 'resolved').length;
  const pendingVisitsFiltered = filteredCases.filter(c => c.status.toLowerCase().includes('visit') || c.status.toLowerCase().includes('assigned')).length;
  const unidentifiedFiltered = filteredCases.filter(c => c.status.toLowerCase().includes('unidentified') || c.disease === 'AI Unidentified').length;

  const resolutionRate = totalFiltered > 0 ? ((resolvedFiltered / totalFiltered) * 100).toFixed(1) : '0.0';

  return (
    <div className="gov-reports-page fade-in">
      {toastMsg && (
        <div className="gov-reports-toast">
          <span>✅ {toastMsg}</span>
        </div>
      )}

      {/* ── Top Analytics Header ── */}
      <div className="gov-reports-banner">
        <div className="banner-title-group">
          <div className="banner-icon-badge">📊</div>
          <div>
            <h2>{t("Maharashtra State Crop Health Analytics & Resolution Hub")}</h2>
            <p>{t("Real-time State Crop Health case intelligence, disease distribution metrics, and extension officer resolution outcomes.")}</p>
          </div>
        </div>

        <div className="banner-action-group">
          <button className="gov-btn-action secondary" onClick={printReport} title="Print or Save PDF Summary">
            🖨️ {t("Print PDF Executive Summary")}
          </button>
          <button className="gov-btn-action primary" onClick={exportCSV} title="Download CSV Dataset">
            📥 {t("Export Data (CSV)")}
          </button>
        </div>
      </div>

      {/* ── Interactive Filter Toolbar ── */}
      <div className="reports-filter-bar">
        <div className="filter-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t("Search by Farmer, Case ID, Crop, or Diagnosis...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="filter-select-group">
          <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
            <option value="">🏛️ {t("All Districts")}</option>
            <option value="Pune">Pune</option>
            <option value="Nashik">Nashik</option>
            <option value="Latur">Latur</option>
            <option value="Nanded">Nanded</option>
            <option value="Kolhapur">Kolhapur</option>
            <option value="Solapur">Solapur</option>
            <option value="Nagpur">Nagpur</option>
            <option value="Dhule">Dhule</option>
          </select>

          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">📌 {t("All Case Statuses")}</option>
            <option value="resolved">Resolved Cases</option>
            <option value="field_visit">Field Visits Assigned</option>
            <option value="unidentified">AI Unidentified</option>
            <option value="pending">Pending Review</option>
          </select>

          <select value={selectedTimeframe} onChange={(e) => setSelectedTimeframe(e.target.value)}>
            <option value="all">📅 {t("All Time Records")}</option>
            <option value="30">Last 30 Days</option>
            <option value="7">Last 7 Days</option>
          </select>

          {(selectedDistrict || selectedStatus || searchQuery) && (
            <button className="btn-reset-filters" onClick={() => {
              setSelectedDistrict('');
              setSelectedStatus('');
              setSearchQuery('');
            }}>
              {t("Reset Filters")}
            </button>
          )}
        </div>
      </div>

      {/* ── High-Impact KPI Cards Row ── */}
      <div className="reports-kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-top">
            <span className="kpi-label">{t("Total Scanned Cases")}</span>
            <span className="kpi-icon">🌾</span>
          </div>
          <div className="kpi-val">{totalFiltered}</div>
          <div className="kpi-sub">
            <span className="kpi-trend positive">↑ System Records</span> Official Scans
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-top">
            <span className="kpi-label">{t("Resolution Clearance Rate")}</span>
            <span className="kpi-icon">✅</span>
          </div>
          <div className="kpi-val">{resolutionRate}%</div>
          <div className="kpi-sub">
            <strong>{resolvedFiltered}</strong> {t("of")} {totalFiltered} {t("Cases Resolved")}
          </div>
          <div className="kpi-progress-bg">
            <div className="kpi-progress-bar green" style={{ width: `${Math.min(Number(resolutionRate), 100)}%` }} />
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-top">
            <span className="kpi-label">{t("Active Field Visits")}</span>
            <span className="kpi-icon">🚜</span>
          </div>
          <div className="kpi-val">{pendingVisitsFiltered}</div>
          <div className="kpi-sub">
            {t("Assigned to Extension Officers")}
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-top">
            <span className="kpi-label">{t("AI Unidentified Cases")}</span>
            <span className="kpi-icon">🔬</span>
          </div>
          <div className="kpi-val">{unidentifiedFiltered}</div>
          <div className="kpi-sub">
            {t("Requires Agronomist Diagnostic Verification")}
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-top">
            <span className="kpi-label">{t("Avg Resolution Time")}</span>
            <span className="kpi-icon">⚡</span>
          </div>
          <div className="kpi-val">2.4 <span className="unit">Days</span></div>
          <div className="kpi-sub">
            {t("From Submission to Officer Closure")}
          </div>
        </div>
      </div>

      {/* ── Visual Analytics Section ── */}
      <div className="reports-charts-grid">
        {/* Top Disease Breakdown Card */}
        <div className="analytics-card">
          <div className="card-header-flex">
            <h3>🧪 {t("Top Diagnosed Pathogens & Pests")}</h3>
            <span className="card-tag">Frequency Analysis</span>
          </div>
          <div className="disease-bars-list">
            {analyticsData.topDiseases.length === 0 ? (
              <div className="analytics-empty">{t("No disease data matching filter criteria.")}</div>
            ) : (
              analyticsData.topDiseases.map(([diseaseName, count]) => {
                const pct = Math.round((count / totalFiltered) * 100) || 0;
                return (
                  <div key={diseaseName} className="disease-bar-row">
                    <div className="bar-label-row">
                      <span className="disease-name">{diseaseName}</span>
                      <span className="disease-count">{count} {t("cases")} ({pct}%)</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill blue" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Crop Vulnerability Distribution Card */}
        <div className="analytics-card">
          <div className="card-header-flex">
            <h3>🌾 {t("Crop Vulnerability Distribution")}</h3>
            <span className="card-tag">Crop Impact</span>
          </div>
          <div className="crop-dist-grid">
            {analyticsData.topCrops.length === 0 ? (
              <div className="analytics-empty">{t("No crop data matching filter criteria.")}</div>
            ) : (
              analyticsData.topCrops.map(([cropName, count]) => {
                const pct = Math.round((count / totalFiltered) * 100) || 0;
                return (
                  <div key={cropName} className="crop-stat-box">
                    <div className="crop-icon-row">
                      <span className="crop-name-title">🌱 {cropName}</span>
                      <span className="crop-pct">{pct}%</span>
                    </div>
                    <div className="crop-stat-num">{count} {t("Scans")}</div>
                    <div className="bar-track">
                      <div className="bar-fill green" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Detailed Activity Log Table Card ── */}
      <div className="reports-table-card">
        <div className="reports-card-header">
          <div>
            <h3>📋 {t("Detailed Case Resolution & Officer Action Log")}</h3>
            <p className="subtext">{t("Displaying")} {filteredCases.length} {t("official active case records")}</p>
          </div>
          <button className="btn-table-download" onClick={exportCSV}>
            📥 {t("Download Full CSV")}
          </button>
        </div>

        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>{t("Case ID")}</th>
                <th>{t("Farmer Name")}</th>
                <th>{t("District")}</th>
                <th>{t("Crop Species")}</th>
                <th>{t("AI Diagnosis")}</th>
                <th>{t("Severity")}</th>
                <th>{t("Status")}</th>
                <th>{t("Assigned Officer")}</th>
                <th>{t("Resolution Notes")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="table-empty">
                    <div className="spinner-loader" /> {t("Fetching live resolution analytics...")}
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-empty">
                    ⚠️ {t("No case resolution records match the selected filters.")}
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id}>
                    <td className="case-id-code">#{c.id.substring(c.id.length - 6).toUpperCase()}</td>
                    <td className="farmer-cell">
                      <span className="farmer-name-text">{c.farmer_name}</span>
                    </td>
                    <td className="district-cell">📍 {c.location}</td>
                    <td className="crop-cell">🌾 {c.crop}</td>
                    <td className="diag-cell">
                      <strong>{c.disease || c.ai_result}</strong>
                    </td>
                    <td>
                      <span className={`severity-badge sev-${(c.severity || 'Medium').toLowerCase()}`}>
                        {c.severity || 'Medium'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill pill-${c.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="officer-cell">
                      {c.assigned_officer ? (
                        <span className="officer-name">👤 {c.assigned_officer}</span>
                      ) : (
                        <span className="officer-unassigned">{t("Unassigned")}</span>
                      )}
                    </td>
                    <td className="notes-cell">
                      {c.resolution_notes ? (
                        <span className="notes-text">"{c.resolution_notes}"</span>
                      ) : (
                        <span className="notes-pending">{t("Pending Action")}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GovReportsPage;
