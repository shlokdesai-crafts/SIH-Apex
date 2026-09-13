import { query, testDbConnection } from '../config/database.js';
import { seedOfficer } from '../db/seed_officer.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Government Officer Settings Service (PostgreSQL Backed)
 * ─────────────────────────────────────────────────────────────────────────────
 * Connects directly to PostgreSQL tables:
 * - government_officers
 * - government_officer_settings
 * 
 * Reuses existing Express & database.ts pool connection.
 * Supports per-officer settings scoped by auth user_id.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface GovOfficerProfile {
  name: string;
  designation: string;
  department: string;
  stateDepartment: string;
  employeeId: string;
  email: string | null;
  district: string;
  phone: string;
  avatarInitials?: string;
}

export interface GovOfficerJurisdiction {
  assignedState: string;
  stateCode: string;
  administrativeDivision: string;
  agroClimaticZone: string;
  assignedDistrict: string;
  districtHq: string;
  jurisdictionCode: string;
  coveredTalukas: string;
  agriculturalCircles: string;
  reportingAuthority: string;
  regionalDirectorate: string;
}

export interface GovOfficerNotifications {
  highRiskOutbreaks: boolean;
  farmerSubmissions: boolean;
  weeklySurveillance: boolean;
  urgentFieldVisits: boolean;
  stateCirculars: boolean;
  appSoundAlerts: boolean;
}

export interface GovOfficerAiPreferences {
  autoPreFilter: boolean;
  gradCamHeatmap: boolean;
  icarRemedies: boolean;
  confidenceThreshold: number;
  languageMarathi: boolean;
  invasiveAnomalyFlagging: boolean;
}

export interface GovOfficerSecurity {
  twoFactorAuth: string;
  twoFactorMethod: string;
  accessClearanceLevel: string;
  accessScope: string;
  farmerDataScope: string;
  farmerDataScopeDesc: string;
  lastPasswordChange: string;
  passwordPolicy: string;
  activeWorkstationSession: string;
  sessionSecurity: string;
  dataRetentionCompliance: string;
  retentionDescription: string;
}

export interface GovOfficerSettings {
  profile: GovOfficerProfile;
  jurisdiction: GovOfficerJurisdiction;
  notifications: GovOfficerNotifications;
  aiPreferences: GovOfficerAiPreferences;
  security: GovOfficerSecurity;
  metadata: {
    lastUpdated: string;
    version: string;
    databaseConnected: boolean;
    storageEngine: 'postgresql';
  };
}

export interface SyncOfficerPayload {
  userId: string;
  name: string;
  phone: string;
  location?: string;
  district?: string;
}

/**
 * Generate Avatar Initials from officer name
 */
function getInitials(name: string): string {
  if (!name) return 'GO';
  const parts = name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Clean & extract district name from location or district string
 */
function parseDistrict(rawLoc?: string): string {
  if (!rawLoc || !rawLoc.trim()) return 'Yavatmal';
  const parts = rawLoc.split(',').map((p) => p.trim());
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower && lower !== 'india' && lower !== 'maharashtra' && !lower.includes('pin') && !/^\d+$/.test(lower)) {
      return part;
    }
  }
  return parts[0] || 'Yavatmal';
}

/**
 * Map Maharashtra district to its official Administrative Division
 */
