import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// Production database configuration using standard PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Docker internal connection doesn't need SSL
  max: 10, // Reduced pool size for stability
  idleTimeoutMillis: 60000, // Increased idle timeout
  connectionTimeoutMillis: 10000, // Increased connection timeout
  acquireTimeoutMillis: 60000, // Wait time for acquiring connection
  maxUses: 7500, // Limit connection reuse
  allowExitOnIdle: true // Allow pool to close when idle
});

export const db = drizzle(pool, { schema });
export { pool };