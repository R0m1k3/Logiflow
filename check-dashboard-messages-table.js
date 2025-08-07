// Quick script to check dashboard_messages table status in production
import pkg from 'pg';
const { Pool } = pkg;

async function checkDashboardMessagesTable() {
  // Skip if not production or no DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.log('❌ No DATABASE_URL found - skipping table check');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking dashboard_messages table structure...');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_messages'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table dashboard_messages does not exist!');
      console.log('💡 Run the migration: migration_dashboard_messages.sql');
      return;
    }
    
    console.log('✅ Table dashboard_messages exists');
    
    // Check table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_messages'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Table structure:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check required columns
    const requiredColumns = ['id', 'title', 'content', 'type', 'store_id', 'created_by', 'created_at'];
    const existingColumns = columns.rows.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing required columns:', missingColumns);
    } else {
      console.log('✅ All required columns present');
    }
    
    // Check for sample data
    const count = await pool.query('SELECT COUNT(*) FROM dashboard_messages');
    console.log(`📊 Current messages count: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
    
    if (error.message.includes('dashboard_messages') && error.message.includes('does not exist')) {
      console.log('💡 Table does not exist - run migration_dashboard_messages.sql');
    }
  } finally {
    await pool.end();
  }
}

checkDashboardMessagesTable();