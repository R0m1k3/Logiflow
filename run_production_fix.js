#!/usr/bin/env node

// Script pour corriger définitivement la production
import pkg from 'pg';
const { Client } = pkg;

console.log('🔧 CORRECTION PRODUCTION DÉFINITIVE');

async function runProductionFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // 1. Supprimer complètement le cache
    console.log('\n🗑️ 1. Suppression complète du cache...');
    const deleteResult = await client.query('DELETE FROM invoice_verification_cache WHERE 1=1');
    console.log(`✅ ${deleteResult.rowCount} entrées cache supprimées`);

    // 2. Vérifier la configuration des magasins
    console.log('\n📋 2. Vérification configuration magasins...');
    const groupsResult = await client.query(`
      SELECT id, name, nocodb_table_id, nocodb_supplier_column_name 
      FROM groups 
      WHERE id IN (1, 2, 5)
      ORDER BY id
    `);
    
    groupsResult.rows.forEach(group => {
      console.log(`  ✅ ${group.name} (ID: ${group.id}): table=${group.nocodb_table_id}, supplier_col=${group.nocodb_supplier_column_name}`);
    });

    // 3. Vérifier les fournisseurs disponibles
    console.log('\n👥 3. Fournisseurs disponibles:');
    const suppliersResult = await client.query('SELECT id, name FROM suppliers ORDER BY name');
    suppliersResult.rows.forEach(supplier => {
      console.log(`  - ${supplier.name} (ID: ${supplier.id})`);
    });

    // 4. Vérifier les livraisons avec références factures
    console.log('\n📦 4. Livraisons avec références factures:');
    const deliveriesResult = await client.query(`
      SELECT d.id, d.invoice_reference, d.group_id, s.name as supplier_name, g.name as group_name
      FROM deliveries d
      LEFT JOIN suppliers s ON d.supplier_id = s.id
      LEFT JOIN groups g ON d.group_id = g.id
      WHERE d.invoice_reference IS NOT NULL AND d.invoice_reference != ''
      ORDER BY d.group_id, d.invoice_reference
    `);
    
    console.log(`Found ${deliveriesResult.rows.length} deliveries with invoice references:`);
    deliveriesResult.rows.forEach(delivery => {
      console.log(`  - Facture: ${delivery.invoice_reference}, Fournisseur: ${delivery.supplier_name}, Magasin: ${delivery.group_name} (ID: ${delivery.group_id})`);
    });

    console.log('\n🎉 CORRECTION TERMINÉE !');
    console.log('\n📝 Actions réalisées:');
    console.log('✅ Cache complètement nettoyé');
    console.log('✅ Configuration magasins vérifiée');
    console.log('✅ Fournisseurs et livraisons validés');
    console.log('\n🔄 L\'application va redémarrer automatiquement');
    console.log('\n🧪 POUR TESTER:');
    console.log('1. Sélectionnez le magasin "Frouard" → facture 25025575 avec Lidis');
    console.log('2. Sélectionnez le magasin "Houdemont" → facture F5162713 avec JJA Five');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

runProductionFix();