// Script pour vérifier l'état des tables en production
import { Pool } from 'pg';

async function checkProductionTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔍 PRODUCTION DATABASE CHECK - Starting table verification...');
  
  try {
    // Vérifier les tables SAV
    const savTablesQuery = `
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('sav_tickets', 'sav_ticket_history')
      ORDER BY table_name;
    `;
    
    console.log('📋 Checking SAV tables...');
    const savResult = await pool.query(savTablesQuery);
    
    if (savResult.rows.length === 0) {
      console.log('❌ SAV TABLES NOT FOUND - Tables sav_tickets and sav_ticket_history do not exist');
    } else {
      console.log('✅ SAV TABLES FOUND:');
      savResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}: ${row.column_count} columns`);
      });
    }

    // Vérifier toutes les tables principales
    const allTablesQuery = `
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('\n📊 ALL PRODUCTION TABLES:');
    const allResult = await pool.query(allTablesQuery);
    allResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}: ${row.column_count} columns`);
    });

    // Vérifier les données SAV si les tables existent
    if (savResult.rows.length > 0) {
      console.log('\n🔍 Checking SAV data...');
      try {
        const dataQuery = 'SELECT COUNT(*) as ticket_count FROM sav_tickets';
        const dataResult = await pool.query(dataQuery);
        console.log(`📈 SAV tickets count: ${dataResult.rows[0].ticket_count}`);
      } catch (error) {
        console.log('❌ Error checking SAV data:', error.message);
      }
    }

    console.log('\n✅ PRODUCTION DATABASE CHECK COMPLETED');

  } catch (error) {
    console.error('❌ DATABASE CHECK FAILED:', error.message);
    if (error.message.includes('endpoint has been disabled')) {
      console.log('💡 SOLUTION: Enable Neon database endpoint via Neon dashboard');
    }
  } finally {
    await pool.end();
  }
}

checkProductionTables().catch(console.error);