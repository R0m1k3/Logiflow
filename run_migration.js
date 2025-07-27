// Script simple pour exécuter la migration webhook_url en production
// Usage: node run_migration.js

const { Pool } = require('pg');
const fs = require('fs');

// Configuration base de données (adaptez selon votre environnement)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🔄 Début de la migration webhook_url...');
    
    // Vérifier si la colonne existe déjà
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'groups' AND column_name = 'webhook_url'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ La colonne webhook_url existe déjà');
      return;
    }
    
    console.log('🔧 Ajout de la colonne webhook_url...');
    
    // Ajouter la colonne
    await pool.query(`
      ALTER TABLE groups ADD COLUMN webhook_url TEXT DEFAULT ''
    `);
    
    console.log('✅ Colonne webhook_url ajoutée avec succès');
    
    // Mettre à jour le groupe Frouard avec l'URL par défaut
    const updateResult = await pool.query(`
      UPDATE groups 
      SET webhook_url = 'https://workflow.ffnancy.fr/webhook-test/acf9cbf7-040a-4cf5-a43d-80210420d30a'
      WHERE name = 'Frouard' AND (webhook_url = '' OR webhook_url IS NULL)
    `);
    
    console.log(`✅ URL webhook configurée pour ${updateResult.rowCount} groupe(s)`);
    
    // Vérification finale
    const groups = await pool.query(`
      SELECT id, name, 
        CASE 
          WHEN webhook_url = '' OR webhook_url IS NULL THEN 'Non configuré'
          ELSE 'Configuré'
        END as webhook_status,
        webhook_url
      FROM groups 
      ORDER BY name
    `);
    
    console.log('📊 Statut des groupes après migration:');
    groups.rows.forEach(group => {
      console.log(`  - ${group.name}: ${group.webhook_status}`);
    });
    
    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✨ Migration webhook_url complétée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };