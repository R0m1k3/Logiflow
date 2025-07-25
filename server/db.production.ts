import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// Production database configuration using standard PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : true, // Enable SSL for external connections
  max: 5, // Reduced pool size for Replit environment
  idleTimeoutMillis: 30000, // Reduced idle timeout
  connectionTimeoutMillis: 20000, // Increased connection timeout for Replit
  maxUses: 1000, // Reduced connection reuse
  allowExitOnIdle: false // Keep pool alive in Replit
});

export const db = drizzle(pool, { schema });
export { pool };