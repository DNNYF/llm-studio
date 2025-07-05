import { Pool } from 'pg';

let pool: Pool;

// Prevent multiple connections in development
if (!global.dbPool) {
  global.dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Heroku and other cloud providers often require SSL
    ssl: process.env.DATABASE_URL ? {
      rejectUnauthorized: false
    } : false,
  });
}

pool = global.dbPool;

export const db = pool;

// Extend the NodeJS.Global interface to include our dbPool
declare global {
  var dbPool: Pool;
}
