import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('=========================================');
  console.log('🌱 SIH-Apex Database Migration Runner');
  console.log('=========================================');

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log(`📄 Executing schema from: ${schemaPath}`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('⏳ Creating tables, indexes, and triggers...');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migration transaction committed successfully!\n');

    // Verification check for the five required tables
    console.log('🔍 Verifying created tables in database...');
    const expectedTables = [
      'farmers',
      'farms',
      'crop_cycles',
      'soil_tests',
      'fertilizer_products',
    ];

    const result = await client.query(
      `SELECT table_name, 
              (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
       FROM information_schema.tables t
       WHERE table_schema = 'public' 
         AND table_name = ANY($1::text[])
       ORDER BY table_name;`,
      [expectedTables]
    );

    const foundTables = result.rows.map((r) => r.table_name);
    console.log('------------------------------------------------------------');
    console.log('| Table Name           | Status   | Column Count           |');
    console.log('------------------------------------------------------------');

    for (const table of expectedTables) {
      const row = result.rows.find((r) => r.table_name === table);
      if (row) {
        console.log(
          `| ${table.padEnd(20)} | ✅ CREATED | ${String(row.column_count).padEnd(22)} |`
        );
      } else {
        console.log(`| ${table.padEnd(20)} | ❌ MISSING | -                      |`);
      }
    }
    console.log('------------------------------------------------------------');

    const allExist = expectedTables.every((t) => foundTables.includes(t));
    if (allExist) {
      console.log('\n🎉 ALL 5 TABLES VERIFIED SUCCESSFULLY!');
    } else {
      throw new Error('One or more expected tables are missing!');
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