export function getAdministrativeDivision(rawDistrict?: string): string {
  if (!rawDistrict) return 'Amravati Division';

  const d = rawDistrict.toLowerCase().replace(/district/gi, '').trim();

  // Mumbai Division (per explicit specification: Mumbai City / Mumbai Suburban -> Mumbai Division)
  if (d.includes('mumbai')) {
    return 'Mumbai Division';
  }

  // Konkan Division (Thane, Palghar, Raigad, Ratnagiri, Sindhudurg)
  if (
    d.includes('thane') ||
    d.includes('palghar') ||
    d.includes('raigad') ||
    d.includes('ratnagiri') ||
    d.includes('sindhudurg')
  ) {
    return 'Konkan Division';
  }

  // Pune Division (Western Maharashtra: Pune, Kolhapur, Satara, Sangli, Solapur)
  if (
    d.includes('pune') ||
    d.includes('kolhapur') ||
    d.includes('satara') ||
    d.includes('sangli') ||
    d.includes('solapur')
  ) {
    return 'Pune Division';
  }

  // Nashik Division (North Maharashtra: Nashik, Dhule, Jalgaon, Nandurbar, Ahmednagar)
  if (
    d.includes('nashik') ||
    d.includes('nasik') ||
    d.includes('dhule') ||
    d.includes('jalgaon') ||
    d.includes('nandurbar') ||
    d.includes('ahmednagar') ||
    d.includes('ahilyanagar')
  ) {
    return 'Nashik Division';
  }

  // Amravati Division (Western Vidarbha: Yavatmal, Amravati, Akola, Buldhana, Washim)
  if (
    d.includes('yavatmal') ||
    d.includes('amravati') ||
    d.includes('akola') ||
    d.includes('buldhana') ||
    d.includes('washim')
  ) {
    return 'Amravati Division';
  }

  // Nagpur Division (Eastern Vidarbha: Nagpur, Wardha, Bhandara, Gondia, Chandrapur, Gadchiroli)
  if (
    d.includes('nagpur') ||
    d.includes('wardha') ||
    d.includes('bhandara') ||
    d.includes('gondia') ||
    d.includes('chandrapur') ||
    d.includes('gadchiroli')
  ) {
    return 'Nagpur Division';
  }

  // Chhatrapati Sambhajinagar (Aurangabad) Division (Marathwada)
  if (
    d.includes('sambhajinagar') ||
    d.includes('aurangabad') ||
    d.includes('jalna') ||
    d.includes('beed') ||
    d.includes('parbhani') ||
    d.includes('nanded') ||
    d.includes('osmanabad') ||
    d.includes('dharashiv') ||
    d.includes('latur') ||
    d.includes('hingoli')
  ) {
    return 'Chhatrapati Sambhajinagar Division';
  }

  // Fallback: capitalized district + " Division"
  const cleaned = rawDistrict.replace(/district/gi, '').trim();
  if (cleaned.length > 0) {
    return `${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)} Division`;
  }
  return 'Amravati Division';
}

/**
 * Map district/division to its Agro-Climatic Zone
 */
export function getAgroClimaticZone(rawDistrict?: string): string {
  const division = getAdministrativeDivision(rawDistrict);
  switch (division) {
    case 'Mumbai Division':
    case 'Konkan Division':
      return 'South Konkan Coastal Zone';
    case 'Pune Division':
      return 'Western Maharashtra Ghat Zone';
    case 'Nashik Division':
      return 'North Maharashtra Scarcity Zone';
    case 'Amravati Division':
      return 'Vidarbha Agro-Climatic Zone';
    case 'Nagpur Division':
      return 'Central Vidarbha Zone';
    case 'Chhatrapati Sambhajinagar Division':
      return 'Marathwada Agro-Climatic Zone';
    default:
      return 'Vidarbha Agro-Climatic Zone';
  }
}

/**
 * Fetch raw officer joined with settings from PostgreSQL.
 * Scoped by userId if provided, otherwise falls back to the default/seeded officer.
 */
