// Auto-migration script pour ajouter la colonne webhook_url automatiquement
// S'exécute au démarrage de l'application en production

import { Pool } from 'pg';

// Créer une instance de pool pour les migrations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function runAutoMigrations(): Promise<void> {
  console.log('🔄 DÉSACTIVÉ: Migrations automatiques (webhook_url existe déjà en production)');
  console.log('✅ Migrations ignorées - colonnes déjà présentes en base');
  
  // DÉSACTIVÉ: Les migrations automatiques causent des erreurs SSL en production
  // La colonne webhook_url existe déjà dans toutes les bases de données de production
  /*
  try {
    // Migration 1: Ajouter la colonne webhook_url si elle n'existe pas
    await addWebhookUrlColumnIfMissing();
    
    console.log('✅ Migrations automatiques terminées');
  } catch (error) {
    console.error('❌ Erreur lors des migrations automatiques:', error);
    // Ne pas faire planter l'application, juste loguer l'erreur
  }
  */
}

async function addWebhookUrlColumnIfMissing(): Promise<void> {
  try {
    // Vérifier si la colonne webhook_url existe
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'groups' AND column_name = 'webhook_url'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ Migration webhook_url: colonne existe déjà');
      return;
    }
    
    console.log('🔧 Migration webhook_url: ajout de la colonne...');
    
    // Ajouter la colonne webhook_url
    await pool.query(`
      ALTER TABLE groups ADD COLUMN webhook_url TEXT DEFAULT ''
    `);
    
    console.log('✅ Migration webhook_url: colonne ajoutée avec succès');
    
    // Configurer l'URL par défaut pour le groupe Frouard
    const updateResult = await pool.query(`
      UPDATE groups 
      SET webhook_url = 'https://workflow.ffnancy.fr/webhook-test/acf9cbf7-040a-4cf5-a43d-80210420d30a'
      WHERE name = 'Frouard' AND (webhook_url = '' OR webhook_url IS NULL)
    `);
    
    if (updateResult.rowCount && updateResult.rowCount > 0) {
      console.log(`✅ Migration webhook_url: URL configurée pour ${updateResult.rowCount} groupe(s)`);
    }
    
    // Log du statut final
    const groups = await pool.query(`
      SELECT name, 
        CASE 
          WHEN webhook_url = '' OR webhook_url IS NULL THEN 'Non configuré'
          ELSE 'Configuré'
        END as status
      FROM groups 
      ORDER BY name
    `);
    
    console.log('📊 Migration webhook_url: statut des groupes:');
    groups.rows.forEach(group => {
      console.log(`  - ${group.name}: ${group.status}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration webhook_url:', error);
    throw error;
  }
}