#!/usr/bin/env node

// Script de force brute pour nettoyer le cache production
import pkg from 'pg';
const { Client } = pkg;

console.log('🚨 NETTOYAGE CACHE PRODUCTION FORCE BRUTE');

async function forceCleanProductionCache() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données PRODUCTION');

    // 1. Vérifier les entrées cache actuelles
    console.log('\n🔍 1. État actuel du cache:');
    const currentCache = await client.query(`
      SELECT cache_key, exists, supplier_name, created_at 
      FROM invoice_verification_cache 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${currentCache.rows.length} entries in cache:`);
    currentCache.rows.forEach(row => {
      console.log(`  - ${row.cache_key}: ${row.exists ? 'EXISTS' : 'NOT FOUND'} (${row.supplier_name})`);
    });

    // 2. SUPPRIMER TOUT LE CACHE BRUTALEMENT
    console.log('\n🗑️ 2. SUPPRESSION BRUTALE DE TOUT LE CACHE...');
    await client.query('TRUNCATE TABLE invoice_verification_cache RESTART IDENTITY CASCADE');
    console.log('✅ Cache complètement vidé avec TRUNCATE');

    // 3. Vérifier que c'est vide
    const verifyEmpty = await client.query('SELECT COUNT(*) as count FROM invoice_verification_cache');
    console.log(`📊 Cache entries après nettoyage: ${verifyEmpty.rows[0].count}`);

    // 4. Redémarrer les séquences pour être sûr
    await client.query('ALTER SEQUENCE invoice_verification_cache_id_seq RESTART WITH 1');
    console.log('✅ Séquence ID remise à zéro');

    // 5. Vérifier la configuration magasins pour production
    console.log('\n📋 5. Configuration magasins PRODUCTION:');
    const groups = await client.query(`
      SELECT id, name, nocodb_table_id, nocodb_supplier_column_name 
      FROM groups 
      WHERE nocodb_table_id IS NOT NULL
      ORDER BY id
    `);
    
    groups.rows.forEach(group => {
      console.log(`  ✅ ${group.name} (ID: ${group.id}): table=${group.nocodb_table_id}`);
    });

    console.log('\n🎯 RÉSUMÉ CRITIQUE:');
    console.log('✅ Cache PRODUCTION complètement nettoyé');
    console.log('✅ Plus aucune entrée "NOT FOUND" en cache');
    console.log('✅ Prochaines vérifications feront de vrais appels NocoDB');
    console.log('\n⚠️ IMPORTANT: Facture F5162713 n\'existe QUE dans Houdemont !');
    console.log('   - Sélectionnez magasin "Houdemont" pour la voir');
    console.log('   - Sélectionnez magasin "Frouard" pour facture 25025575');

  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
  } finally {
    await client.end();
  }
}

forceCleanProductionCache();