async function fetchOfficerRow(userId?: string): Promise<any> {
  const trimmedUserId = userId?.trim();

  if (trimmedUserId) {
    const userSql = `
      SELECT 
        o.id as officer_id,
        o.user_id,
        o.name,
        o.designation,
        o.department,
        o.state_department,
        o.employee_id,
        o.email,
        o.district,
        o.phone,
        o.avatar_initials,
        o.is_active,
        o.created_at as officer_created_at,
        o.updated_at as officer_updated_at,
        s.id as settings_id,
        s.assigned_state,
        s.state_code,
        s.administrative_division,
        s.agro_climatic_zone,
        s.assigned_district,
        s.district_hq,
        s.jurisdiction_code,
        s.covered_talukas,
        s.agricultural_circles,
        s.reporting_authority,
        s.regional_directorate,
        s.notif_high_risk_outbreaks,
        s.notif_farmer_submissions,
        s.notif_weekly_surveillance,
        s.notif_urgent_field_visits,
        s.notif_state_circulars,
        s.notif_app_sound_alerts,
        s.ai_auto_pre_filter,
        s.ai_grad_cam_heatmap,
        s.ai_icar_remedies,
        s.ai_confidence_threshold,
        s.ai_language_marathi,
        s.ai_invasive_anomaly_flagging,
        s.two_factor_auth,
        s.two_factor_method,
        s.access_clearance_level,
        s.access_scope,
        s.farmer_data_scope,
        s.farmer_data_scope_desc,
        s.last_password_change,
        s.password_policy,
        s.active_workstation_session,
        s.session_security,
        s.data_retention_compliance,
        s.retention_description,
        s.updated_at as settings_updated_at
      FROM government_officers o
      LEFT JOIN government_officer_settings s ON s.officer_id = o.id
      WHERE (o.user_id = $1 OR o.phone = $1 OR o.id::text = $1) AND o.is_active = TRUE
      LIMIT 1;
    `;
    const userRes = await query(userSql, [trimmedUserId]);
    if (userRes.rows.length > 0) {
      return userRes.rows[0];
    }
  }

  // Fallback to default active officer
  const defaultSql = `
    SELECT 
      o.id as officer_id,
      o.user_id,
      o.name,
      o.designation,
      o.department,
      o.state_department,
      o.employee_id,
      o.email,
      o.district,
      o.phone,
      o.avatar_initials,
      o.is_active,
      o.created_at as officer_created_at,
      o.updated_at as officer_updated_at,
      s.id as settings_id,
      s.assigned_state,
      s.state_code,
      s.administrative_division,
      s.agro_climatic_zone,
      s.assigned_district,
      s.district_hq,
      s.jurisdiction_code,
      s.covered_talukas,
      s.agricultural_circles,
      s.reporting_authority,
      s.regional_directorate,
      s.notif_high_risk_outbreaks,
      s.notif_farmer_submissions,
      s.notif_weekly_surveillance,
      s.notif_urgent_field_visits,
      s.notif_state_circulars,
      s.notif_app_sound_alerts,
      s.ai_auto_pre_filter,
      s.ai_grad_cam_heatmap,
      s.ai_icar_remedies,
      s.ai_confidence_threshold,
      s.ai_language_marathi,
      s.ai_invasive_anomaly_flagging,
      s.two_factor_auth,
      s.two_factor_method,
      s.access_clearance_level,
      s.access_scope,
      s.farmer_data_scope,
      s.farmer_data_scope_desc,
      s.last_password_change,
      s.password_policy,
      s.active_workstation_session,
      s.session_security,
      s.data_retention_compliance,
      s.retention_description,
      s.updated_at as settings_updated_at
    FROM government_officers o
    LEFT JOIN government_officer_settings s ON s.officer_id = o.id
    WHERE o.is_active = TRUE
    ORDER BY o.created_at ASC
    LIMIT 1;
  `;

  let res = await query(defaultSql);

  if (res.rows.length === 0) {
    // Auto-seed development officer if database has no active officer
    await seedOfficer();
    res = await query(defaultSql);
  }

  return res.rows[0];
}

/**
 * Format PostgreSQL row into standard GovOfficerSettings structure
 */
