import pg from 'pg';

const { Pool } = pg;

// On Vercel / Cloud Production: ONLY connect to direct Postgres if DATABASE_URL or SUPABASE_DB_URL is explicitly set.
// If not set, pool safely throws in 0ms so API routes immediately use Supabase Cloud REST API without connection hangs or ECONNREFUSED.
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  (!isProduction ? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' : null);

let pool: pg.Pool;

if (connectionString) {
  if (isProduction) {
    pool = new Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 3000,
      ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com')
        ? { rejectUnauthorized: false }
        : undefined,
    });
  } else {
    // Prevent multiple pool instances during Next.js hot reload in local development
    const globalWithPg = global as typeof globalThis & {
      _pgPool?: pg.Pool;
    };
    if (!globalWithPg._pgPool) {
      globalWithPg._pgPool = new Pool({
        connectionString,
        max: 10,
        connectionTimeoutMillis: 2000,
      });
    }
    pool = globalWithPg._pgPool;
  }
} else {
  // Safe Mock Pool on Production when no direct PostgreSQL connection URL is configured
  pool = {
    query: async () => {
      throw new Error('NO_DIRECT_POSTGRES_POOL');
    },
    connect: async () => {
      throw new Error('NO_DIRECT_POSTGRES_POOL');
    },
  } as unknown as pg.Pool;
}

export { pool };
export default pool;


