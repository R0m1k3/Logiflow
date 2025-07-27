// Script de test pour vérifier la sauvegarde webhook
// Usage: node test-webhook-save.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testWebhookSave() {
  try {
    console.log('🧪 Test de sauvegarde webhook en cours...');
    
    // Vérifier l'existence de la colonne
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'groups' AND column_name = 'webhook_url'
    `);
    
    const hasWebhookColumn = columnCheck.rows.length > 0;
    console.log(`🔍 Colonne webhook_url existe: ${hasWebhookColumn}`);
    
    if (!hasWebhookColumn) {
      console.log('⚠️  La colonne webhook_url n\'existe pas. Exécutez d\'abord run_migration.js');
      return;
    }
    
    // Tester la mise à jour
    const testUrl = 'https://test-webhook-' + Date.now() + '.example.com';
    
    const updateResult = await pool.query(`
      UPDATE groups 
      SET webhook_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE name = 'Frouard'
      RETURNING id, name, webhook_url
    `, [testUrl]);
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Test de sauvegarde réussi:');
      console.log('  ID:', updateResult.rows[0].id);
      console.log('  Nom:', updateResult.rows[0].name);
      console.log('  URL Webhook:', updateResult.rows[0].webhook_url);
    } else {
      console.log('❌ Aucun groupe Frouard trouvé pour le test');
    }
    
    // Vérifier que la valeur est bien sauvegardée
    const verifyResult = await pool.query(`
      SELECT webhook_url FROM groups WHERE name = 'Frouard'
    `);
    
    if (verifyResult.rows[0].webhook_url === testUrl) {
      console.log('✅ Vérification: La valeur est bien persistée en base');
    } else {
      console.log('❌ Vérification: Problème de persistance');
      console.log('  Attendu:', testUrl);
      console.log('  Trouvé:', verifyResult.rows[0].webhook_url);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testWebhookSave()
    .then(() => {
      console.log('🎯 Test terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec du test:', error);
      process.exit(1);
    });
}

module.exports = { testWebhookSave };