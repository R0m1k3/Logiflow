#!/usr/bin/env node

// Script pour forcer le nettoyage du cache en production ET développement
import pkg from 'pg';
const { Client } = pkg;

console.log('🗑️ NETTOYAGE FORCE DU CACHE - Toutes les entrées F5162713');

async function forceCacheClean() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // Nettoyer spécifiquement les entrées F5162713
    console.log('\n🧹 Suppression des entrées cache F5162713...');
    const deleteResult = await client.query(`
      DELETE FROM invoice_verification_cache 
      WHERE cache_key LIKE '%F5162713%' 
      OR invoice_reference = 'F5162713'
    `);
    
    console.log(`✅ ${deleteResult.rowCount} entrées supprimées du cache`);

    // Nettoyer tout le cache (pour être sûr)
    console.log('\n🧹 Nettoyage complet du cache...');
    const cleanAllResult = await client.query(`
      DELETE FROM invoice_verification_cache WHERE 1=1
    `);
    
    console.log(`✅ ${cleanAllResult.rowCount} entrées totales supprimées`);

    // Vérifier qu'il n'y a plus rien
    console.log('\n🔍 Vérification finale...');
    const countResult = await client.query(`
      SELECT COUNT(*) as count FROM invoice_verification_cache
    `);
    
    const totalCount = parseInt(countResult.rows[0].count);
    console.log(`📊 Entrées restantes dans le cache: ${totalCount}`);

    if (totalCount === 0) {
      console.log('\n🎉 CACHE COMPLÈTEMENT NETTOYÉ!');
      console.log('🔄 La prochaine vérification forcera un appel NocoDB direct');
    } else {
      console.log(`\n⚠️ ${totalCount} entrées restent dans le cache`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

forceCacheClean();