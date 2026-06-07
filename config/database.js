// This module chooses a DB adapter: postgres pool (pg) or sqlite fallback.
const useSqlite = process.env.DB_CLIENT === 'sqlite' || (!process.env.DB_HOST && !process.env.DB_USER && !process.env.DB_PASSWORD);

let adapter;
if (useSqlite) {
  const mod = await import('./sqlite.js');
  adapter = mod.default;
} else {
  const pkg = await import('pg');
  const { Pool } = pkg;

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'classroom_management',
  });

  pool.client = 'pg';

  pool.on('error', (err) => console.error('Unexpected error on idle client', err));

  adapter = pool;
}

export default adapter;
