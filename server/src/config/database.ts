import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure environment variables are loaded reliably from server/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { Pool } = pg;

// Database connection pool configuration
export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sih_apex',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

// Prevent unexpected pool crashes
pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client:', err);
});

/**
 * Execute a parameterized query using the pool
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SQL] executed: "${text.substring(0, 80)}" in ${duration}ms (rows: ${res.rowCount})`);
  }
  return res;
}

/**
 * Test the database connection and return diagnostic info
 */
export async function testDbConnection(): Promise<{
  connected: boolean;
  database: string;
  user: string;
  version: string;
  timestamp: string;
  latencyMs: number;
}> {
  const start = Date.now();
  const client = await pool.connect();
  try {
    const res = await client.query(
      'SELECT current_database() as database, current_user as user, version() as version, NOW() as timestamp;'
    );
    const latencyMs = Date.now() - start;
    const row = res.rows[0];
    return {
      connected: true,
      database: row.database,
      user: row.user,
      version: row.version,
      timestamp: row.timestamp,
      latencyMs,
    };
  } finally {
    client.release();
  }
}

export default pool;
