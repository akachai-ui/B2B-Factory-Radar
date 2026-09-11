import pg from 'pg';

const { Pool } = pg;

// Connection string to local/cloud PostgreSQL
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

let pool: pg.Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({ connectionString, max: 20 });
} else {
  // Prevent multiple pool instances during Next.js hot reload
  const globalWithPg = global as typeof globalThis & {
    _pgPool?: pg.Pool;
  };
  if (!globalWithPg._pgPool) {
    globalWithPg._pgPool = new Pool({ connectionString, max: 10 });
  }
  pool = globalWithPg._pgPool;
}

export { pool };
export default pool;
