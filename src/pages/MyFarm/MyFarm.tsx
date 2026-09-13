import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import type { FarmCrop, PriorityAction } from '../../types/farm';
import './MyFarm.css';

interface MyFarmProps {
  onNavigateTab?: (tab: string) => void;
}

export default function MyFarm({ onNavigateTab }: MyFarmProps = {}) {
  const { farmState, isLoading, addCropRecord, scheduleFieldVisit } = useFarm();

  // Modal states
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<FarmCrop | null>(null);
  const [selectedAction, setSelectedAction] = useState<PriorityAction | null>(null);
  const [viewAllActivityModal, setViewAllActivityModal] = useState(false);
  const [viewAllFieldsModal, setViewAllFieldsModal] = useState(false);

  // Form states
  const [newCropName, setNewCropName] = useState('');
  const [newCropArea, setNewCropArea] = useState('0.5');
  const [newCropStage, setNewCropStage] = useState('Flowering');

  const [visitCrop, setVisitCrop] = useState('Cotton');
  const [visitDate, setVisitDate] = useState('');
  const [visitOfficer, setVisitOfficer] = useState('off_1');

  const mockOfficers = [
    { id: 'off_1', name: 'Rajesh Patil', role: 'Agriculture Extension Officer' },
    { id: 'off_2', name: 'Sneha Deshmukh', role: 'District Agriculture Officer' },
    { id: 'off_3', name: 'Vikram Joshi', role: 'Field Inspector' },
  ];

  if (isLoading || !farmState) {
    return (
      <div className="my-farm-container" style={{ padding: '60px', textAlign: 'center' }}>
        <h2>Loading farm telemetry...</h2>
      </div>
    );
  }

  const {
    farmDetails,
    crops,
    fields,
    activities,
    priorityActions,
    farmInsights,
    overallHealthScore,
    lastUpdated,
  } = farmState;

  // Health classification
  const healthClass =
    overallHealthScore >= 70 ? 'healthy' : overallHealthScore >= 50 ? 'warning' : 'critical';
  const healthLabel =
    overallHealthScore >= 80
      ? 'Good'
      : overallHealthScore >= 70
      ? 'Good'
      : overallHealthScore >= 50
      ? 'Attention'
      : 'Critical';

  // SVG Gauge calculations (radius = 38, circ = 238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, overallHealthScore)) / 100) * circumference;

  const handleAddCropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCropName.trim()) return;
    await addCropRecord({
      cropName: newCropName.trim(),
      areaHa: parseFloat(newCropArea) || 0.5,
      stage: newCropStage,
    });
    setNewCropName('');
    setShowAddCropModal(false);
  };

  const handleScheduleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await scheduleFieldVisit({
      crop: visitCrop,
      date: visitDate || 'Next Monday',
      officerVillage: mockOfficers.find(o => o.id === visitOfficer)?.name || visitOfficer,
    });
    setShowVisitModal(false);
  };

  return (
    <div className="my-farm-container">
      {/* ════════════════ HERO BANNER ════════════════ */}
      <section className="farm-hero-banner">
        <img
          src="/images/farmer_hero.jpg.png"
          alt="Farmer overlooking crops"
          className="farm-banner-bg-img"
        />
        <div className="farm-hero-content">
          <div className="farm-hero-header">
            <div className="farm-hero-title-group">
              <h1>
                My Farm <span role="img" aria-label="leaf">🌿</span>
              </h1>
              <p>Manage your farm, track your crops and get personalized insights for better yield.</p>
            </div>

            {/* Farmer Quote Banner */}
            <div className="farmer-quote-card">
              <span className="quote-icon">“</span>
              <p>
                Healthy soil, healthy crops, brighter future. <span role="img" aria-label="leaf">🌿</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ MAIN SHELL ════════════════ */}
      <main className="farm-main-shell">
        <div className="farm-dashboard-layout">
          {/* ── LEFT COLUMN: Profile & Health, My Crops, Bottom 3 Panels, Footer ── */}
          <div className="farm-left-col">
            {/* 1. Farm Profile & Health Score Card */}
            <div className="farm-profile-hero-card">
              {/* Subcard 1: Farm Info */}
              <div className="farm-profile-info">
                <img
                  src="/images/farm_landscape.jpg"
                  alt="Farm landscape thumbnail"
                  className="farm-profile-thumb"
                />
                <div className="farm-profile-text">
                  <h2>
                    {farmDetails.name}
                    <button title="Edit Farm Profile" onClick={() => setShowAddCropModal(true)}>
                      ✏️
                    </button>
                  </h2>
                  <div className="farm-profile-loc">
                    <span role="img" aria-label="pin">📍</span> {farmDetails.location}
                  </div>
                  <div className="farm-profile-stats">
                    <div className="farm-stat-pill">
                      <span className="stat-icon">📐</span>
                      <div>
                        <span>Total Land Area</span>
                        <strong>{farmDetails.totalAreaHa} Ha</strong>
                      </div>
                    </div>
                    <div className="farm-stat-pill">
                      <span className="stat-icon">🌾</span>
                      <div>
                        <span>Farm Type</span>
                        <strong>{farmDetails.farmType}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="farm-profile-divider" />

              {/* Subcard 2: Farm Health Score */}
              <div className="farm-health-gauge-section">
                <div className="farm-health-header">
                  <span className="farm-health-header-icon">🌿</span>
                  <span>Farm Health Score</span>
                </div>

                <div className="farm-gauge-row">
                  <div className="health-gauge-circle">
                    <svg viewBox="0 0 92 92">
                      <circle className="gauge-bg-ring" cx="46" cy="46" r={radius} />
                      <circle
                        className={`gauge-fill-ring ${healthClass}`}
                        cx="46"
                        cy="46"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <div className="gauge-center-text">
                      <strong>{overallHealthScore}%</strong>
                      <span>{healthLabel}</span>
                    </div>
                  </div>

                  <div className={`farm-health-callout ${healthClass}`}>
                    <span className="callout-icon">🌱</span>
                    <div>
                      {overallHealthScore >= 75
                        ? 'Your farm is in good condition! Keep up the healthy practices.'
                        : overallHealthScore >= 55
                        ? 'Attention needed: Some fields show moderate risk or early symptoms.'
                        : 'Immediate action required: Severe disease symptoms detected.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Middle Section: 🌿 My Crops */}
            <section className="farm-crops-section">
              <div className="panel-header">
                <h3>🌿 My Crops</h3>
                <button
                  className="panel-view-all-btn"
                  onClick={() => setShowAddCropModal(true)}
                >
                  View All Crops →
                </button>
              </div>

              {crops.length === 0 ? (
                <div className="empty-state-text">No crops monitored yet. Click &quot;Add Crop Record&quot; to begin.</div>
              ) : (
                <div className="crops-cards-row">
                  {crops.map((crop) => {
                    const statusSlug = crop.status.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <div key={crop.id} className="crop-mini-card">
                        <div className="crop-card-img-wrap">
                          <img src={crop.image} alt={crop.name} />
                        </div>
                        <div className="crop-card-content">
                          <div className="crop-card-topline">
                            <h4>
                              <span>{crop.icon}</span> {crop.name}
                            </h4>
                            <span className={`status-badge ${statusSlug}`}>
                              {crop.status}
                            </span>
                          </div>

                          <div className="crop-card-metrics">
                            <div className="crop-card-metric-row">
                              <span className="metric-lbl">Area</span>
                              <strong className="metric-val">{crop.areaHa} Ha</strong>
                            </div>
                            <div className="crop-card-yield-row">
                              <div className="yield-text-group">
                                <span className="metric-lbl">Expected Yield</span>
                                <strong className="metric-val">{crop.expectedYieldQtHa} Qt/Ha</strong>
                              </div>
                              <button
                                className="crop-action-circle-btn"
                                title={`View ${crop.name} details`}
                                onClick={() => setSelectedCrop(crop)}
                              >
                                →
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3. Bottom Grid: Recent Activity, Your Fields, Priority Actions */}
            <div className="farm-grid-bottom">
              {/* Card 1: 🕒 Recent Activity */}
              <div className="farm-panel-card">
                <div className="panel-header">
                  <h3>🕒 Recent Activity</h3>
                  <button
                    className="panel-view-all-btn"
                    onClick={() => setViewAllActivityModal(true)}
                  >
                    View All →
                  </button>
                </div>

                {activities.length === 0 ? (
                  <div className="empty-state-text">No recent activity</div>
                ) : (
                  <div className="activity-table-wrap">
                    <table className="activity-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Activity</th>
                          <th>Crop</th>
                          <th>Details</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.slice(0, 4).map((act) => {
                          const statusClass = act.status.toLowerCase();
                          const cropIcon =
                            act.crop.toLowerCase() === 'tomato'
                              ? '🍅'
                              : act.crop.toLowerCase() === 'cotton'
                              ? '☁️'
                              : act.crop.toLowerCase() === 'soybean'
                              ? '🌱'
                              : act.crop.toLowerCase() === 'onion'
                              ? '🧅'
                              : '🌿';

                          return (
                            <tr key={act.id}>
                              <td className="act-date">{act.date}</td>
                              <td className="act-name">
                                <span>{cropIcon}</span> {act.activity}
                              </td>
                              <td className="act-crop">{act.crop}</td>
                              <td className="act-details" title={act.details}>
                                {act.details}
                              </td>
                              <td>
                                <span className={`status-badge ${statusClass}`}>
                                  {act.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Card 2: 🌾 Your Fields */}
              <div className="farm-panel-card">
                <div className="panel-header">
                  <h3>🌾 Your Fields</h3>
                  <button
                    className="panel-view-all-btn"
                    onClick={() => setViewAllFieldsModal(true)}
                  >
                    View All →
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="empty-state-text">No fields added yet</div>
                ) : (
                  <div className="fields-list">
                    {fields.slice(0, 4).map((field) => {
                      const statusSlug = field.status.toLowerCase().replace(/\s+/g, '-');
                      const fieldCrop = field.crop?.toLowerCase() || '';
                      const fieldIcon =
                        fieldCrop === 'tomato' ? '🍅' : fieldCrop === 'cotton' ? '☁️' : '🌱';

                      return (
                        <div key={field.id} className="field-list-item">
                          <div className="field-item-left">
                            <span className="field-bullet-icon">{fieldIcon}</span>
                            <div className="field-item-names">
                              <strong>{field.name}</strong>
                              <span>{field.areaHa} Ha</span>
                            </div>
                          </div>
                          <span className="field-mid-area">{field.areaHa} Ha</span>
                          <span className={`status-badge ${statusSlug}`}>
                            {field.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card 3: ⚠️ Priority Actions */}
              <div className="farm-panel-card">
                <div className="panel-header">
                  <h3>⚠️ Priority Actions</h3>
                  <button
                    className="panel-view-all-btn"
                    onClick={() => onNavigateTab ? onNavigateTab('advisory') : null}
                  >
                    View All →
                  </button>
                </div>

                {priorityActions.length === 0 ? (
                  <div className="empty-state-text">No priority actions</div>
                ) : (
                  <div className="priority-actions-list">
                    {priorityActions.slice(0, 4).map((pa) => (
                      <div
                        key={pa.id}
                        className="priority-action-card"
                        onClick={() => setSelectedAction(pa)}
                      >
                        <div className="pa-card-left">
                          <img
                            src={pa.thumbnail || '/images/tomato_crop.jpg'}
                            alt={pa.crop}
                            className="pa-card-thumb"
                          />
                          <div className="pa-card-text">
                            <strong>{pa.title}</strong>
                            <span>{pa.subtitle}</span>
                          </div>
                        </div>
                        <span className={`pa-priority-pill ${pa.priority.toLowerCase()}`}>
                          {pa.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Quick Actions & Farm Insights ── */}
          <aside className="farm-right-col">
            {/* ⚡ Quick Actions */}
            <div className="farm-panel-card">
              <div className="panel-header">
                <h3>⚡ Quick Actions</h3>
              </div>
              <div className="quick-actions-list">
                <button
                  className="quick-action-item"
                  onClick={() => setShowAddCropModal(true)}
                >
                  <div className="qa-left">
                    <div className="qa-icon-circle leaf">🌿</div>
                    <div className="qa-text">
                      <strong>Add Crop Record</strong>
                      <span>Update your crop details</span>
                    </div>
                  </div>
                  <span className="qa-chevron">›</span>
                </button>

                <button
                  className="quick-action-item"
                  onClick={() => onNavigateTab ? onNavigateTab('advisory') : null}
                >
                  <div className="qa-left">
                    <div className="qa-icon-circle bulb">💡</div>
                    <div className="qa-text">
                      <strong>Get Advisory</strong>
                      <span>Personalized farming tips</span>
                    </div>
                  </div>
                  <span className="qa-chevron">›</span>
                </button>

                <button
                  className="quick-action-item"
                  onClick={() => setShowReportModal(true)}
                >
                  <div className="qa-left">
                    <div className="qa-icon-circle report">📄</div>
                    <div className="qa-text">
                      <strong>View Farm Report</strong>
                      <span>Download complete report</span>
                    </div>
                  </div>
                  <span className="qa-chevron">›</span>
                </button>

                <button
                  className="quick-action-item"
                  onClick={() => setShowVisitModal(true)}
                >
                  <div className="qa-left">
                    <div className="qa-icon-circle calendar">📅</div>
                    <div className="qa-text">
                      <strong>Schedule Field Visit</strong>
                      <span>Book a visit with expert</span>
                    </div>
                  </div>
                  <span className="qa-chevron">›</span>
                </button>
              </div>
            </div>

            {/* ✨ Farm Insights */}
            <div className="farm-panel-card">
              <div className="panel-header">
                <h3>✨ Farm Insights</h3>
                <button
                  className="panel-view-all-btn"
                  onClick={() => onNavigateTab ? onNavigateTab('risk') : null}
                >
                  View All →
                </button>
              </div>

              <div className="insights-list">
                {farmInsights.length === 0 ? (
                  <div className="empty-state-text">
                    Insights will appear as your farm data grows.
                  </div>
                ) : (
                  farmInsights.slice(0, 3).map((fi) => (
                    <div
                      key={fi.id}
                      className="insight-card-item"
                      onClick={() => onNavigateTab ? onNavigateTab('risk') : null}
                    >
                      <div className="insight-card-left">
                        <div className={`insight-icon-box ${fi.iconType}`}>
                          {fi.iconType === 'leaf' && '🌿'}
                          {fi.iconType === 'alert' && '⚠️'}
                          {fi.iconType === 'chart' && '📊'}
                        </div>
                        <div className="insight-card-text">
                          <strong>{fi.title}</strong>
                          <span>{fi.subtitle}</span>
                        </div>
                      </div>
                      <span className="qa-chevron">›</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* 4. Footer Citation Bar */}
        <footer className="farm-footer-bar">
          <div className="farm-footer-left">
            <span role="img" aria-label="leaf">🌿</span>
            <span>
              <strong>Data Sources:</strong> Ministry of Agriculture &amp; Farmers Welfare | ICAR | IMD | data.gov.in
            </span>
          </div>

          <button
            className="farm-footer-center-link"
            onClick={() => setShowSourceModal(true)}
          >
            View Source →
          </button>

          <div className="farm-footer-right">
            <span>🕒 Last Updated: {lastUpdated}</span>
          </div>
        </footer>
      </main>

      {/* ════════════════ MODALS ════════════════ */}

      {/* Add Crop Record Modal */}
      {showAddCropModal && (
        <div className="farm-modal-overlay" onClick={() => setShowAddCropModal(false)}>
          <div className="farm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="farm-modal-header">
              <h3>🌿 Add Crop Record</h3>
              <button
                className="farm-modal-close-btn"
                onClick={() => setShowAddCropModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCropSubmit}>
              <div className="farm-modal-body">
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                  Register a new crop plot into your farm portfolio to enable AI telemetry and automatic advisory tracking.
                </p>
                <div className="farm-modal-form-group">
                  <label>Crop Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Groundnut, Cotton, Tomato"
                    value={newCropName}
                    onChange={(e) => setNewCropName(e.target.value)}
                  />
                </div>
                <div className="farm-modal-form-group">
                  <label>Plot Area (Hectares)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newCropArea}
                    onChange={(e) => setNewCropArea(e.target.value)}
                  />
                </div>
                <div className="farm-modal-form-group">
                  <label>Growth Stage</label>
                  <select
                    value={newCropStage}
                    onChange={(e) => setNewCropStage(e.target.value)}
                  >
                    <option value="Germination">Germination</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting / Pod formation">Fruiting / Pod formation</option>
                    <option value="Maturity">Maturity</option>
                  </select>
                </div>
                <div className="farm-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddCropModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Crop Record
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Field Visit Modal */}
      {showVisitModal && (
        <div className="farm-modal-overlay" onClick={() => setShowVisitModal(false)}>
          <div className="farm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="farm-modal-header">
              <h3>📅 Schedule Field Visit</h3>
              <button
                className="farm-modal-close-btn"
                onClick={() => setShowVisitModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleScheduleVisitSubmit}>
              <div className="farm-modal-body">
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                  Request an in-person diagnostic evaluation by a certified agricultural extension officer.
                </p>
                <div className="farm-modal-form-group">
                  <label>Target Field / Crop</label>
                  <select
                    value={visitCrop}
                    onChange={(e) => setVisitCrop(e.target.value)}
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="farm-modal-form-group">
                  <label>Preferred Visit Date</label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                  />
                </div>
                <div className="farm-modal-form-group">
                  <label>Assigned Krishi Vigyan Kendra (KVK)</label>
                  <select
                    value={visitOfficer}
                    onChange={(e) => setVisitOfficer(e.target.value)}
                  >
                    {mockOfficers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="farm-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowVisitModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Confirm Visit Request
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Farm Report Modal */}
      {showReportModal && (
        <div className="farm-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="farm-modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="farm-modal-header">
              <h3>📄 Farm Telemetry & Health Audit Report</h3>
              <button
                className="farm-modal-close-btn"
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="farm-modal-body">
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{farmDetails.name} — Executive Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                  <div><strong>Location:</strong> {farmDetails.location}</div>
                  <div><strong>Total Area:</strong> {farmDetails.totalAreaHa} Ha</div>
                  <div><strong>Health Score:</strong> {overallHealthScore}% ({healthLabel})</div>
                  <div><strong>Audit Date:</strong> {lastUpdated}</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>Monitored Crops Health Summary</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {crops.map((c) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.82rem' }}>
                      <span><strong>{c.name}</strong> ({c.areaHa} Ha)</span>
                      <span>Status: <strong>{c.status}</strong> {c.detectedDisease ? `(${c.detectedDisease})` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="farm-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => window.print()}
                >
                  Print Report 🖨️
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowReportModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Detail Modal */}
      {selectedCrop && (
        <div className="farm-modal-overlay" onClick={() => setSelectedCrop(null)}>
          <div className="farm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="farm-modal-header">
              <h3>
                {selectedCrop.icon} {selectedCrop.name} Telemetry
              </h3>
              <button
                className="farm-modal-close-btn"
                onClick={() => setSelectedCrop(null)}
              >
                ✕
              </button>
            </div>
            <div className="farm-modal-body">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img
                  src={selectedCrop.image}
                  alt={selectedCrop.name}
                  style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{selectedCrop.name} Field</h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '4px 0' }}>
                    <span className={`status-badge ${selectedCrop.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {selectedCrop.status}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Health: <strong>{selectedCrop.healthScore}/100</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Last Scanned: <strong>{selectedCrop.lastScanDate}</strong>
                  </span>
                </div>
              </div>

              {selectedCrop.detectedDisease && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem' }}>
                  <strong>Detected Issue:</strong> {selectedCrop.detectedDisease} ({selectedCrop.severity || 'Moderate'} severity)
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.84rem' }}>
                <div><strong>Acreage:</strong> {selectedCrop.areaHa} Hectares</div>
                <div><strong>Expected Yield:</strong> {selectedCrop.expectedYieldQtHa} Qt/Ha</div>
              </div>

              <div className="farm-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onNavigateTab ? onNavigateTab('scan') : null}
                >
                  Scan Crop Now 📷
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onNavigateTab ? onNavigateTab('advisory') : null}
                >
                  View Advisory 💡
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority Action Detail Modal */}
      {selectedAction && (
        <div className="farm-modal-overlay" onClick={() => setSelectedAction(null)}>
          <div className="farm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="farm-modal-header">
              <h3>Action Plan: {selectedAction.crop}</h3>
              <button
                className="farm-modal-close-btn"
                onClick={() => setSelectedAction(null)}
              >
                ✕
              </button>
            </div>
            <div className="farm-modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>{selectedAction.title}</h4>
                <span className={`pa-priority-pill ${selectedAction.priority.toLowerCase()}`}>
                  {selectedAction.priority} Priority
                </span>
              </div>
              <p style={{ margin: '8px 0', fontSize: '0.88rem', color: '#475569' }}>
                <strong>Issue:</strong> {selectedAction.subtitle}
              </p>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '10px', color: '#166534', fontSize: '0.88rem', lineHeight: 1.4 }}>
                <strong>Recommended Action:</strong>
                <div>{selectedAction.action}</div>
              </div>
              <div className="farm-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedAction(null)}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setSelectedAction(null);
                    if (onNavigateTab) onNavigateTab('advisory');
                  }}
                >
                  Open Full Advisory 💡
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View All Activities Modal */}
      {viewAllActivityModal && (
        <div className="farm-modal-overlay" onClick={() => setViewAllActivityModal(false)}>
          <div className="farm-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="farm-modal-header">
              <h3>🕒 All Recent Activities</h3>
              <button
                className="farm-modal-close-btn"
                onClick={() => setViewAllActivityModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="farm-modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Activity</th>
                    <th>Crop</th>
                    <th>Details</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act) => (
                    <tr key={act.id}>
                      <td className="act-date">{act.date}</td>
                      <td className="act-name">{act.activity}</td>
                      <td>{act.crop}</td>
                      <td>{act.details}</td>
                      <td>
                        <span className={`status-badge ${act.status.toLowerCase()}`}>
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View All Fields Modal */}
      {viewAllFieldsModal && (
        <div className="farm-modal-overlay" onClick={() => setViewAllFieldsModal(false)}>
          <div className="farm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="farm-modal-header">
              <h3>🌾 Monitored Fields Breakdown</h3>
              <button
                className="farm-modal-close-btn"
                onClick={() => setViewAllFieldsModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="farm-modal-body">
              <div className="fields-list">
                {fields.map((f) => (
                  <div key={f.id} className="field-list-item">
                    <div className="field-item-left">
                      <span className="field-bullet-icon">🌱</span>
                      <div className="field-item-names">
                        <strong>{f.name}</strong>
                        <span>{f.areaHa} Ha · Last scan: {f.lastScanDate}</span>
                      </div>
                    </div>
                    <span className={`status-badge ${f.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Data Source Modal */}
      {showSourceModal && (
        <div className="farm-modal-overlay" onClick={() => setShowSourceModal(false)}>
          <div className="farm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="farm-modal-header">
              <h3>🌿 Official Government Data Citation</h3>
              <button
                className="farm-modal-close-btn"
                onClick={() => setShowSourceModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="farm-modal-body" style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#334155' }}>
              <p>
                <strong>Government of India Open Data Platform (data.gov.in)</strong>
              </p>
              <ul>
                <li>
                  <strong>DES Production & Yield:</strong> Directorate of Economics and Statistics, Ministry of Agriculture & Farmers Welfare. Resource ID: <code>979c7333-e918-4796-a8fa-7299c85fa809</code>.
                </li>
                <li>
                  <strong>IMD Rainfall & Telemetry:</strong> India Meteorological Department, Ministry of Earth Sciences. Resource ID: <code>ee7c8b07-6b4d-4e96-a36c-94cc5351a0e8</code>.
                </li>
                <li>
                  <strong>Crop Health Advisory:</strong> ICAR-CRIDA district agriculture contingencies.
                </li>
              </ul>
              <div className="farm-modal-actions">
                <a
                  href="https://data.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  Visit data.gov.in ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
