-- ============================================================
-- SIH-Apex (CropGuard) Initial Database Schema
-- Version: 001
-- Tables: farmers, farms, crop_cycles, soil_tests, fertilizer_products
-- ============================================================

-- Ensure pgcrypto or uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 1. FARMERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE,
  preferred_language VARCHAR(30) DEFAULT 'marathi',
  state VARCHAR(80) NOT NULL DEFAULT 'Maharashtra',
  district VARCHAR(80) NOT NULL DEFAULT 'Akola',
  taluka VARCHAR(80),
  village VARCHAR(80),
  avatar_url VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_farmers_updated_at ON farmers;
CREATE TRIGGER trigger_farmers_updated_at
  BEFORE UPDATE ON farmers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 2. FARMS (Land Parcels / Plots)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  farm_name VARCHAR(120) NOT NULL,
  total_area NUMERIC(8, 2) NOT NULL CHECK (total_area > 0),
  area_unit VARCHAR(20) NOT NULL DEFAULT 'Acres',
  soil_type VARCHAR(120),
  irrigation_type VARCHAR(50) DEFAULT 'Drip',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  survey_number VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms(farmer_id);

DROP TRIGGER IF EXISTS trigger_farms_updated_at ON farms;
CREATE TRIGGER trigger_farms_updated_at
  BEFORE UPDATE ON farms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 3. CROP CYCLES (Seasonal Cultivation Tracking)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crop_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_id VARCHAR(50) NOT NULL,
  crop_name VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  season VARCHAR(50) NOT NULL DEFAULT 'Kharif',
  sowing_date DATE NOT NULL,
  expected_harvest_date DATE,
  current_stage VARCHAR(100) NOT NULL DEFAULT 'Germination',
  stage_day_count INTEGER NOT NULL DEFAULT 1,
  total_cycle_days INTEGER NOT NULL DEFAULT 120,
  allocated_acres NUMERIC(8, 2) NOT NULL CHECK (allocated_acres > 0),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  health_score INTEGER NOT NULL DEFAULT 75 CHECK (health_score BETWEEN 0 AND 100),
  today_advice TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crop_cycles_farm_id ON crop_cycles(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_status ON crop_cycles(status);

DROP TRIGGER IF EXISTS trigger_crop_cycles_updated_at ON crop_cycles;
CREATE TRIGGER trigger_crop_cycles_updated_at
  BEFORE UPDATE ON crop_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 4. SOIL TESTS (Soil Health Cards & Laboratory Assays)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS soil_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  sample_id VARCHAR(80) UNIQUE NOT NULL,
  testing_lab_name VARCHAR(150) NOT NULL,
  tested_by VARCHAR(120),
  sample_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'valid',
  
  -- Primary & Secondary Nutrients
  nitrogen_val NUMERIC(8, 2) NOT NULL,
  nitrogen_status VARCHAR(30) NOT NULL DEFAULT 'Low',
  nitrogen_target NUMERIC(8, 2) DEFAULT 120,
  
  phosphorus_val NUMERIC(8, 2) NOT NULL,
  phosphorus_status VARCHAR(30) NOT NULL DEFAULT 'Low',
  phosphorus_target NUMERIC(8, 2) DEFAULT 45,
  
  potassium_val NUMERIC(8, 2) NOT NULL,
  potassium_status VARCHAR(30) NOT NULL DEFAULT 'Adequate',
  potassium_target NUMERIC(8, 2) DEFAULT 80,
  
  ph_val NUMERIC(4, 2) NOT NULL CHECK (ph_val BETWEEN 0 AND 14),
  ph_label VARCHAR(60) NOT NULL DEFAULT 'Neutral',
  
  organic_carbon_percent NUMERIC(5, 2) NOT NULL CHECK (organic_carbon_percent >= 0),
  organic_carbon_status VARCHAR(30) NOT NULL DEFAULT 'Low',
  
  electrical_conductivity_ds_m NUMERIC(6, 2),
  
  -- Micronutrients
  zinc_status VARCHAR(50) DEFAULT 'Deficient',
  iron_status VARCHAR(50) DEFAULT 'Deficient',
  micronutrients_summary VARCHAR(255) DEFAULT 'Fe & Zn Deficient',
  
  health_index_score INTEGER DEFAULT 74 CHECK (health_index_score BETWEEN 0 AND 100),
  report_pdf_url VARCHAR(255),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soil_tests_farm_id ON soil_tests(farm_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_sample_date ON soil_tests(sample_date);

DROP TRIGGER IF EXISTS trigger_soil_tests_updated_at ON soil_tests;
CREATE TRIGGER trigger_soil_tests_updated_at
  BEFORE UPDATE ON soil_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 5. FERTILIZER PRODUCTS (Catalog of Approved Nutrients)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fertilizer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(50) NOT NULL,
  formula VARCHAR(100),
  composition VARCHAR(150) NOT NULL,
  standard_package_size_kg NUMERIC(8, 2) NOT NULL DEFAULT 50.00,
  package_unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  subsidized_price_inr NUMERIC(10, 2) NOT NULL DEFAULT 266.50,
  mrp_inr NUMERIC(10, 2),
  badge_text VARCHAR(100),
  bag_color_hex VARCHAR(20) NOT NULL DEFAULT '#1e56a0',
  description TEXT,
  is_organic BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fertilizer_products_category ON fertilizer_products(category);
CREATE INDEX IF NOT EXISTS idx_fertilizer_products_code ON fertilizer_products(product_code);

DROP TRIGGER IF EXISTS trigger_fertilizer_products_updated_at ON fertilizer_products;
CREATE TRIGGER trigger_fertilizer_products_updated_at
  BEFORE UPDATE ON fertilizer_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 6. GOVERNMENT OFFICERS (Agriculture Dept Officials & Users)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 7. GOVERNMENT OFFICER SETTINGS (Jurisdiction, Notifications, AI, Security)
-- ------------------------------------------------------------
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

