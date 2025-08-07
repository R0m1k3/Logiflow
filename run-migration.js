#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Connecting to database...');
    
    // Test de connexion
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', testResult.rows[0].now);
    
    // Vérifier si la table existe
    console.log('🔍 Checking if dashboard_messages table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_messages'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log(`📋 Table dashboard_messages exists: ${tableExists}`);
    
    if (!tableExists) {
      console.log('🔧 Creating dashboard_messages table...');
      await pool.query(`
        CREATE TABLE dashboard_messages (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'info',
          store_id INTEGER,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Table dashboard_messages created successfully');
    } else {
      // Vérifier si la colonne type existe
      console.log('🔍 Checking if type column exists...');
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='dashboard_messages' 
        AND column_name='type'
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('🔧 Adding type column...');
        await pool.query(`
          ALTER TABLE dashboard_messages 
          ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'info'
        `);
        console.log('✅ Type column added successfully');
      } else {
        console.log('✅ Type column already exists');
      }
    }
    
    // Vérifier la structure finale
    console.log('📋 Final table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_messages'
      ORDER BY ordinal_position;
    `);
    
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Test d'insertion pour valider le schéma
    console.log('🧪 Testing message creation...');
    const testMessage = await pool.query(`
      INSERT INTO dashboard_messages (title, content, type, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, ['Test Migration', 'Migration test message', 'info', 'migration-script']);
    
    console.log('✅ Test message created:', testMessage.rows[0]);
    
    // Nettoyer le message de test
    await pool.query('DELETE FROM dashboard_messages WHERE created_by = $1', ['migration-script']);
    console.log('🧹 Test message cleaned up');
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();