function formatSettings(row: any, isDbConnected: boolean): GovOfficerSettings {
  const lastUpdated = row.settings_updated_at || row.officer_updated_at || new Date().toISOString();
  const districtName = row.district || 'Yavatmal';
  const mappedDivision = getAdministrativeDivision(districtName);
  const mappedZone = getAgroClimaticZone(districtName);

  // Self-heal stored division in PostgreSQL if inconsistent with assigned district
  if (row.settings_id && (row.administrative_division !== mappedDivision || !row.assigned_district)) {
    query(
      `UPDATE government_officer_settings 
       SET administrative_division = $1,
           agro_climatic_zone = $2,
           assigned_district = $3,
           district_hq = $4,
           farmer_data_scope = $5,
           regional_directorate = $6,
           updated_at = NOW() 
       WHERE id = $7`,
      [
        mappedDivision,
        mappedZone,
        `${districtName} District`,
        `DSAO ${districtName} HQ`,
        `${districtName} Jurisdiction`,
        `${mappedDivision} Regional Directorate`,
        row.settings_id,
      ]
    ).catch((err) => console.warn('Could not auto-heal division in DB:', err));
  }

  return {
    profile: {
      name: row.name,
      designation: row.designation,
      department: row.department,
      stateDepartment: row.state_department,
      employeeId: row.employee_id,
      email: row.email || null,
      district: row.district,
      phone: row.phone,
      avatarInitials: row.avatar_initials || getInitials(row.name),
    },
    jurisdiction: {
      assignedState: row.assigned_state || 'Maharashtra',
      stateCode: row.state_code || 'MH (27)',
      administrativeDivision: mappedDivision,
      agroClimaticZone: row.agro_climatic_zone || mappedZone,
      assignedDistrict: row.assigned_district || `${districtName} District`,
      districtHq: row.district_hq || `DSAO ${districtName} HQ`,
      jurisdictionCode: row.jurisdiction_code || `MH-${districtName.slice(0, 3).toUpperCase()}-AGRI-02`,
      coveredTalukas: row.covered_talukas || `${districtName} & Surrounding`,
      agriculturalCircles: row.agricultural_circles || '12 Agricultural Circles',
      reportingAuthority: row.reporting_authority || 'Divisional Joint Director',
      regionalDirectorate: `${mappedDivision} Regional Directorate`,
    },
    notifications: {
      highRiskOutbreaks: row.notif_high_risk_outbreaks !== undefined ? Boolean(row.notif_high_risk_outbreaks) : true,
      farmerSubmissions: row.notif_farmer_submissions !== undefined ? Boolean(row.notif_farmer_submissions) : true,
      weeklySurveillance: row.notif_weekly_surveillance !== undefined ? Boolean(row.notif_weekly_surveillance) : true,
      urgentFieldVisits: row.notif_urgent_field_visits !== undefined ? Boolean(row.notif_urgent_field_visits) : true,
      stateCirculars: row.notif_state_circulars !== undefined ? Boolean(row.notif_state_circulars) : true,
      appSoundAlerts: Boolean(row.notif_app_sound_alerts),
    },
    aiPreferences: {
      autoPreFilter: row.ai_auto_pre_filter !== undefined ? Boolean(row.ai_auto_pre_filter) : true,
      gradCamHeatmap: row.ai_grad_cam_heatmap !== undefined ? Boolean(row.ai_grad_cam_heatmap) : true,
      icarRemedies: row.ai_icar_remedies !== undefined ? Boolean(row.ai_icar_remedies) : true,
      confidenceThreshold: row.ai_confidence_threshold ? parseInt(row.ai_confidence_threshold, 10) : 80,
      languageMarathi: row.ai_language_marathi !== undefined ? Boolean(row.ai_language_marathi) : true,
      invasiveAnomalyFlagging: row.ai_invasive_anomaly_flagging !== undefined ? Boolean(row.ai_invasive_anomaly_flagging) : true,
    },
    security: {
      twoFactorAuth: row.two_factor_auth || 'Active (MahaGov SSO)',
      twoFactorMethod: row.two_factor_method || 'Secured via OTP & Gov Domain',
      accessClearanceLevel: row.access_clearance_level || 'Level 3 Officer',
      accessScope: row.access_scope || 'District-wide approval authority',
      farmerDataScope: row.farmer_data_scope || `${row.district} Jurisdiction`,
      farmerDataScopeDesc: row.farmer_data_scope_desc || 'Full crop scan and land parcel telemetry',
      lastPasswordChange: row.last_password_change || '38 days ago',
      passwordPolicy: row.password_policy || 'Mandatory policy cycle: 90 days',
      activeWorkstationSession: row.active_workstation_session || 'MahaGov Intranet (10.52.18.44)',
      sessionSecurity: row.session_security || 'SSL TLS 1.3 encrypted tunnel',
      dataRetentionCompliance: row.data_retention_compliance || 'DPDP Act & MahaState 2023',
      retentionDescription: row.retention_description || 'Certified agricultural data repository',
    },
    metadata: {
      lastUpdated: new Date(lastUpdated).toISOString(),
      version: '1.0.0',
      databaseConnected: isDbConnected,
      storageEngine: 'postgresql',
    },
  };
}

/**
 * Synchronize or provision Government Officer record in PostgreSQL from auth signup/login.
 * Does NOT generate fake email; leaves email null until entered by officer.
 */
