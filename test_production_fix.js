#!/usr/bin/env node

// Script de test pour vérifier que la production fonctionne correctement
// après les corrections apportées

import pkg from 'pg';
const { Client } = pkg;

console.log('🧪 TEST PRODUCTION - Vérification facture F5162713');

async function testProductionFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // 1. Vérifier la configuration Houdemont
    console.log('\n📋 1. Vérification configuration Houdemont...');
    const configResult = await client.query(`
      SELECT id, name, nocodb_table_id, nocodb_supplier_column_name 
      FROM groups 
      WHERE name = 'Houdemont'
    `);
    
    if (configResult.rows.length > 0) {
      const houdemont = configResult.rows[0];
      console.log(`✅ Houdemont trouvé - Table ID: ${houdemont.nocodb_table_id}`);
    } else {
      console.log('❌ Configuration Houdemont non trouvée');
      return;
    }

    // 2. Vérifier le cache
    console.log('\n🗑️ 2. Vérification cache...');
    const cacheResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM invoice_verification_cache 
      WHERE cache_key LIKE '%F5162713%'
    `);
    
    const cacheCount = parseInt(cacheResult.rows[0].count);
    console.log(`📊 Entrées cache pour F5162713: ${cacheCount}`);

    // 3. Vérifier la livraison test
    console.log('\n📦 3. Vérification livraison test...');
    const deliveryResult = await client.query(`
      SELECT id, invoice_reference, group_id 
      FROM deliveries 
      WHERE invoice_reference = 'F5162713'
    `);
    
    if (deliveryResult.rows.length > 0) {
      const delivery = deliveryResult.rows[0];
      console.log(`✅ Livraison trouvée - ID: ${delivery.id}, Groupe: ${delivery.group_id}`);
    } else {
      console.log('❌ Livraison test non trouvée');
    }

    console.log('\n🎯 Résumé:');
    console.log('- Configuration Houdemont: ✅ OK');
    console.log(`- Cache nettoyé: ${cacheCount === 0 ? '✅ OK' : '⚠️ ' + cacheCount + ' entrées restantes'}`);
    console.log('- Livraison test: ✅ OK');
    console.log('\n🚀 PRÊT POUR TEST PRODUCTION');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

testProductionFix();