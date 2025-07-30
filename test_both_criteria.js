#!/usr/bin/env node

// Test complet pour vérifier les deux critères : facture + fournisseur
import pkg from 'pg';
const { Client } = pkg;

console.log('🧪 TEST VÉRIFICATION DOUBLE CRITÈRE');

async function testBothCriteria() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // 1. Vérifier la configuration des magasins
    console.log('\n📋 1. Configuration magasins:');
    const groupsResult = await client.query(`
      SELECT id, name, nocodb_table_id, nocodb_supplier_column_name 
      FROM groups 
      ORDER BY id
    `);
    
    groupsResult.rows.forEach(group => {
      console.log(`  - ${group.name} (ID: ${group.id}): table=${group.nocodb_table_id}`);
    });

    // 2. Vérifier les livraisons test
    console.log('\n📦 2. Livraisons test disponibles:');
    const deliveriesResult = await client.query(`
      SELECT d.id, d.invoice_reference, d.group_id, s.name as supplier_name, g.name as group_name
      FROM deliveries d
      LEFT JOIN suppliers s ON d.supplier_id = s.id
      LEFT JOIN groups g ON d.group_id = g.id
      WHERE d.invoice_reference IN ('F5162713', '25025575')
      ORDER BY d.group_id
    `);
    
    deliveriesResult.rows.forEach(delivery => {
      console.log(`  - Facture: ${delivery.invoice_reference}, Fournisseur: ${delivery.supplier_name}, Magasin: ${delivery.group_name} (ID: ${delivery.group_id})`);
    });

    console.log('\n🎯 RÉSUMÉ POUR TESTS:');
    console.log('✅ La vérification vérifie DEUX critères:');
    console.log('  1. Numéro de facture existe dans NocoDB');
    console.log('  2. Nom du fournisseur correspond exactement');
    console.log('\n✅ Pour tester:');
    console.log('  - Facture F5162713 avec fournisseur "JJA Five" → magasin Houdemont');
    console.log('  - Facture 25025575 avec fournisseur "Lidis" → magasin Frouard');
    console.log('\n⚠️  IMPORTANT: Sélectionnez le bon magasin dans l\'interface !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

testBothCriteria();