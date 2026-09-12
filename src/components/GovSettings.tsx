import React, { useState, useEffect, useCallback, useContext } from 'react';
import './GovSettings.css';
import { AuthContext } from '../auth/AuthContext';

import {
  type GovOfficerProfile,
  type GovOfficerJurisdiction,
  type GovOfficerNotifications,
  type GovOfficerAiPreferences,
  type GovOfficerSecurity,
  fetchOfficerSettings,
  patchOfficerProfile,
  patchOfficerNotifications,
  patchOfficerAiPreferences,
  getStoredUser,
  getAdministrativeDivision,
  getAgroClimaticZone,
} from '../services/govOfficerApi';

export default function GovSettings() {
  const { user } = useContext(AuthContext);

  // Synchronously resolve session on initial render to prevent undefined userId on page refresh
  const storedUser = getStoredUser();
  const activeUser = user || storedUser;
  const activeUserId = activeUser?.id;

  // Accordion state: Section 1 expanded by default, others collapsed
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
  });

  const toggleSection = (id: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Profile data state initialized with user context or stored session baseline
  const [profile, setProfile] = useState<GovOfficerProfile>(() => {
    const u = user || getStoredUser();
    return {
      name: u?.fullName || 'Dr. A. Deshmukh',
      designation: 'Agriculture Officer',
      department: 'Agriculture Department',
      stateDepartment: 'Maharashtra Agriculture Department',
      employeeId: 'AGRO-2457',
      email: null,
      district: u?.location || 'Yavatmal',
      phone: u?.phone || '+91 98765 43210',
      avatarInitials: u?.fullName ? u.fullName.replace(/^Dr\.\s*/i, '').slice(0, 2).toUpperCase() : 'AD',
    };
  });

  // Jurisdiction data state matching the assigned district's administrative division
  const [jurisdiction, setJurisdiction] = useState<GovOfficerJurisdiction>(() => {
    const u = user || getStoredUser();
    const dist = u?.location || 'Yavatmal';
    const div = getAdministrativeDivision(dist);
    const zone = getAgroClimaticZone(dist);
    return {
      assignedState: 'Maharashtra',
      stateCode: 'MH (27)',
      administrativeDivision: div,
      agroClimaticZone: zone,
      assignedDistrict: `${dist} District`,
      districtHq: `DSAO ${dist} HQ`,
      jurisdictionCode: 'MH-YTL-AGRI-02',
      coveredTalukas: `${dist} & Surrounding`,
      agriculturalCircles: '12 Agricultural Circles',
      reportingAuthority: 'Divisional Joint Director',
      regionalDirectorate: `${div} Regional Directorate`,
    };
  });

  // Notifications state
  const [notifications, setNotifications] = useState<GovOfficerNotifications>({
    highRiskOutbreaks: true,
    farmerSubmissions: true,
    weeklySurveillance: true,
    urgentFieldVisits: true,
    stateCirculars: true,
    appSoundAlerts: false,
  });

  // AI Preferences state
  const [aiPrefs, setAiPrefs] = useState<GovOfficerAiPreferences>({
    autoPreFilter: true,
    gradCamHeatmap: true,
    icarRemedies: true,
    confidenceThreshold: 80,
    languageMarathi: true,
    invasiveAnomalyFlagging: true,
  });

  // Security data state
  const [security, setSecurity] = useState<GovOfficerSecurity>({
    twoFactorAuth: 'Active (MahaGov SSO)',
    twoFactorMethod: 'Secured via OTP & Gov Domain',
    accessClearanceLevel: 'Level 3 Officer',
    accessScope: 'District-wide approval authority',
    farmerDataScope: `${user?.location || 'Yavatmal'} Jurisdiction`,
    farmerDataScopeDesc: 'Full crop scan and land parcel telemetry',
    lastPasswordChange: '38 days ago',
    passwordPolicy: 'Mandatory policy cycle: 90 days',
    activeWorkstationSession: 'MahaGov Intranet (10.52.18.44)',
    sessionSecurity: 'SSL TLS 1.3 encrypted tunnel',
    dataRetentionCompliance: 'DPDP Act & MahaState 2023',
    retentionDescription: 'Certified agricultural data repository',
  });

  // Edit Profile Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    email: profile.email || '',
    phone: profile.phone,
    district: profile.district,
  });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // Synchronize editForm with current profile whenever the modal opens
  const handleOpenEditModal = () => {
    setEditForm({
      email: profile.email || '',
      phone: profile.phone,
      district: profile.district,
    });
    setShowEditModal(true);
  };

  // Save changes tracking & toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3200);
  }, []);

  // ── Sync Settings with Backend API on Mount or when User changes ──
  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      const targetUserId = user?.id || getStoredUser()?.id;
      try {
        const data = await fetchOfficerSettings(targetUserId);
        if (!isMounted) return;

        if (data.profile) {
          setProfile(data.profile);
          setEditForm({
            email: data.profile.email || '',
            phone: data.profile.phone,
            district: data.profile.district,
          });
        }
        if (data.jurisdiction) {
          setJurisdiction(data.jurisdiction);
        }
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        if (data.aiPreferences) {
          setAiPrefs(data.aiPreferences);
        }
        if (data.security) {
          setSecurity(data.security);
        }
      } catch (err) {
        console.warn('Could not load officer settings from API, using defaults:', err);
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [user?.id, activeUserId]);

  // ── Notification Toggle Handler (Persisted to PostgreSQL) ──
  const handleNotificationToggle = async (key: keyof GovOfficerNotifications) => {
    const prevVal = notifications[key];
    const nextVal = !prevVal;
    const targetUserId = user?.id || getStoredUser()?.id;

    // Optimistic UI update
    setNotifications((prev) => ({ ...prev, [key]: nextVal }));

    try {
      await patchOfficerNotifications({ [key]: nextVal }, targetUserId);
      triggerToast('✓ Notification preferences updated!');
    } catch (err) {
      console.error('Failed to update notification in PostgreSQL:', err);
      // Revert on failure
      setNotifications((prev) => ({ ...prev, [key]: prevVal }));
      triggerToast('✕ Failed to update notification setting');
    }
  };

  // ── AI Preferences Toggle Handler (Persisted to PostgreSQL) ──
  const handleAiToggle = async (key: keyof GovOfficerAiPreferences) => {
    const prevVal = aiPrefs[key];
    const nextVal = !prevVal;
    const targetUserId = user?.id || getStoredUser()?.id;

    // Optimistic UI update
    setAiPrefs((prev) => ({ ...prev, [key]: nextVal }));

    try {
      await patchOfficerAiPreferences({ [key]: nextVal }, targetUserId);
      triggerToast('✓ AI preferences updated!');
    } catch (err) {
      console.error('Failed to update AI preference in PostgreSQL:', err);
      // Revert on failure
      setAiPrefs((prev) => ({ ...prev, [key]: prevVal }));
      triggerToast('✕ Failed to update AI preference');
    }
  };

  // ── Profile Save Handler (Persisted to PostgreSQL) ──
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingProfile) return;

    setIsSubmittingProfile(true);
    const targetUserId = user?.id || getStoredUser()?.id;

    try {
      const updatedProfile = await patchOfficerProfile(
        {
          email: editForm.email.trim() ? editForm.email.trim() : null,
          phone: editForm.phone.trim(),
          district: editForm.district.trim(),
        },
        targetUserId
      );

      setProfile((prev) => ({ ...prev, ...updatedProfile }));
      setEditForm({
        email: updatedProfile.email || '',
        phone: updatedProfile.phone,
        district: updatedProfile.district,
      });

      // Keep jurisdiction and security synced with the district update
      const newDiv = getAdministrativeDivision(updatedProfile.district);
      const newZone = getAgroClimaticZone(updatedProfile.district);
      setJurisdiction((prev) => ({
        ...prev,
        administrativeDivision: newDiv,
        agroClimaticZone: newZone,
        assignedDistrict: `${updatedProfile.district} District`,
        districtHq: `DSAO ${updatedProfile.district} HQ`,
        regionalDirectorate: `${newDiv} Regional Directorate`,
      }));
      setSecurity((prev) => ({
        ...prev,
        farmerDataScope: `${updatedProfile.district} Jurisdiction`,
      }));

      // Keep local session and stored users in sync so on page refresh, session matches PostgreSQL
      try {
        const sessionStr = localStorage.getItem('cropguard_session');
        if (sessionStr) {
          const sessionObj = JSON.parse(sessionStr);
          sessionObj.phone = updatedProfile.phone;
          sessionObj.location = updatedProfile.district;
          localStorage.setItem('cropguard_session', JSON.stringify(sessionObj));
        }
        const usersStr = localStorage.getItem('cropguard_users');
        if (usersStr) {
          const usersArr = JSON.parse(usersStr);
          const uIdx = usersArr.findIndex((u: any) => u.id === targetUserId);
          if (uIdx !== -1) {
            usersArr[uIdx].phone = updatedProfile.phone;
            usersArr[uIdx].location = updatedProfile.district;
            localStorage.setItem('cropguard_users', JSON.stringify(usersArr));
          }
        }
      } catch (storageErr) {
        console.warn('Could not update local session storage:', storageErr);
      }

      setShowEditModal(false);
      triggerToast('✓ Profile contact details updated!');
    } catch (err: any) {
      console.error('Failed to update officer profile in PostgreSQL:', err);
      triggerToast(`✕ ${err?.message || 'Failed to update profile details'}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  return (
    <div className="gov-settings-page">
      {/* Toast Feedback */}
      {showToast && (
        <div className="gov-settings-toast">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="gov-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="gov-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="gov-modal-header">
              <h3>Edit Profile Details</h3>
              <button className="gov-modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveModal}>
              <div className="gov-modal-body">
                <div className="gov-modal-form-group">
                  <label>Official Email Address</label>
                  <input
                    type="email"
                    className="gov-modal-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="e.g. officer@mahagov.in"
                  />
                </div>
                <div className="gov-modal-form-group">
                  <label>Contact Phone Number</label>
                  <input
                    type="tel"
                    className="gov-modal-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="gov-modal-form-group">
                  <label>Assigned District Station</label>
                  <input
                    type="text"
                    className="gov-modal-input"
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="gov-modal-footer">
                <button type="button" className="gov-btn-cancel" onClick={() => setShowEditModal(false)} disabled={isSubmittingProfile}>
                  Cancel
                </button>
                <button type="submit" className="gov-btn-apply" disabled={isSubmittingProfile}>
                  {isSubmittingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="gov-settings-header">
        <div className="gov-settings-title-wrap">
          <div className="gov-settings-gear-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div className="gov-settings-titles">
            <h1>Settings</h1>
            <p>Manage your CropGuard account, government role, notifications, AI preferences and data access.</p>
          </div>
        </div>
      </div>

      {/* ── Accordion Sections ── */}
      <div className="gov-settings-cards">
        {/* ============================================================
            1. Profile & Account (Expanded by default)
            ============================================================ */}
        <div className={`gov-section-card ${openSections[1] ? 'expanded' : ''}`}>
          <div className="gov-section-header" onClick={() => toggleSection(1)}>
            <div className="gov-section-header-left">
              <div className="gov-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="gov-section-title-text">
                <h3>Profile &amp; Account</h3>
                <p>View your profile information and government account details.</p>
              </div>
            </div>
            <div className="gov-section-header-right">
              <button className="gov-chevron-btn" aria-label="Toggle section">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: openSections[1] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {openSections[1] && (
            <div className="gov-section-body">
              {/* Profile Header Row with Avatar & Edit Profile Button */}
              <div className="gov-profile-row">
                <div className="gov-profile-identity">
                  <div className="gov-avatar-wrapper">
                    <div className="gov-profile-avatar-circle">
                      {profile.avatarInitials || (profile.name ? profile.name.slice(0, 2).toUpperCase() : 'AD')}
                    </div>
                    <button className="gov-avatar-camera-btn" title="Change photo" onClick={handleOpenEditModal}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </button>
                  </div>
                  <div className="gov-profile-info">
                    <h2 className="gov-profile-name">{profile.name}</h2>
                    <p className="gov-profile-designation">{profile.designation}</p>
                    <span className="gov-profile-dept-pill">{profile.stateDepartment}</span>
                  </div>
                </div>

                <button className="gov-edit-profile-btn" onClick={handleOpenEditModal}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* 3-Column Information Grid with Vertical Dividers */}
              <div className="gov-info-columns-grid">
                {/* Column 1: Employee ID & Department */}
                <div className="gov-info-col">
                  <div className="gov-info-item">
                    <div className="gov-item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                        <circle cx="7" cy="15" r="1.5" />
                        <line x1="12" y1="15" x2="17" y2="15" />
                      </svg>
                    </div>
                    <div className="gov-item-content">
                      <span className="gov-item-label">Employee ID</span>
                      <span className="gov-item-value">{profile.employeeId}</span>
                    </div>
                  </div>

                  <div className="gov-info-item">
                    <div className="gov-item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18" />
                        <path d="M5 21V9" />
                        <path d="M19 21V9" />
                        <path d="M9 21V9" />
                        <path d="M15 21V9" />
                        <path d="M2 9l10-5 10 5" />
                      </svg>
                    </div>
                    <div className="gov-item-content">
                      <span className="gov-item-label">Department / Office</span>
                      <span className="gov-item-value">{profile.department}</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Email & District */}
                <div className="gov-info-col gov-info-col-divider">
                  <div className="gov-info-item">
                    <div className="gov-item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="gov-item-content">
                      <span className="gov-item-label">Email</span>
                      <span className="gov-item-value">{profile.email || 'Not configured'}</span>
                    </div>
                  </div>

                  <div className="gov-info-item">
                    <div className="gov-item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className="gov-item-content">
                      <span className="gov-item-label">District</span>
                      <span className="gov-item-value">{profile.district}</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Phone Number & Designation */}
                <div className="gov-info-col gov-info-col-divider">
                  <div className="gov-info-item">
                    <div className="gov-item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div className="gov-item-content">
                      <span className="gov-item-label">Phone Number</span>
                      <span className="gov-item-value">{profile.phone}</span>
                    </div>
                  </div>

                  <div className="gov-info-item">
                    <div className="gov-item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="gov-item-content">
                      <span className="gov-item-label">Designation</span>
                      <span className="gov-item-value">{profile.designation}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            2. Organization & Jurisdiction (Collapsed)
            ============================================================ */}
        <div className={`gov-section-card ${openSections[2] ? 'expanded' : ''}`}>
          <div className="gov-section-header" onClick={() => toggleSection(2)}>
            <div className="gov-section-header-left">
              <div className="gov-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-3" />
                  <line x1="9" y1="9" x2="9" y2="9.01" />
                  <line x1="9" y1="13" x2="9" y2="13.01" />
                  <line x1="9" y1="17" x2="9" y2="17.01" />
                </svg>
              </div>
              <div className="gov-section-title-text">
                <h3>Organization &amp; Jurisdiction</h3>
                <p>Manage your assigned administrative area and government role.</p>
              </div>
            </div>
            <div className="gov-section-header-right">
              <button className="gov-chevron-btn" aria-label="Toggle section">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: openSections[2] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {openSections[2] && (
            <div className="gov-section-body">
              <div className="gov-details-grid">
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Assigned State</div>
                  <div className="gov-detail-val">{jurisdiction.assignedState}</div>
                  <div className="gov-detail-sub">State Code: {jurisdiction.stateCode}</div>
                </div>
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Administrative Division</div>
                  <div className="gov-detail-val">{jurisdiction.administrativeDivision}</div>
                  <div className="gov-detail-sub">{jurisdiction.agroClimaticZone}</div>
                </div>
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Assigned District</div>
                  <div className="gov-detail-val">{jurisdiction.assignedDistrict}</div>
                  <div className="gov-detail-sub">{jurisdiction.districtHq}</div>
                </div>
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Jurisdiction Code</div>
                  <div className="gov-detail-val">{jurisdiction.jurisdictionCode}</div>
                  <div className="gov-detail-sub">Official Registry ID</div>
                </div>
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Covered Talukas</div>
                  <div className="gov-detail-val">{jurisdiction.coveredTalukas}</div>
                  <div className="gov-detail-sub">{jurisdiction.agriculturalCircles}</div>
                </div>
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Reporting Authority</div>
                  <div className="gov-detail-val">{jurisdiction.reportingAuthority}</div>
                  <div className="gov-detail-sub">{jurisdiction.regionalDirectorate}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            3. Notifications (Collapsed)
            ============================================================ */}
        <div className={`gov-section-card ${openSections[3] ? 'expanded' : ''}`}>
          <div className="gov-section-header" onClick={() => toggleSection(3)}>
            <div className="gov-section-header-left">
              <div className="gov-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="gov-section-title-text">
                <h3>Notifications</h3>
                <p>Manage alerts related to crop health, risks, farmer reports and investigations.</p>
              </div>
            </div>
            <div className="gov-section-header-right">
              <button className="gov-chevron-btn" aria-label="Toggle section">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: openSections[3] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {openSections[3] && (
            <div className="gov-section-body">
              <div className="gov-pref-list">
                <div className="gov-pref-row">
                  <div className="gov-pref-meta">
                    <span className="gov-pref-title">High-Risk Disease &amp; Pest Outbreak Alerts</span>
                    <p className="gov-pref-desc">Instant SMS and portal push notifications when 5+ infected crop scans cluster in a 5km radius.</p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={notifications.highRiskOutbreaks}
                      onChange={() => handleNotificationToggle('highRiskOutbreaks')}
                    />
                    <span className="gov-slider"></span>
                  </label>
                </div>

                <div className="gov-pref-row">
                  <div className="gov-pref-meta">
                    <span className="gov-pref-title">Farmer Scan Submissions Requiring Verification</span>
                    <p className="gov-pref-desc">Notify when farmer scans are marked as 'Needs Expert Verification' by AI model.</p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={notifications.farmerSubmissions}
                      onChange={() => handleNotificationToggle('farmerSubmissions')}
                    />
                    <span className="gov-slider"></span>
                  </label>
                </div>

                <div className="gov-pref-row">
                  <div className="gov-pref-meta">
                    <span className="gov-pref-title">Weekly Taluka Disease Surveillance Digest</span>
                    <p className="gov-pref-desc">Comprehensive Monday briefing compiling weather vulnerability, pest hotspots and farmer queries.</p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={notifications.weeklySurveillance}
                      onChange={() => handleNotificationToggle('weeklySurveillance')}
                    />
                    <span className="gov-slider"></span>
                  </label>
                </div>

                <div className="gov-pref-row">
                  <div className="gov-pref-meta">
                    <span className="gov-pref-title">Urgent Field Inspection Requests from Extension Workers</span>
                    <p className="gov-pref-desc">Receive real-time alerts when field scouts tag severe crop damage requiring officer visits.</p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={notifications.urgentFieldVisits}
                      onChange={() => handleNotificationToggle('urgentFieldVisits')}
                    />
                    <span className="gov-slider"></span>
                  </label>
                </div>

                <div className="gov-pref-row">
                  <div className="gov-pref-meta">
                    <span className="gov-pref-title">State Agriculture Department Circulars</span>
                    <p className="gov-pref-desc">Notifications for directives issued by Commissionerate of Agriculture, Maharashtra State.</p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={notifications.stateCirculars}
                      onChange={() => handleNotificationToggle('stateCirculars')}
                    />
                    <span className="gov-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            4. AI Preferences (Collapsed)
            ============================================================ */}
        <div className={`gov-section-card ${openSections[4] ? 'expanded' : ''}`}>
          <div className="gov-section-header" onClick={() => toggleSection(4)}>
            <div className="gov-section-header-left">
              <div className="gov-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
                </svg>
              </div>
              <div className="gov-section-title-text">
                <h3>AI Preferences</h3>
                <p>Configure AI recommendations, transparency and officer verification.</p>
              </div>
            </div>
            <div className="gov-section-header-right">
              <button className="gov-chevron-btn" aria-label="Toggle section">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: openSections[4] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {openSections[4] && (
            <div className="gov-section-body">
              <div className="gov-pref-list">
                <div className="gov-pref-row">
                  <div className="gov-pref-meta">
                    <span className="gov-pref-title">Automated Disease Detection Pre-Filtering</span>
                    <p className="gov-pref-desc">FastAPI deep-learning MobileNetV3 models pre-classify crop and disease signatures automatically.</p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={aiPrefs.autoPreFilter}
                      onChange={() => handleAiToggle('autoPreFilter')}
                    />
                    <span className="gov-slider"></span>
                  </label>
                </div>

                <div className="gov-pref-row">
                  <div className="gov-pref-meta">
                    <span className="gov-pref-title">Grad-CAM Leaf Lesion Heatmap Overlays</span>
                    <p className="gov-pref-desc">Display visual explanation maps highlighting key infected regions identified by CNN layers.</p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={aiPrefs.gradCamHeatmap}
                      onChange={() => handleAiToggle('gradCamHeatmap')}
                    />
                    <span className="gov-slider"></span>
                  </label>
                </div>

                <div className="gov-pref-row">
                  <div className="gov-pref-meta">
                    <span className="gov-pref-title">Auto-Suggest Agronomic &amp; Cultural Remedies</span>
                    <p className="gov-pref-desc">Include certified university (VNMKV / PDKV Akola) recommendations in pre-drafted advisories.</p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={aiPrefs.icarRemedies}
                      onChange={() => handleAiToggle('icarRemedies')}
                    />
                    <span className="gov-slider"></span>
                  </label>
                </div>

                <div className="gov-pref-row">
                  <div className="gov-pref-meta">
                    <span className="gov-pref-title">Primary Advisory Language in Marathi (मराठी)</span>
                    <p className="gov-pref-desc">Generate official farmer-facing advisories in Marathi with transliterated audio assistance.</p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={aiPrefs.languageMarathi}
                      onChange={() => handleAiToggle('languageMarathi')}
                    />
                    <span className="gov-slider"></span>
                  </label>
                </div>

                <div className="gov-pref-row">
                  <div className="gov-pref-meta">
                    <span className="gov-pref-title">Invasive Pathogen &amp; Anomaly Flagging</span>
                    <p className="gov-pref-desc">Highlight scans displaying symptoms outside normal regional disease distribution benchmarks.</p>
                  </div>
                  <label className="gov-switch">
                    <input
                      type="checkbox"
                      checked={aiPrefs.invasiveAnomalyFlagging}
                      onChange={() => handleAiToggle('invasiveAnomalyFlagging')}
                    />
                    <span className="gov-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            5. Security & Data Access (Collapsed)
            ============================================================ */}
        <div className={`gov-section-card ${openSections[5] ? 'expanded' : ''}`}>
          <div className="gov-section-header" onClick={() => toggleSection(5)}>
            <div className="gov-section-header-left">
              <div className="gov-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="gov-section-title-text">
                <h3>Security &amp; Data Access</h3>
                <p>Manage role-based and jurisdiction-based access to farmer data.</p>
              </div>
            </div>
            <div className="gov-section-header-right">
              <button className="gov-chevron-btn" aria-label="Toggle section">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: openSections[5] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {openSections[5] && (
            <div className="gov-section-body">
              <div className="gov-details-grid">
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Two-Factor Authentication</div>
                  <div className="gov-detail-val" style={{ color: '#0b5c2d' }}>{security.twoFactorAuth}</div>
                  <div className="gov-detail-sub">{security.twoFactorMethod}</div>
                </div>
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Access Clearance Level</div>
                  <div className="gov-detail-val">{security.accessClearanceLevel}</div>
                  <div className="gov-detail-sub">{security.accessScope}</div>
                </div>
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Farmer Data Scope</div>
                  <div className="gov-detail-val">{security.farmerDataScope}</div>
                  <div className="gov-detail-sub">{security.farmerDataScopeDesc}</div>
                </div>
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Last Password Change</div>
                  <div className="gov-detail-val">{security.lastPasswordChange}</div>
                  <div className="gov-detail-sub">{security.passwordPolicy}</div>
                </div>
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Active Workstation Session</div>
                  <div className="gov-detail-val">{security.activeWorkstationSession}</div>
                  <div className="gov-detail-sub">{security.sessionSecurity}</div>
                </div>
                <div className="gov-detail-box">
                  <div className="gov-detail-label">Data Retention Compliance</div>
                  <div className="gov-detail-val">{security.dataRetentionCompliance}</div>
                  <div className="gov-detail-sub">{security.retentionDescription}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Government Footer ── */}
      <footer className="gov-footer">
        <div className="gov-footer-left">
          © 2025 CropGuard | Maharashtra Agriculture Department | Government of Maharashtra
        </div>

        <div className="gov-footer-right">
          <a href="#privacy">Privacy Policy</a>
          <span>|</span>
          <a href="#terms">Terms of Use</a>
          <span>|</span>
          <a href="#help">Help &amp; Support</a>
        </div>
      </footer>
    </div>
  );
}
