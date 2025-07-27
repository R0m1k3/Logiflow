import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// Production database configuration using standard PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Production PostgreSQL server ne supporte pas SSL selon les logs
  max: 5, // Reasonable pool size for Replit
  min: 1, // Minimum connections to keep open
  idleTimeoutMillis: 30000, // 30 second idle timeout
  connectionTimeoutMillis: 20000, // 20 second connection timeout
  maxUses: 1000, // Higher reuse for better performance
  allowExitOnIdle: false, // Keep pool alive in Replit
  statement_timeout: 30000, // 30 second query timeout
  query_timeout: 30000, // 30 second overall query timeout
  application_name: 'LogiFlow_Production'
});

export const db = drizzle(pool, { schema });
export { pool };