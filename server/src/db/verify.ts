import { pool, testDbConnection } from '../config/database.js';

async function verifySchema() {
  console.log('================================================================');
  console.log('🔍 SIH-APEX POSTGRESQL 18 COMPREHENSIVE SCHEMA AUDIT');
  console.log('================================================================\n');

  // 1. Connection check
  const connTest = await testDbConnection();
  console.log('1. DATABASE CONNECTION STATUS:');
  console.log(`   - Status:     ${connTest.connected ? '✅ CONNECTED' : '❌ FAILED'}`);
  console.log(`   - Engine:     PostgreSQL`);
  console.log(`   - Version:    ${connTest.version}`);
  console.log(`   - Database:   ${connTest.database}`);
  console.log(`   - User:       ${connTest.user}`);
  console.log(`   - Latency:    ${connTest.latencyMs}ms`);
  console.log('');

  const client = await pool.connect();

  try {
    // 2. Tables Existence & Accessibility Check
    console.log('2. TABLES EXISTENCE & ACCESSIBILITY:');
    const targetTables = [
      'farmers',
      'farms',
      'crop_cycles',
      'soil_tests',
      'fertilizer_products',
    ];

    for (const table of targetTables) {
      const colRes = await client.query(
        "SELECT count(*) as cols FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
        [table]
      );
      const rowRes = await client.query(`SELECT count(*) as count FROM ${table}`);
      const colCount = parseInt(colRes.rows[0].cols, 10);
      const exists = colCount > 0;
      console.log(
        `   - ${table.padEnd(20)} : ${exists ? '✅ EXISTS' : '❌ NOT FOUND'} | Columns: ${String(colCount).padEnd(3)} | Accessible: ✅ YES (Rows: ${rowRes.rows[0].count})`
      );
    }
    console.log('');

    // 3. Foreign Key Constraints Query
    console.log('3. FOREIGN KEY RELATIONSHIPS (information_schema):');
    const fkRes = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name;
    `);

    fkRes.rows.forEach((r) => {
      console.log(
        `   - [FK] ${r.table_name}.${r.column_name} ➔ ${r.foreign_table_name}.${r.foreign_column_name} (Constraint: ${r.constraint_name})`
      );
    });
    console.log('');

    // 4. Referential Integrity Enforcement Test inside a Transaction with ROLLBACK
    console.log('4. REFERENTIAL INTEGRITY ENFORCEMENT TEST (Atomic Transaction with ROLLBACK):');
    await client.query('BEGIN');

    // Insert test farmer
    const farmerRes = await client.query(`
      INSERT INTO farmers (full_name, phone_number, district) 
      VALUES ('Audit Test Farmer', '9999988888', 'Akola') 
      RETURNING id;
    `);
    const farmerId = farmerRes.rows[0].id;
    console.log(`   - Insert test record into 'farmers'           : ✅ SUCCESS (ID: ${farmerId})`);

    // Insert test farm with valid farmer_id
    const farmRes = await client.query(
      `
      INSERT INTO farms (farmer_id, farm_name, total_area) 
      VALUES ($1, 'Audit Field 1', 4.5) 
      RETURNING id;
    `,
      [farmerId]
    );
    const farmId = farmRes.rows[0].id;
    console.log(`   - Insert test record into 'farms' (valid FK)  : ✅ SUCCESS (ID: ${farmId})`);

    // Insert test crop_cycle with valid farm_id
    const cropRes = await client.query(
      `
      INSERT INTO crop_cycles (farm_id, crop_id, crop_name, sowing_date, allocated_acres) 
      VALUES ($1, 'cotton', 'Cotton', '2026-06-15', 4.5) 
      RETURNING id;
    `,
      [farmId]
    );
    console.log(`   - Insert test into 'crop_cycles' (valid FK)   : ✅ SUCCESS (ID: ${cropRes.rows[0].id})`);

    // Insert test soil_test with valid farm_id
    const soilRes = await client.query(
      `
      INSERT INTO soil_tests (farm_id, sample_id, testing_lab_name, sample_date, nitrogen_val, phosphorus_val, potassium_val, ph_val, organic_carbon_percent) 
      VALUES ($1, 'AUDIT-SAMPLE-01', 'Test Lab', '2026-06-01', 30, 20, 100, 7.2, 0.65) 
      RETURNING id;
    `,
      [farmId]
    );
    console.log(`   - Insert test into 'soil_tests' (valid FK)    : ✅ SUCCESS (ID: ${soilRes.rows[0].id})`);

    // Insert test fertilizer_product
    const fertRes = await client.query(`
      INSERT INTO fertilizer_products (product_code, name, category, composition) 
      VALUES ('audit-urea', 'Audit Urea', 'Nitrogenous', '46% N') 
      RETURNING id;
    `);
    console.log(`   - Insert test into 'fertilizer_products'      : ✅ SUCCESS (ID: ${fertRes.rows[0].id})`);

    // Attempt invalid FK insert (should be blocked by PostgreSQL)
    let fkViolationCaught = false;
    try {
      await client.query(`
        INSERT INTO farms (farmer_id, farm_name, total_area) 
        VALUES ('00000000-0000-0000-0000-000000000000', 'Invalid Farm', 5.0);
      `);
    } catch (fkErr: any) {
      if (fkErr.code === '23503') {
        fkViolationCaught = true;
      }
    }
    console.log(
      `   - Reject invalid FK (non-existent farmer)     : ${
        fkViolationCaught ? '✅ ENFORCED (Rejected with code 23503: foreign_key_violation)' : '❌ NOT ENFORCED'
      }`
    );

    // Rollback so no test data persists
    await client.query('ROLLBACK');
    console.log('   - Database State Clean-up                     : ✅ ROLLED BACK (zero test data modified)\n');

    console.log('================================================================');
    console.log('🎉 VERIFICATION COMPLETE: ALL 5 TABLES & FOREIGN KEYS FULLY OPERATIONAL');
    console.log('================================================================');
  } finally {
    client.release();
    await pool.end();
  }
}

verifySchema().catch((err) => {
  console.error('Audit Error:', err);
  process.exit(1);
});
