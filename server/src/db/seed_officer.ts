import { pool } from '../config/database.js';

/**
 * Seed one development Government Officer record matching default settings
 * and link to the authentication user ID.
 */
export async function seedOfficer() {
  console.log('================================================================');
  console.log('🌱 SEEDING DEVELOPMENT GOVERNMENT OFFICER RECORD');
  console.log('================================================================\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert or update the development officer record
    const officerInsertSql = `
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
      ON CONFLICT (employee_id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        name = EXCLUDED.name,
        designation = EXCLUDED.designation,
        department = EXCLUDED.department,
        state_department = EXCLUDED.state_department,
        email = EXCLUDED.email,
        district = EXCLUDED.district,
        phone = EXCLUDED.phone,
        avatar_initials = EXCLUDED.avatar_initials,
        is_active = TRUE,
        updated_at = NOW()
      RETURNING id, name, employee_id, email, district;
    `;

    const officerRes = await client.query(officerInsertSql, [
      'officer-dev-001',
      'Dr. A. Deshmukh',
      'Agriculture Officer',
      'Agriculture Department',
      'Maharashtra Agriculture Department',
      'AGRO-2457',
      'deshmukh@mahagov.in',
      'Yavatmal',
      '+91 98765 43210',
      'AD',
    ]);

    const officer = officerRes.rows[0];
    console.log(`✅ Officer upserted: ${officer.name} (${officer.employee_id}) [ID: ${officer.id}]`);

    // 2. Insert or update corresponding officer settings
    const settingsInsertSql = `
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36
      )
      ON CONFLICT (officer_id) DO UPDATE SET
        assigned_state = EXCLUDED.assigned_state,
        state_code = EXCLUDED.state_code,
        administrative_division = EXCLUDED.administrative_division,
        agro_climatic_zone = EXCLUDED.agro_climatic_zone,
        assigned_district = EXCLUDED.assigned_district,
        district_hq = EXCLUDED.district_hq,
        jurisdiction_code = EXCLUDED.jurisdiction_code,
        covered_talukas = EXCLUDED.covered_talukas,
        agricultural_circles = EXCLUDED.agricultural_circles,
        reporting_authority = EXCLUDED.reporting_authority,
        regional_directorate = EXCLUDED.regional_directorate,
        notif_high_risk_outbreaks = EXCLUDED.notif_high_risk_outbreaks,
        notif_farmer_submissions = EXCLUDED.notif_farmer_submissions,
        notif_weekly_surveillance = EXCLUDED.notif_weekly_surveillance,
        notif_urgent_field_visits = EXCLUDED.notif_urgent_field_visits,
        notif_state_circulars = EXCLUDED.notif_state_circulars,
        notif_app_sound_alerts = EXCLUDED.notif_app_sound_alerts,
        ai_auto_pre_filter = EXCLUDED.ai_auto_pre_filter,
        ai_grad_cam_heatmap = EXCLUDED.ai_grad_cam_heatmap,
        ai_icar_remedies = EXCLUDED.ai_icar_remedies,
        ai_confidence_threshold = EXCLUDED.ai_confidence_threshold,
        ai_language_marathi = EXCLUDED.ai_language_marathi,
        ai_invasive_anomaly_flagging = EXCLUDED.ai_invasive_anomaly_flagging,
        two_factor_auth = EXCLUDED.two_factor_auth,
        two_factor_method = EXCLUDED.two_factor_method,
        access_clearance_level = EXCLUDED.access_clearance_level,
        access_scope = EXCLUDED.access_scope,
        farmer_data_scope = EXCLUDED.farmer_data_scope,
        farmer_data_scope_desc = EXCLUDED.farmer_data_scope_desc,
        last_password_change = EXCLUDED.last_password_change,
        password_policy = EXCLUDED.password_policy,
        active_workstation_session = EXCLUDED.active_workstation_session,
        session_security = EXCLUDED.session_security,
        data_retention_compliance = EXCLUDED.data_retention_compliance,
        retention_description = EXCLUDED.retention_description,
        updated_at = NOW()
      RETURNING id, assigned_district, jurisdiction_code;
    `;

    const settingsRes = await client.query(settingsInsertSql, [
      officer.id,
      'Maharashtra',
      'MH (27)',
      'Amravati Division',
      'Vidarbha Agro-Climatic Zone',
      'Yavatmal District',
      'DSAO Yavatmal HQ',
      'MH-YTL-AGRI-02',
      'Yavatmal & Kalamb',
      '12 Agricultural Circles',
      'Divisional Joint Director',
      'Amravati Regional Directorate',
      true, // highRiskOutbreaks
      true, // farmerSubmissions
      true, // weeklySurveillance
      true, // urgentFieldVisits
      true, // stateCirculars
      false, // appSoundAlerts
      true, // autoPreFilter
      true, // gradCamHeatmap
      true, // icarRemedies
      80, // confidenceThreshold
      true, // languageMarathi
      true, // invasiveAnomalyFlagging
      'Active (MahaGov SSO)',
      'Secured via OTP & Gov Domain',
      'Level 3 Officer',
      'District-wide approval authority',
      'Yavatmal Jurisdiction',
      'Full crop scan and land parcel telemetry',
      '38 days ago',
      'Mandatory policy cycle: 90 days',
      'MahaGov Intranet (10.52.18.44)',
      'SSL TLS 1.3 encrypted tunnel',
      'DPDP Act & MahaState 2023',
      'Certified agricultural data repository',
    ]);

    const settings = settingsRes.rows[0];
    console.log(`✅ Settings upserted: ${settings.assigned_district} (${settings.jurisdiction_code}) [ID: ${settings.id}]`);

    await client.query('COMMIT');
    console.log('\n🎉 Government officer seed transaction committed successfully!');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed_officer.ts') || process.argv[1]?.endsWith('seed_officer.js')) {
  seedOfficer()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
