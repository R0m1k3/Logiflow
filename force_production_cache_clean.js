#!/usr/bin/env node

// Script de nettoyage COMPLET du cache avec vérification post-nettoyage
import { Client } from 'pg';

console.log('🧹 NETTOYAGE COMPLET CACHE PRODUCTION + VÉRIFICATION');

async function forceCleanProductionCache() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connexion base de données réussie');

    // 1. Nettoyage COMPLET
    console.log('\n🗑️ SUPPRESSION COMPLÈTE DU CACHE...');
    const deleteResult = await client.query('DELETE FROM invoice_verification_cache');
    console.log(`📊 ${deleteResult.rowCount} entrées supprimées`);

    // 2. Reset séquence
    await client.query('ALTER SEQUENCE invoice_verification_cache_id_seq RESTART WITH 1');
    console.log('🔄 Séquence remise à zéro');

    // 3. Vérification vide
    const countResult = await client.query('SELECT COUNT(*) as count FROM invoice_verification_cache');
    console.log(`📊 Vérification post-nettoyage: ${countResult.rows[0].count} entrées restantes`);

    // 4. Test création cache F5162713
    console.log('\n🧪 TEST CRÉATION CACHE POUR F5162713...');
    const testInsert = await client.query(`
      INSERT INTO invoice_verification_cache 
      (cache_key, group_id, invoice_reference, delivery_id, result_data, expires_at, created_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [
      'test_F5162713_5',
      5,
      'F5162713', 
      999,
      JSON.stringify({exists: true, matchType: 'INVOICE_REF', supplier: 'JJA Five'}),
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    ]);
    
    console.log('✅ Cache test créé:', {
      id: testInsert.rows[0].id,
      cache_key: testInsert.rows[0].cache_key,
      invoice_reference: testInsert.rows[0].invoice_reference
    });

    // 5. Suppression du test
    await client.query('DELETE FROM invoice_verification_cache WHERE id = $1', [testInsert.rows[0].id]);
    console.log('🗑️ Cache test supprimé');

    console.log('\n🎯 RÉSUMÉ:');
    console.log('✅ Cache complètement vidé et opérationnel');
    console.log('✅ Séquence reset à 1');  
    console.log('✅ Test insertion/suppression OK');
    console.log('✅ Système prêt pour nouvelles vérifications');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('📡 Connexion fermée');
  }
}

forceCleanProductionCache();