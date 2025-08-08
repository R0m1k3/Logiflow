// Script pour vérifier l'existence des tables SAV en production
import pkg from 'pg';
const { Pool } = pkg;

console.log('🔍 CHECKING PRODUCTION SAV TABLES...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 3000,
  connectionTimeoutMillis: 3000,
});

async function checkProductionTables() {
  try {
    console.log('📊 Connecting to production database...');
    
    // Check if SAV tables exist
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sav_tickets', 'sav_ticket_history')
      ORDER BY table_name;
    `);
    
    console.log(`📋 Found ${tablesCheck.rows.length} SAV tables:`);
    tablesCheck.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    if (tablesCheck.rows.length === 0) {
      console.log('❌ CRITICAL: SAV tables do not exist in production!');
      console.log('🔧 REQUIRED: Create SAV tables in production database');
      
      // Show SQL to create tables
      console.log('\n📝 SQL to create SAV tables:');
      console.log(`
CREATE TABLE sav_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL,
    product_gencode VARCHAR(50),
    product_reference VARCHAR(100),
    product_designation TEXT NOT NULL,
    problem_type VARCHAR(50) NOT NULL,
    problem_description TEXT NOT NULL,
    resolution_description TEXT,
    status VARCHAR(20) DEFAULT 'nouveau',
    group_id INTEGER NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sav_ticket_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES sav_tickets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sav_tickets_group ON sav_tickets(group_id);
CREATE INDEX idx_sav_tickets_supplier ON sav_tickets(supplier_id);
CREATE INDEX idx_sav_tickets_status ON sav_tickets(status);
CREATE INDEX idx_sav_history_ticket ON sav_ticket_history(ticket_id);
      `);
      
    } else if (tablesCheck.rows.length === 2) {
      console.log('✅ All SAV tables exist - checking structure...');
      
      // Check columns for sav_tickets
      const ticketColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'sav_tickets'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 sav_tickets columns:');
      ticketColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check if there's any data
      const dataCount = await pool.query('SELECT COUNT(*) as count FROM sav_tickets');
      console.log(`\n📊 sav_tickets data: ${dataCount.rows[0].count} records`);
      
    } else {
      console.log('⚠️ PARTIAL: Only some SAV tables exist - check required');
    }
    
    // Check if there are any other related tables
    console.log('\n🔍 Checking all tables in database:');
    const allTables = await pool.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`📋 Total tables in production: ${allTables.rows.length}`);
    allTables.rows.forEach(table => {
      const mark = table.table_name.includes('sav') ? '🎫' : '📄';
      console.log(`   ${mark} ${table.table_name} (${table.table_type})`);
    });
    
    console.log('\n✅ Production table check completed');
    
  } catch (error) {
    console.error('❌ Error checking production tables:', error.message);
    
    if (error.message.includes('endpoint has been disabled')) {
      console.log('\n💡 SOLUTION:');
      console.log('   🔧 Neon database endpoint is disabled');
      console.log('   📱 Enable endpoint in Neon console');
      console.log('   🔄 Retry after enabling');
    }
  } finally {
    await pool.end();
  }
}

checkProductionTables();