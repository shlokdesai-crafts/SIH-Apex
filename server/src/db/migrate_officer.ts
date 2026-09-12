import { pool } from '../config/database.js';

/**
 * Migration runner specifically for Government Officer & Settings tables
 * Safely creates government_officers and government_officer_settings.
 * Preserves all existing tables and data untouched.
 */
async function runOfficerMigration() {
  console.log('================================================================');
  console.log('🏛️ SIH-APEX GOVERNMENT OFFICER DATABASE MIGRATION');
  console.log('================================================================\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('⏳ Creating government_officers and government_officer_settings tables...');

    const migrationSql = `
      -- 1. GOVERNMENT OFFICERS TABLE
      CREATE TABLE IF NOT EXISTS government_officers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(100) UNIQUE,
        name VARCHAR(150) NOT NULL,
        designation VARCHAR(120) NOT NULL DEFAULT 'Agriculture Officer',
        department VARCHAR(150) NOT NULL DEFAULT 'Agriculture Department',
        state_department VARCHAR(180) NOT NULL DEFAULT 'Maharashtra Agriculture Department',
        employee_id VARCHAR(80) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE,
        district VARCHAR(100) NOT NULL DEFAULT 'Yavatmal',
        phone VARCHAR(30) NOT NULL,
        avatar_initials VARCHAR(10) DEFAULT 'AD',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_government_officers_email ON government_officers(email);
      CREATE INDEX IF NOT EXISTS idx_government_officers_employee_id ON government_officers(employee_id);
      CREATE INDEX IF NOT EXISTS idx_government_officers_user_id ON government_officers(user_id);

      DROP TRIGGER IF EXISTS trigger_government_officers_updated_at ON government_officers;
      CREATE TRIGGER trigger_government_officers_updated_at
        BEFORE UPDATE ON government_officers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- 2. GOVERNMENT OFFICER SETTINGS TABLE
      CREATE TABLE IF NOT EXISTS government_officer_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        officer_id UUID NOT NULL UNIQUE REFERENCES government_officers(id) ON DELETE CASCADE,
        
        -- Jurisdiction & Organization
        assigned_state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
        state_code VARCHAR(30) NOT NULL DEFAULT 'MH (27)',
        administrative_division VARCHAR(120) NOT NULL DEFAULT 'Amravati Division',
        agro_climatic_zone VARCHAR(150) NOT NULL DEFAULT 'Vidarbha Agro-Climatic Zone',
        assigned_district VARCHAR(120) NOT NULL DEFAULT 'Yavatmal District',
        district_hq VARCHAR(150) NOT NULL DEFAULT 'DSAO Yavatmal HQ',
        jurisdiction_code VARCHAR(80) NOT NULL DEFAULT 'MH-YTL-AGRI-02',
        covered_talukas VARCHAR(150) NOT NULL DEFAULT 'Yavatmal & Kalamb',
        agricultural_circles VARCHAR(100) NOT NULL DEFAULT '12 Agricultural Circles',
        reporting_authority VARCHAR(150) NOT NULL DEFAULT 'Divisional Joint Director',
        regional_directorate VARCHAR(150) NOT NULL DEFAULT 'Amravati Regional Directorate',

        -- Notification Preferences
        notif_high_risk_outbreaks BOOLEAN NOT NULL DEFAULT TRUE,
        notif_farmer_submissions BOOLEAN NOT NULL DEFAULT TRUE,
        notif_weekly_surveillance BOOLEAN NOT NULL DEFAULT TRUE,
        notif_urgent_field_visits BOOLEAN NOT NULL DEFAULT TRUE,
        notif_state_circulars BOOLEAN NOT NULL DEFAULT TRUE,
        notif_app_sound_alerts BOOLEAN NOT NULL DEFAULT FALSE,

        -- AI Preferences
        ai_auto_pre_filter BOOLEAN NOT NULL DEFAULT TRUE,
        ai_grad_cam_heatmap BOOLEAN NOT NULL DEFAULT TRUE,
        ai_icar_remedies BOOLEAN NOT NULL DEFAULT TRUE,
        ai_confidence_threshold INTEGER NOT NULL DEFAULT 80 CHECK (ai_confidence_threshold BETWEEN 0 AND 100),
        ai_language_marathi BOOLEAN NOT NULL DEFAULT TRUE,
        ai_invasive_anomaly_flagging BOOLEAN NOT NULL DEFAULT TRUE,

        -- Security & Data Access Clearance
        two_factor_auth VARCHAR(100) NOT NULL DEFAULT 'Active (MahaGov SSO)',
        two_factor_method VARCHAR(150) NOT NULL DEFAULT 'Secured via OTP & Gov Domain',
        access_clearance_level VARCHAR(100) NOT NULL DEFAULT 'Level 3 Officer',
        access_scope VARCHAR(150) NOT NULL DEFAULT 'District-wide approval authority',
        farmer_data_scope VARCHAR(150) NOT NULL DEFAULT 'Yavatmal Jurisdiction',
        farmer_data_scope_desc VARCHAR(200) NOT NULL DEFAULT 'Full crop scan and land parcel telemetry',
        last_password_change VARCHAR(100) NOT NULL DEFAULT '38 days ago',
        password_policy VARCHAR(150) NOT NULL DEFAULT 'Mandatory policy cycle: 90 days',
        active_workstation_session VARCHAR(150) NOT NULL DEFAULT 'MahaGov Intranet (10.52.18.44)',
        session_security VARCHAR(150) NOT NULL DEFAULT 'SSL TLS 1.3 encrypted tunnel',
        data_retention_compliance VARCHAR(150) NOT NULL DEFAULT 'DPDP Act & MahaState 2023',
        retention_description VARCHAR(200) NOT NULL DEFAULT 'Certified agricultural data repository',

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_gov_officer_settings_officer_id ON government_officer_settings(officer_id);

      DROP TRIGGER IF EXISTS trigger_government_officer_settings_updated_at ON government_officer_settings;
      CREATE TRIGGER trigger_government_officer_settings_updated_at
        BEFORE UPDATE ON government_officer_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await client.query(migrationSql);
    await client.query('COMMIT');
    console.log('✅ Migration executed and committed successfully!\n');

    // Verification check for all 7 tables
    console.log('🔍 Checking database table inventory:');
    const allTables = [
      'farmers',
      'farms',
      'crop_cycles',
      'soil_tests',
      'fertilizer_products',
      'government_officers',
      'government_officer_settings',
    ];

    for (const table of allTables) {
      const colRes = await client.query(
        "SELECT count(*) as cols FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
        [table]
      );
      const rowRes = await client.query(`SELECT count(*) as count FROM ${table}`);
      const colCount = parseInt(colRes.rows[0].cols, 10);
      const exists = colCount > 0;
      console.log(
        `   - ${table.padEnd(28)} : ${exists ? '✅ EXISTS' : '❌ MISSING'} | Columns: ${String(colCount).padEnd(2)} | Rows: ${rowRes.rows[0].count}`
      );
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runOfficerMigration();
