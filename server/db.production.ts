import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// Production database configuration using standard PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : true, // Enable SSL for external connections
  max: 3, // Further reduced pool size for stability
  min: 1, // Minimum connections to keep open
  idleTimeoutMillis: 20000, // Reduced idle timeout to 20 seconds
  connectionTimeoutMillis: 15000, // Reduced connection timeout
  maxUses: 500, // Reduced connection reuse to prevent stale connections
  allowExitOnIdle: false, // Keep pool alive in Replit
  statement_timeout: 10000, // 10 second query timeout
  query_timeout: 10000, // 10 second overall query timeout
  application_name: 'LogiFlow_Production'
});

export const db = drizzle(pool, { schema });
export { pool };