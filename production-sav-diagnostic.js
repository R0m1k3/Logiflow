// Script de diagnostic pour vérifier l'état des tables SAV en production
import { Pool } from 'pg';

// Environment variables are available via process.env (no dotenv needed in Replit)

async function diagnosticSavTables() {
  console.log('🔍 PRODUCTION SAV DIAGNOSTIC - Starting comprehensive check...');
  console.log(`🌐 Database URL exists: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  try {
    // Test basic connection
    console.log('🔗 Testing database connection...');
    const client = await pool.connect();
    const testResult = await client.query('SELECT NOW() as current_time, version()');
    console.log('✅ Connection successful:', testResult.rows[0].current_time);
    client.release();

    // Check SAV tables existence and structure
    console.log('\n📊 CHECKING SAV TABLES STRUCTURE:');
    
    const tablesQuery = `
      SELECT 
        schemaname,
        tablename,
        tableowner,
        hasindexes,
        hasrules,
        hastriggers
      FROM pg_tables 
      WHERE tablename IN ('sav_tickets', 'sav_ticket_history')
      ORDER BY tablename;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ SAV TABLES NOT FOUND!');
      console.log('💡 The SAV tables (sav_tickets, sav_ticket_history) do not exist in the database.');
      console.log('🔧 ACTION REQUIRED: Run SAV table migration');
    } else {
      console.log('✅ SAV TABLES FOUND:');
      tablesResult.rows.forEach(table => {
        console.log(`   📋 ${table.tablename}:`);
        console.log(`      - Schema: ${table.schemaname}`);
        console.log(`      - Owner: ${table.tableowner}`);
        console.log(`      - Has indexes: ${table.hasindexes}`);
        console.log(`      - Has triggers: ${table.hastriggers}`);
      });

      // Check columns for each table
      for (const table of tablesResult.rows) {
        console.log(`\n🔍 COLUMNS for ${table.tablename}:`);
        const columnsQuery = `
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `;
        
        const columnsResult = await pool.query(columnsQuery, [table.tablename]);
        columnsResult.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      }

      // Check data count
      console.log('\n📈 DATA COUNT:');
      if (tablesResult.rows.find(t => t.tablename === 'sav_tickets')) {
        try {
          const countResult = await pool.query('SELECT COUNT(*) as count FROM sav_tickets');
          console.log(`   🎫 sav_tickets: ${countResult.rows[0].count} records`);
        } catch (error) {
          console.log('   ❌ Error counting sav_tickets:', error.message);
        }
      }

      if (tablesResult.rows.find(t => t.tablename === 'sav_ticket_history')) {
        try {
          const historyCountResult = await pool.query('SELECT COUNT(*) as count FROM sav_ticket_history');
          console.log(`   📜 sav_ticket_history: ${historyCountResult.rows[0].count} records`);
        } catch (error) {
          console.log('   ❌ Error counting sav_ticket_history:', error.message);
        }
      }
    }

    // Check if migration functions exist
    console.log('\n🔧 CHECKING MIGRATION STATUS:');
    const migrationCheck = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sav_tickets'
      ) as sav_tables_exist;
    `;
    
    const migrationResult = await pool.query(migrationCheck);
    const tablesExist = migrationResult.rows[0].sav_tables_exist;
    
    console.log(`📊 Migration status: ${tablesExist ? 'COMPLETED' : 'PENDING'}`);
    
    if (!tablesExist) {
      console.log('\n🚨 MIGRATION REQUIRED:');
      console.log('   1. SAV tables need to be created');
      console.log('   2. Run: migrateSavTables() function');
      console.log('   3. Verify table creation');
    }

    console.log('\n✅ PRODUCTION SAV DIAGNOSTIC COMPLETED');
    
  } catch (error) {
    console.error('\n❌ DIAGNOSTIC FAILED:', error.message);
    
    if (error.message.includes('endpoint has been disabled')) {
      console.log('\n💡 SOLUTION REQUIRED:');
      console.log('   🔧 Neon database endpoint is disabled');
      console.log('   📱 Enable endpoint in Neon dashboard');
      console.log('   🔄 Retry diagnostic after enabling');
    }
    
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run diagnostic
diagnosticSavTables().catch(console.error);