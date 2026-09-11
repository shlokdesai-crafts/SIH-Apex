import { pool } from '../config/database.js';

export interface FertilizerSeedItem {
  product_code: string;
  name: string;
  category: string;
  formula: string;
  composition: string;
  standard_package_size_kg: number;
  package_unit: string;
  subsidized_price_inr: number;
  mrp_inr: number;
  badge_text: string;
  bag_color_hex: string;
  description: string;
  is_organic: boolean;
}

export const FERTILIZER_PRODUCTS_SEED: FertilizerSeedItem[] = [
  {
    product_code: 'urea',
    name: 'Urea (46% N)',
    category: 'Nitrogenous',
    formula: 'CO(NH₂)₂',
    composition: '46% Nitrogen (N)',
    standard_package_size_kg: 50.00,
    package_unit: 'kg',
    subsidized_price_inr: 266.50,
    mrp_inr: 266.50,
    badge_text: 'Vegetative Canopy Flush',
    bag_color_hex: '#1e56a0',
    description: 'Primary nitrogen driver for canopy development, rapid leaf elongation, and chlorophyll synthesis.',
    is_organic: false,
  },
  {
    product_code: 'dap',
    name: 'Di-Ammonium Phosphate (DAP)',
    category: 'Phosphatic',
    formula: '(NH₄)₂HPO₄',
    composition: '18% Nitrogen (N), 46% Phosphorus (P₂O₅)',
    standard_package_size_kg: 50.00,
    package_unit: 'kg',
    subsidized_price_inr: 1350.00,
    mrp_inr: 1350.00,
    badge_text: 'Root Anchor & Flower Initiation',
    bag_color_hex: '#e67e22',
    description: 'Concentrated water-soluble phosphorus supplement promoting strong root development and synchronous flowering.',
    is_organic: false,
  },
  {
    product_code: 'mop',
    name: 'Muriate of Potash (MOP)',
    category: 'Potassic',
    formula: 'KCl',
    composition: '60% Potassium (K₂O)',
    standard_package_size_kg: 50.00,
    package_unit: 'kg',
    subsidized_price_inr: 1700.00,
    mrp_inr: 1750.00,
    badge_text: 'Grain Boldness & Fruit Brix',
    bag_color_hex: '#c0392b',
    description: 'High-potassium fertilizer enhancing stalk strength, disease immunity, drought tolerance, and fruit sugar content.',
    is_organic: false,
  },
  {
    product_code: 'ssp',
    name: 'Single Super Phosphate (SSP)',
    category: 'Phosphatic',
    formula: 'Ca(H₂PO₄)₂ + CaSO₄',
    composition: '16% P₂O₅, 11% Sulphur, 19% Calcium',
    standard_package_size_kg: 50.00,
    package_unit: 'kg',
    subsidized_price_inr: 425.00,
    mrp_inr: 475.00,
    badge_text: 'Boll Architecture & Sulphur',
    bag_color_hex: '#d35400',
    description: 'Provides water-soluble phosphorus and readily available sulphate sulphur for early root branching and boll retention.',
    is_organic: false,
  },
  {
    product_code: 'mgso4',
    name: 'Magnesium Sulphate (Epsom Salt)',
    category: 'Secondary',
    formula: 'MgSO₄·7H₂O',
    composition: '9.6% Magnesium (Mg), 12% Sulphur (S)',
    standard_package_size_kg: 25.00,
    package_unit: 'kg',
    subsidized_price_inr: 480.00,
    mrp_inr: 550.00,
    badge_text: 'Reddening Reversal',
    bag_color_hex: '#8e44ad',
    description: 'Foliar and basal magnesium supplement that reverses purple-red interveinal leaf chlorosis and restores active photosynthesis.',
    is_organic: false,
  },
  {
    product_code: 'bentonite-s',
    name: 'Bentonite Sulphur 90%',
    category: 'Secondary',
    formula: 'Pastille Granular S',
    composition: '90% Elemental Sulphur (S)',
    standard_package_size_kg: 25.00,
    package_unit: 'kg',
    subsidized_price_inr: 680.00,
    mrp_inr: 750.00,
    badge_text: 'Oil & Protein Synthesis',
    bag_color_hex: '#f39c12',
    description: 'Slow-release swelling bentonite pastilles that steadily oxidize into plant-available sulphate for oilseed pod filling.',
    is_organic: false,
  },
  {
    product_code: 'zinc-sulphate',
    name: 'Zinc Sulphate 21% (ZnSO₄)',
    category: 'Micronutrient',
    formula: 'ZnSO₄·7H₂O',
    composition: '21% Zinc (Zn), 10% Sulphur (S)',
    standard_package_size_kg: 10.00,
    package_unit: 'kg',
    subsidized_price_inr: 320.00,
    mrp_inr: 380.00,
    badge_text: 'Khaira & Enzyme Activator',
    bag_color_hex: '#16a085',
    description: 'Essential micronutrient preventing Khaira disease, bronze spotting, and internode shortening across cereals and pulses.',
    is_organic: false,
  },
  {
    product_code: 'vermicompost',
    name: 'Bio-Enriched Vermicompost',
    category: 'Organic',
    formula: 'Eisenia foetida Castings',
    composition: '1.8% N, 1.2% P, 1.5% K + Beneficial Flora',
    standard_package_size_kg: 50.00,
    package_unit: 'kg',
    subsidized_price_inr: 450.00,
    mrp_inr: 550.00,
    badge_text: '100% Bio-Certified Carbon',
    bag_color_hex: '#2e7d32',
    description: 'Humus-rich organic soil conditioner boosting water retention, aeration, and beneficial earthworm activity.',
    is_organic: true,
  },
  {
    product_code: 'neem-cake',
    name: 'De-oiled Neem Cake Powder',
    category: 'Organic',
    formula: 'Azadirachta indica Press-cake',
    composition: '4.5% N, 1.2% P, 1.5% K + 4% Neem Oil',
    standard_package_size_kg: 50.00,
    package_unit: 'kg',
    subsidized_price_inr: 750.00,
    mrp_inr: 850.00,
    badge_text: 'Bio-Nematicide & Nitrification Guard',
    bag_color_hex: '#1b5e20',
    description: 'Natural organic fertilizer and nitrification retarder that reduces nitrogen leaching and suppresses root-knot nematodes.',
    is_organic: true,
  },
  {
    product_code: 'jeevamrutha',
    name: 'Liquid Jeevamrutha Microbial Inoculant',
    category: 'Organic',
    formula: 'Desi Cow Dung & Urine Bio-Ferment',
    composition: '2x10^9 CFU/ml Beneficial Soil Microbes',
    standard_package_size_kg: 20.00,
    package_unit: 'Litre',
    subsidized_price_inr: 160.00,
    mrp_inr: 220.00,
    badge_text: 'Rhizosphere Bio-Activator',
    bag_color_hex: '#33691e',
    description: 'High-potency liquid bio-stimulant promoting mycorrhizal colonization and rapid nutrient bioavailability.',
    is_organic: true,
  },
];

