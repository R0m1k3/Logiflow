import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
  try {
    console.log('🔍 Vérification de la structure de base de données...');
    
    // Vérifier quelle base de données nous utilisons
    const dbInfo = await pool.query('SELECT current_database(), version()');
    console.log('📊 Base de données actuelle:', dbInfo.rows[0].current_database);
    
    // Vérifier la structure de la table groups
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'groups'
      ORDER BY ordinal_position
    `;
    
    const columns = await pool.query(columnsQuery);
    
    console.log('📋 Colonnes de la table groups:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Vérifier spécifiquement la colonne webhook_url
    const webhookCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'groups' AND column_name = 'webhook_url'
    `);
    
    console.log('🔍 Colonne webhook_url existe:', webhookCheck.rows.length > 0);
    
    // Voir les données
    const groupsData = await pool.query('SELECT id, name, created_at FROM groups ORDER BY id');
    console.log('🏪 Groupes existants:', groupsData.rows.length, 'groupes');
    groupsData.rows.forEach(group => {
      console.log(`  - ID ${group.id}: ${group.name}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await pool.end();
  }
}

checkDatabase();