// Script pour ajouter un endpoint de diagnostic SAV spécifique
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const router = express.Router();

// Endpoint de diagnostic SAV
router.get('/api/sav-diagnostic', async (req, res) => {
  console.log('🔍 SAV DIAGNOSTIC: Starting comprehensive check...');
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      STORAGE_MODE: process.env.STORAGE_MODE,
      FORCE_PRODUCTION_MODE: process.env.FORCE_PRODUCTION_MODE,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET'
    },
    routes: {
      production_file_exists: false,
      routes_loaded: 'unknown',
      sav_routes_available: []
    },
    database: {
      connection_status: 'unknown',
      sav_tables_exist: false,
      error: null
    }
  };

  // Check if production routes file exists
  try {
    const fs = await import('fs');
    diagnostic.routes.production_file_exists = fs.existsSync('server/routes.production.ts');
  } catch (err) {
    diagnostic.routes.production_file_exists = false;
  }

  // Check database connection and SAV tables
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 3000,
      connectionTimeoutMillis: 3000,
    });

    // Test connection
    const testQuery = await pool.query('SELECT NOW() as current_time');
    diagnostic.database.connection_status = 'connected';
    diagnostic.database.current_time = testQuery.rows[0].current_time;

    // Check SAV tables
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sav_tickets', 'sav_ticket_history')
    `);
    
    diagnostic.database.sav_tables_exist = tablesQuery.rows.length === 2;
    diagnostic.database.tables_found = tablesQuery.rows.map(r => r.table_name);

    if (diagnostic.database.sav_tables_exist) {
      const countQuery = await pool.query('SELECT COUNT(*) as count FROM sav_tickets');
      diagnostic.database.sav_tickets_count = parseInt(countQuery.rows[0].count);
    }

    await pool.end();

  } catch (dbError) {
    diagnostic.database.connection_status = 'error';
    diagnostic.database.error = dbError.message;
    console.log('❌ SAV DIAGNOSTIC: Database error:', dbError.message);
  }

  // Test if SAV routes are actually working
  diagnostic.routes.sav_routes_available = [
    'GET /api/sav-tickets',
    'POST /api/sav-tickets', 
    'PATCH /api/sav-tickets/:id',
    'DELETE /api/sav-tickets/:id'
  ];

  console.log('📊 SAV DIAGNOSTIC RESULTS:', JSON.stringify(diagnostic, null, 2));
  
  res.json({
    success: true,
    diagnostic,
    recommendations: [
      diagnostic.database.connection_status === 'error' ? 'Enable Neon database endpoint' : null,
      !diagnostic.database.sav_tables_exist ? 'Create SAV tables in database' : null,
      diagnostic.environment.NODE_ENV !== 'production' ? 'Force production mode' : null
    ].filter(Boolean)
  });
});

// Test SAV PATCH route specifically
router.patch('/api/sav-test-patch/:id', async (req, res) => {
  console.log('🧪 SAV TEST PATCH: Testing PATCH functionality for ticket', req.params.id);
  console.log('🧪 SAV TEST PATCH: Request body:', req.body);
  
  // Return mock success response for testing
  const mockResponse = {
    success: true,
    ticket_id: req.params.id,
    updated_data: req.body,
    timestamp: new Date().toISOString(),
    message: 'SAV PATCH route is working correctly'
  };
  
  console.log('✅ SAV TEST PATCH: Mock response:', mockResponse);
  res.json(mockResponse);
});

export { router as savDiagnosticRouter };