async function seedDatabase() {
  console.log('====================================================');
  console.log('🌱 Seeding SIH-Apex Full Database (PostgreSQL 18)');
  console.log('====================================================\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Farmer (Ramesh Patil)
    console.log('👤 Seeding Farmer record...');
    const farmerUpsertSql = `
      INSERT INTO farmers (
        full_name,
        phone_number,
        email,
        preferred_language,
        state,
        district,
        taluka,
        village,
        avatar_url,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
      ON CONFLICT (phone_number) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        preferred_language = EXCLUDED.preferred_language,
        state = EXCLUDED.state,
        district = EXCLUDED.district,
        taluka = EXCLUDED.taluka,
        village = EXCLUDED.village,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
      RETURNING id, full_name, district;
    `;
    const farmerRes = await client.query(farmerUpsertSql, [
      'Ramesh Patil',
      '9822012345',
      'ramesh.patil@agri.in',
      'marathi',
      'Maharashtra',
      'Akola',
      'Murtizapur',
      'Karanja Lad',
      'images/ramesh_avatar.jpg',
    ]);
    const farmer = farmerRes.rows[0];
    console.log(`  ✓ Farmer: ${farmer.full_name} (${farmer.district}) [ID: ${farmer.id}]`);

    // 2. Seed Farm (Field 1)
    console.log('\n🚜 Seeding Farm parcel...');
    const farmCheckSql = `
      SELECT id FROM farms WHERE farmer_id = $1 AND farm_name = $2 LIMIT 1;
    `;
    let farmRes = await client.query(farmCheckSql, [farmer.id, 'Field 1']);
    let farmId: string;

    if (farmRes.rows.length > 0) {
      farmId = farmRes.rows[0].id;
      await client.query(
        `UPDATE farms SET 
          total_area = $1, 
          area_unit = $2, 
          soil_type = $3, 
          irrigation_type = $4,
          survey_number = $5,
          updated_at = NOW()
         WHERE id = $6;`,
        [3.50, 'Acres', 'Medium Black Clay Loam', 'Drip', '72/3A', farmId]
      );
    } else {
      const insertFarmSql = `
        INSERT INTO farms (
          farmer_id,
          farm_name,
          total_area,
          area_unit,
          soil_type,
          irrigation_type,
          latitude,
          longitude,
          survey_number,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
        RETURNING id;
      `;
      const inserted = await client.query(insertFarmSql, [
        farmer.id,
        'Field 1',
        3.50,
        'Acres',
        'Medium Black Clay Loam',
        'Drip',
        20.7002000,
        77.0082000,
        '72/3A',
      ]);
      farmId = inserted.rows[0].id;
    }
    console.log(`  ✓ Farm: Field 1 (3.5 Acres, Drip) [ID: ${farmId}]`);

    // 3. Seed Crop Cycles (Tomato, Cotton, Soybean, Sugarcane)
    console.log('\n🌾 Seeding Crop Cycles...');
    const cropCyclesSeed = [
      {
        crop_id: 'tomato',
        crop_name: 'Tomato',
        variety: 'Abhinav F1',
        season: 'Rabi',
        sowing_date: '2026-07-24',
        expected_harvest_date: '2026-11-21',
        current_stage: 'Flowering Stage',
        stage_day_count: 48,
        total_cycle_days: 120,
        allocated_acres: 3.50,
        health_score: 88,
        today_advice: 'Apply 2nd Nitrogen split (Urea) and give light drip irrigation early morning before 10 AM. Inspect lower leaves for blight spots.',
      },
      {
        crop_id: 'cotton',
        crop_name: 'Cotton',
        variety: 'Bt-II RCH 659',
        season: 'Kharif',
        sowing_date: '2026-07-12',
        expected_harvest_date: '2026-12-19',
        current_stage: 'Square Formation / Peak Flowering',
        stage_day_count: 60,
        total_cycle_days: 160,
        allocated_acres: 5.00,
        health_score: 82,
        today_advice: 'Monitor square shedding and bollworm pheromone traps. Apply balanced N-P-K with sulphur.',
      },
      {
        crop_id: 'soybean',
        crop_name: 'Soybean',
        variety: 'JS 335',
        season: 'Kharif',
        sowing_date: '2026-08-01',
        expected_harvest_date: '2026-11-04',
        current_stage: 'Pod Development Stage',
        stage_day_count: 40,
        total_cycle_days: 95,
        allocated_acres: 4.20,
        health_score: 90,
        today_advice: 'Foliar spray of 0:52:34 for uniform pod elongation. Avoid water stagnation.',
      },
      {
        crop_id: 'sugarcane',
        crop_name: 'Sugarcane',
        variety: 'Co 86032 (Nira)',
        season: 'Annual',
        sowing_date: '2026-05-13',
        expected_harvest_date: '2027-05-08',
        current_stage: 'Grand Growth Stage',
        stage_day_count: 120,
        total_cycle_days: 360,
        allocated_acres: 6.00,
        health_score: 85,
        today_advice: 'Ensure earthing-up and apply trash mulching to conserve root moisture.',
      },
    ];

    for (const c of cropCyclesSeed) {
      const existingCycle = await client.query(
        `SELECT id FROM crop_cycles WHERE farm_id = $1 AND crop_id = $2 LIMIT 1;`,
        [farmId, c.crop_id]
      );

      if (existingCycle.rows.length > 0) {
        await client.query(
          `UPDATE crop_cycles SET
            crop_name = $1,
            variety = $2,
            season = $3,
            sowing_date = $4,
            expected_harvest_date = $5,
            current_stage = $6,
            stage_day_count = $7,
            total_cycle_days = $8,
            allocated_acres = $9,
            health_score = $10,
            today_advice = $11,
            status = 'active',
            updated_at = NOW()
          WHERE id = $12;`,
          [
            c.crop_name,
            c.variety,
            c.season,
            c.sowing_date,
            c.expected_harvest_date,
            c.current_stage,
            c.stage_day_count,
            c.total_cycle_days,
            c.allocated_acres,
            c.health_score,
            c.today_advice,
            existingCycle.rows[0].id,
          ]
        );
        console.log(`  ✓ Updated crop cycle: ${c.crop_name} (${c.current_stage}, ${c.allocated_acres} Acres)`);
      } else {
        await client.query(
          `INSERT INTO crop_cycles (
            farm_id,
            crop_id,
            crop_name,
            variety,
            season,
            sowing_date,
            expected_harvest_date,
            current_stage,
            stage_day_count,
            total_cycle_days,
            allocated_acres,
            status,
            health_score,
            today_advice
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12, $13);`,
          [
            farmId,
            c.crop_id,
            c.crop_name,
            c.variety,
            c.season,
            c.sowing_date,
            c.expected_harvest_date,
            c.current_stage,
            c.stage_day_count,
            c.total_cycle_days,
            c.allocated_acres,
            c.health_score,
            c.today_advice,
          ]
        );
        console.log(`  ✓ Inserted crop cycle: ${c.crop_name} (${c.current_stage}, ${c.allocated_acres} Acres)`);
      }
    }

    // 4. Seed Soil Test (Sample SHC-MH-AKL-2026-089)
    console.log('\n🧪 Seeding Soil Test report...');
    const soilUpsertSql = `
      INSERT INTO soil_tests (
        farm_id,
        sample_id,
        testing_lab_name,
        tested_by,
        sample_date,
        status,
        nitrogen_val,
        nitrogen_status,
        nitrogen_target,
        phosphorus_val,
        phosphorus_status,
        phosphorus_target,
        potassium_val,
        potassium_status,
        potassium_target,
        ph_val,
        ph_label,
        organic_carbon_percent,
        organic_carbon_status,
        electrical_conductivity_ds_m,
        zinc_status,
        iron_status,
        micronutrients_summary,
        health_index_score,
        report_pdf_url,
        remarks
      ) VALUES (
        $1, $2, $3, $4, $5, 'valid',
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16,
        $17, $18,
        $19,
        $20, $21, $22,
        $23, $24, $25
      )
      ON CONFLICT (sample_id) DO UPDATE SET
        farm_id = EXCLUDED.farm_id,
        testing_lab_name = EXCLUDED.testing_lab_name,
        tested_by = EXCLUDED.tested_by,
        sample_date = EXCLUDED.sample_date,
        nitrogen_val = EXCLUDED.nitrogen_val,
        nitrogen_status = EXCLUDED.nitrogen_status,
        nitrogen_target = EXCLUDED.nitrogen_target,
        phosphorus_val = EXCLUDED.phosphorus_val,
        phosphorus_status = EXCLUDED.phosphorus_status,
        phosphorus_target = EXCLUDED.phosphorus_target,
        potassium_val = EXCLUDED.potassium_val,
        potassium_status = EXCLUDED.potassium_status,
        potassium_target = EXCLUDED.potassium_target,
        ph_val = EXCLUDED.ph_val,
        ph_label = EXCLUDED.ph_label,
        organic_carbon_percent = EXCLUDED.organic_carbon_percent,
        organic_carbon_status = EXCLUDED.organic_carbon_status,
        electrical_conductivity_ds_m = EXCLUDED.electrical_conductivity_ds_m,
        zinc_status = EXCLUDED.zinc_status,
        iron_status = EXCLUDED.iron_status,
        micronutrients_summary = EXCLUDED.micronutrients_summary,
        health_index_score = EXCLUDED.health_index_score,
        remarks = EXCLUDED.remarks,
        updated_at = NOW()
      RETURNING id, sample_id, nitrogen_val, phosphorus_val, potassium_val, ph_val;
    `;

    const soilRes = await client.query(soilUpsertSql, [
      farmId,
      'SHC-MH-AKL-2026-089',
      'District Soil Testing Laboratory, Akola (Dr. PDKV)',
      'Dr. S. K. Deshmukh',
      '2026-08-15',
      25.00,
      'Low',
      60.00,
      18.00,
      'Adequate',
      25.00,
      20.00,
      'Moderate',
      40.00,
      7.20,
      'Neutral',
      0.60,
      'Low',
      0.42,
      'Deficient',
      'Deficient',
      'Fe & Zn Deficient',
      76,
      '/reports/soil_test_SHC-MH-AKL-2026-089.pdf',
      'Soil is deficient in available Nitrogen and Zinc. Top-dress with Urea and Zinc Sulphate as per split schedule.',
    ]);
    const soil = soilRes.rows[0];
    console.log(
      `  ✓ Soil Test: ${soil.sample_id} | N: ${soil.nitrogen_val}, P: ${soil.phosphorus_val}, K: ${soil.potassium_val}, pH: ${soil.ph_val}`
    );

    // 5. Seed Fertilizer Products
    console.log('\n📦 Seeding Fertilizer Products Catalog...');
    const fertUpsertSql = `
      INSERT INTO fertilizer_products (
        product_code,
        name,
        category,
        formula,
        composition,
        standard_package_size_kg,
        package_unit,
        subsidized_price_inr,
        mrp_inr,
        badge_text,
        bag_color_hex,
        description,
        is_organic,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE)
      ON CONFLICT (product_code) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        formula = EXCLUDED.formula,
        composition = EXCLUDED.composition,
        standard_package_size_kg = EXCLUDED.standard_package_size_kg,
        package_unit = EXCLUDED.package_unit,
        subsidized_price_inr = EXCLUDED.subsidized_price_inr,
        mrp_inr = EXCLUDED.mrp_inr,
        badge_text = EXCLUDED.badge_text,
        bag_color_hex = EXCLUDED.bag_color_hex,
        description = EXCLUDED.description,
        is_organic = EXCLUDED.is_organic,
        updated_at = NOW()
      RETURNING id, product_code, name, category, subsidized_price_inr, is_organic;
    `;

    for (const item of FERTILIZER_PRODUCTS_SEED) {
      await client.query(fertUpsertSql, [
        item.product_code,
        item.name,
        item.category,
        item.formula,
        item.composition,
        item.standard_package_size_kg,
        item.package_unit,
        item.subsidized_price_inr,
        item.mrp_inr,
        item.badge_text,
        item.bag_color_hex,
        item.description,
        item.is_organic,
      ]);
    }
    console.log(`  ✓ Upserted ${FERTILIZER_PRODUCTS_SEED.length} certified fertilizer products.`);

    await client.query('COMMIT');
    console.log('\n✅ All database seed transactions committed successfully!');

    // Verification summary
    console.log('\n📊 Comprehensive Database Audit:');
    const tables = ['farmers', 'farms', 'crop_cycles', 'soil_tests', 'fertilizer_products'];
    for (const t of tables) {
      const c = await client.query(`SELECT count(*) as count FROM ${t}`);
      console.log(`   - ${t.padEnd(22)} : ${c.rows[0].count} rows`);
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();