export async function syncOfficerUser(payload: SyncOfficerPayload): Promise<GovOfficerSettings> {
  const userId = payload.userId?.trim();
  const name = payload.name?.trim() || 'Government Officer';
  const phone = payload.phone?.trim() || '';
  const district = parseDistrict(payload.district || payload.location);
  const avatarInitials = getInitials(name);

  // Check if an officer already exists with this user_id or phone
  const existingRes = await query(
    `SELECT id, user_id, employee_id, district FROM government_officers WHERE user_id = $1 OR phone = $2 LIMIT 1`,
    [userId, phone]
  );

  let officerId: string;

  if (existingRes.rows.length > 0) {
    const existing = existingRes.rows[0];
    officerId = existing.id;
    // Preserve existing phone and district if already set in PostgreSQL to avoid reverting edits
    const phoneToSet = (existing.phone && existing.phone.trim()) ? existing.phone : phone;
    const districtToSet = (existing.district && existing.district.trim()) ? existing.district : district;
    const divisionToSet = getAdministrativeDivision(districtToSet);
    const zoneToSet = getAgroClimaticZone(districtToSet);

    // Update user_id, name, and initials
    await query(
      `UPDATE government_officers 
       SET user_id = $1, name = $2, phone = $3, district = $4, avatar_initials = $5, updated_at = NOW() 
       WHERE id = $6`,
      [userId, name, phoneToSet, districtToSet, avatarInitials, officerId]
    );

    // Update settings table to ensure administrative division matches district
    await query(
      `UPDATE government_officer_settings
       SET assigned_district = $1,
           administrative_division = $2,
           agro_climatic_zone = $3,
           district_hq = $4,
           farmer_data_scope = $5,
           regional_directorate = $6,
           updated_at = NOW()
       WHERE officer_id = $7`,
      [
        `${districtToSet} District`,
        divisionToSet,
        zoneToSet,
        `DSAO ${districtToSet} HQ`,
        `${districtToSet} Jurisdiction`,
        `${divisionToSet} Regional Directorate`,
        officerId,
      ]
    );
  } else {
    // Generate unique official employee ID (e.g. AGRO-3849)
    let employeeId = `AGRO-${Math.floor(1000 + Math.random() * 9000)}`;
    const empCheck = await query(`SELECT id FROM government_officers WHERE employee_id = $1`, [employeeId]);
    if (empCheck.rows.length > 0) {
      employeeId = `AGRO-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    // Insert new officer (email is NULL - no fake emails)
    const insertOfficerSql = `
      INSERT INTO government_officers (
        user_id,
        name,
        designation,
        department,
        state_department,
        employee_id,
        email,
        district,
        phone,
        avatar_initials,
        is_active
      ) VALUES ($1, $2, 'Agriculture Officer', 'Agriculture Department', 'Maharashtra Agriculture Department', $3, NULL, $4, $5, $6, TRUE)
      RETURNING id;
    `;
    const newOfficerRes = await query(insertOfficerSql, [
      userId,
      name,
      employeeId,
      district,
      phone,
      avatarInitials,
    ]);
    officerId = newOfficerRes.rows[0].id;

    const initialDivision = getAdministrativeDivision(district);
    const initialZone = getAgroClimaticZone(district);

    // Insert initial settings for this officer with matched administrative division
    const insertSettingsSql = `
      INSERT INTO government_officer_settings (
        officer_id,
        assigned_state,
        state_code,
        administrative_division,
        agro_climatic_zone,
        assigned_district,
        district_hq,
        jurisdiction_code,
        covered_talukas,
        agricultural_circles,
        reporting_authority,
        regional_directorate,
        notif_high_risk_outbreaks,
        notif_farmer_submissions,
        notif_weekly_surveillance,
        notif_urgent_field_visits,
        notif_state_circulars,
        notif_app_sound_alerts,
        ai_auto_pre_filter,
        ai_grad_cam_heatmap,
        ai_icar_remedies,
        ai_confidence_threshold,
        ai_language_marathi,
        ai_invasive_anomaly_flagging,
        two_factor_auth,
        two_factor_method,
        access_clearance_level,
        access_scope,
        farmer_data_scope,
        farmer_data_scope_desc,
        last_password_change,
        password_policy,
        active_workstation_session,
        session_security,
        data_retention_compliance,
        retention_description
      ) VALUES (
        $1,
        'Maharashtra',
        'MH (27)',
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        '12 Agricultural Circles',
        'Divisional Joint Director',
        $8,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        80,
        TRUE,
        TRUE,
        'Active (MahaGov SSO)',
        'Secured via OTP & Gov Domain',
        'Level 3 Officer',
        'District-wide approval authority',
        $9,
        'Full crop scan and land parcel telemetry',
        'Just now',
        'Mandatory policy cycle: 90 days',
        'MahaGov Intranet (10.52.18.44)',
        'SSL TLS 1.3 encrypted tunnel',
        'DPDP Act & MahaState 2023',
        'Certified agricultural data repository'
      );
    `;
    await query(insertSettingsSql, [
      officerId,
      initialDivision,
      initialZone,
      `${district} District`,
      `DSAO ${district} HQ`,
      `MH-${district.slice(0, 3).toUpperCase()}-AGRI-01`,
      `${district} & Surrounding Talukas`,
      `${initialDivision} Regional Directorate`,
      `${district} Jurisdiction`,
    ]);
  }

  return getOfficerSettings(userId);
}

/**
 * Fetch full officer settings from PostgreSQL scoped by userId
 */
export async function getOfficerSettings(userId?: string): Promise<GovOfficerSettings> {
  let isDbConnected = false;
  try {
    const dbStatus = await testDbConnection();
    isDbConnected = Boolean(dbStatus.connected);
  } catch {
    isDbConnected = false;
  }

  const row = await fetchOfficerRow(userId);
  return formatSettings(row, isDbConnected);
}

/**
 * Update Officer Profile in PostgreSQL scoped by userId
 */
export async function updateOfficerProfile(
  updates: Partial<GovOfficerProfile>,
  userId?: string
): Promise<GovOfficerProfile> {
  const currentRow = await fetchOfficerRow(userId);
  const officerId = currentRow.officer_id;

  let newEmail = currentRow.email;
  let newPhone = currentRow.phone;
  let newDistrict = currentRow.district;
  let newName = currentRow.name;
  let newDesignation = currentRow.designation;
  let newDepartment = currentRow.department;
  let newStateDepartment = currentRow.state_department;
  let newInitials = currentRow.avatar_initials;

  if (updates.email !== undefined) {
    if (updates.email && updates.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email.trim())) {
        throw new Error('Invalid email format. Please provide a valid email address.');
      }
      newEmail = updates.email.trim();
    } else {
      newEmail = null;
    }
  }

  if (updates.phone !== undefined) {
    const cleaned = updates.phone.replace(/[\s\-+]/g, '');
    if (cleaned.length < 10) {
      throw new Error('Phone number must contain at least 10 digits.');
    }
    newPhone = updates.phone.trim();
  }

  if (updates.district !== undefined && updates.district.trim()) {
    newDistrict = updates.district.trim();
  }

  if (updates.name !== undefined && updates.name.trim()) {
    newName = updates.name.trim();
    newInitials = getInitials(newName);
  }

  if (updates.designation !== undefined && updates.designation.trim()) {
    newDesignation = updates.designation.trim();
  }

  if (updates.department !== undefined && updates.department.trim()) {
    newDepartment = updates.department.trim();
  }

  if (updates.stateDepartment !== undefined && updates.stateDepartment.trim()) {
    newStateDepartment = updates.stateDepartment.trim();
  }

  // Update government_officers
  const updateOfficerSql = `
    UPDATE government_officers
    SET email = $1,
        phone = $2,
        district = $3,
        name = $4,
        designation = $5,
        department = $6,
        state_department = $7,
        avatar_initials = $8,
        updated_at = NOW()
    WHERE id = $9
    RETURNING *;
  `;

  const updatedRes = await query(updateOfficerSql, [
    newEmail,
    newPhone,
    newDistrict,
    newName,
    newDesignation,
    newDepartment,
    newStateDepartment,
    newInitials,
    officerId,
  ]);

  // If district was updated, keep jurisdiction & security in sync in government_officer_settings
  if (updates.district !== undefined && updates.district.trim()) {
    const division = getAdministrativeDivision(newDistrict);
    const agroZone = getAgroClimaticZone(newDistrict);
    const updateSettingsSql = `
      UPDATE government_officer_settings
      SET assigned_district = $1,
          administrative_division = $2,
          agro_climatic_zone = $3,
          district_hq = $4,
          farmer_data_scope = $5,
          regional_directorate = $6,
          updated_at = NOW()
      WHERE officer_id = $7;
    `;
    await query(updateSettingsSql, [
      `${newDistrict} District`,
      division,
      agroZone,
      `DSAO ${newDistrict} HQ`,
      `${newDistrict} Jurisdiction`,
      `${division} Regional Directorate`,
      officerId,
    ]);
  }

  const updatedRow = updatedRes.rows[0];
  return {
    name: updatedRow.name,
    designation: updatedRow.designation,
    department: updatedRow.department,
    stateDepartment: updatedRow.state_department,
    employeeId: updatedRow.employee_id,
    email: updatedRow.email || null,
    district: updatedRow.district,
    phone: updatedRow.phone,
    avatarInitials: updatedRow.avatar_initials,
  };
}

/**
 * Update Notification Preferences in PostgreSQL scoped by userId
 */
export async function updateOfficerNotifications(
  updates: Partial<GovOfficerNotifications>,
  userId?: string
): Promise<GovOfficerNotifications> {
  const currentRow = await fetchOfficerRow(userId);
  const officerId = currentRow.officer_id;

  const newHighRisk = typeof updates.highRiskOutbreaks === 'boolean' 
    ? updates.highRiskOutbreaks 
    : Boolean(currentRow.notif_high_risk_outbreaks);

  const newFarmerSubs = typeof updates.farmerSubmissions === 'boolean' 
    ? updates.farmerSubmissions 
    : Boolean(currentRow.notif_farmer_submissions);

  const newWeeklySurv = typeof updates.weeklySurveillance === 'boolean' 
    ? updates.weeklySurveillance 
    : Boolean(currentRow.notif_weekly_surveillance);

  const newUrgentField = typeof updates.urgentFieldVisits === 'boolean' 
    ? updates.urgentFieldVisits 
    : Boolean(currentRow.notif_urgent_field_visits);

  const newStateCirc = typeof updates.stateCirculars === 'boolean' 
    ? updates.stateCirculars 
    : Boolean(currentRow.notif_state_circulars);

  const newSoundAlerts = typeof updates.appSoundAlerts === 'boolean' 
    ? updates.appSoundAlerts 
    : Boolean(currentRow.notif_app_sound_alerts);

  const sql = `
    UPDATE government_officer_settings
    SET notif_high_risk_outbreaks = $1,
        notif_farmer_submissions = $2,
        notif_weekly_surveillance = $3,
        notif_urgent_field_visits = $4,
        notif_state_circulars = $5,
        notif_app_sound_alerts = $6,
        updated_at = NOW()
    WHERE officer_id = $7
    RETURNING 
      notif_high_risk_outbreaks,
      notif_farmer_submissions,
      notif_weekly_surveillance,
      notif_urgent_field_visits,
      notif_state_circulars,
      notif_app_sound_alerts;
  `;

  const res = await query(sql, [
    newHighRisk,
    newFarmerSubs,
    newWeeklySurv,
    newUrgentField,
    newStateCirc,
    newSoundAlerts,
    officerId,
  ]);

  const row = res.rows[0];
  return {
    highRiskOutbreaks: Boolean(row.notif_high_risk_outbreaks),
    farmerSubmissions: Boolean(row.notif_farmer_submissions),
    weeklySurveillance: Boolean(row.notif_weekly_surveillance),
    urgentFieldVisits: Boolean(row.notif_urgent_field_visits),
    stateCirculars: Boolean(row.notif_state_circulars),
    appSoundAlerts: Boolean(row.notif_app_sound_alerts),
  };
}

/**
 * Update AI Preferences in PostgreSQL scoped by userId
 */
export async function updateOfficerAiPreferences(
  updates: Partial<GovOfficerAiPreferences>,
  userId?: string
): Promise<GovOfficerAiPreferences> {
  const currentRow = await fetchOfficerRow(userId);
  const officerId = currentRow.officer_id;

  const newAutoPreFilter = typeof updates.autoPreFilter === 'boolean'
    ? updates.autoPreFilter
    : Boolean(currentRow.ai_auto_pre_filter);

  const newGradCam = typeof updates.gradCamHeatmap === 'boolean'
    ? updates.gradCamHeatmap
    : Boolean(currentRow.ai_grad_cam_heatmap);

  const newIcarRemedies = typeof updates.icarRemedies === 'boolean'
    ? updates.icarRemedies
    : Boolean(currentRow.ai_icar_remedies);

  let newConfidence = currentRow.ai_confidence_threshold ? parseInt(currentRow.ai_confidence_threshold, 10) : 80;
  if (typeof updates.confidenceThreshold === 'number') {
    if (updates.confidenceThreshold < 0 || updates.confidenceThreshold > 100) {
      throw new Error('Confidence threshold must be between 0 and 100.');
    }
    newConfidence = Math.round(updates.confidenceThreshold);
  }

  const newLangMarathi = typeof updates.languageMarathi === 'boolean'
    ? updates.languageMarathi
    : Boolean(currentRow.ai_language_marathi);

  const newInvasiveAnomaly = typeof updates.invasiveAnomalyFlagging === 'boolean'
    ? updates.invasiveAnomalyFlagging
    : Boolean(currentRow.ai_invasive_anomaly_flagging);

  const sql = `
    UPDATE government_officer_settings
    SET ai_auto_pre_filter = $1,
        ai_grad_cam_heatmap = $2,
        ai_icar_remedies = $3,
        ai_confidence_threshold = $4,
        ai_language_marathi = $5,
        ai_invasive_anomaly_flagging = $6,
        updated_at = NOW()
    WHERE officer_id = $7
    RETURNING 
      ai_auto_pre_filter,
      ai_grad_cam_heatmap,
      ai_icar_remedies,
      ai_confidence_threshold,
      ai_language_marathi,
      ai_invasive_anomaly_flagging;
  `;

  const res = await query(sql, [
    newAutoPreFilter,
    newGradCam,
    newIcarRemedies,
    newConfidence,
    newLangMarathi,
    newInvasiveAnomaly,
    officerId,
  ]);

  const row = res.rows[0];
  return {
    autoPreFilter: Boolean(row.ai_auto_pre_filter),
    gradCamHeatmap: Boolean(row.ai_grad_cam_heatmap),
    icarRemedies: Boolean(row.ai_icar_remedies),
    confidenceThreshold: row.ai_confidence_threshold,
    languageMarathi: Boolean(row.ai_language_marathi),
    invasiveAnomalyFlagging: Boolean(row.ai_invasive_anomaly_flagging),
  };
}

/**
 * Bulk or Partial Settings Update in PostgreSQL scoped by userId
 */
export async function updateOfficerSettings(
  payload: Partial<GovOfficerSettings>,
  userId?: string
): Promise<GovOfficerSettings> {
  if (payload.profile) {
    await updateOfficerProfile(payload.profile, userId);
  }
  if (payload.notifications) {
    await updateOfficerNotifications(payload.notifications, userId);
  }
  if (payload.aiPreferences) {
    await updateOfficerAiPreferences(payload.aiPreferences, userId);
  }
  return getOfficerSettings(userId);
}

/**
 * Reset Settings to Baseline Defaults in PostgreSQL scoped by userId
 */
export async function resetOfficerSettings(userId?: string): Promise<GovOfficerSettings> {
  if (userId) {
    const currentRow = await fetchOfficerRow(userId);
    const officerId = currentRow.officer_id;
    await query(`
      UPDATE government_officer_settings
      SET notif_high_risk_outbreaks = TRUE,
          notif_farmer_submissions = TRUE,
          notif_weekly_surveillance = TRUE,
          notif_urgent_field_visits = TRUE,
          notif_state_circulars = TRUE,
          notif_app_sound_alerts = FALSE,
          ai_auto_pre_filter = TRUE,
          ai_grad_cam_heatmap = TRUE,
          ai_icar_remedies = TRUE,
          ai_confidence_threshold = 80,
          ai_language_marathi = TRUE,
          ai_invasive_anomaly_flagging = TRUE,
          updated_at = NOW()
      WHERE officer_id = $1;
    `, [officerId]);
    return getOfficerSettings(userId);
  }

  await seedOfficer();
  return getOfficerSettings();
}
