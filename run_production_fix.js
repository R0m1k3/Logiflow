#!/usr/bin/env node
/**
 * 🚨 CORRECTION URGENTE PRODUCTION NOCODB
 * 
 * Script pour corriger la configuration NocoDB Houdemont en production
 * et nettoyer le cache de vérification des factures
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
console.log('🔗 Connexion à la base de données...');

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runProductionFix() {
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // 1. Vérifier la configuration actuelle des groupes
    console.log('\n🔍 1. Vérification configuration actuelle...');
    const currentGroups = await client.query(`
      SELECT id, name, nocodb_config_id, nocodb_table_id, invoice_column_name 
      FROM groups 
      WHERE name IN ('Frouard', 'Houdemont')
      ORDER BY name
    `);
    
    console.log('📋 Groupes actuels:');
    currentGroups.rows.forEach(row => {
      console.log(`  - ${row.name} (ID: ${row.id}): config=${row.nocodb_config_id}, table=${row.nocodb_table_id}`);
    });

    // 2. Mettre à jour Houdemont
    console.log('\n🔧 2. Mise à jour configuration Houdemont...');
    const updateResult = await client.query(`
      UPDATE groups SET 
        nocodb_config_id = 1, 
        nocodb_table_id = 'my7zunxprumahmm', 
        invoice_column_name = 'RefFacture',
        nocodb_supplier_column_name = 'Fournisseurs'
      WHERE name = 'Houdemont'
      RETURNING id, name, nocodb_table_id
    `);
    
    if (updateResult.rowCount > 0) {
      console.log(`✅ Configuration Houdemont mise à jour: table=${updateResult.rows[0].nocodb_table_id}`);
    } else {
      console.log('⚠️ Aucune ligne mise à jour pour Houdemont');
    }

    // 3. Nettoyer TOUT le cache de vérification
    console.log('\n🗑️ 3. Nettoyage complet du cache...');
    const deleteResult = await client.query('DELETE FROM invoice_verification_cache');
    console.log(`✅ Cache nettoyé (${deleteResult.rowCount} entrées supprimées)`);

    // 4. Vérification finale
    console.log('\n✅ 4. Vérification finale...');
    const finalCheck = await client.query(`
      SELECT 
        g.id, 
        g.name, 
        g.nocodb_config_id, 
        g.nocodb_table_id, 
        g.invoice_column_name,
        g.nocodb_supplier_column_name,
        n.base_url,
        n.project_id
      FROM groups g 
      LEFT JOIN nocodb_config n ON g.nocodb_config_id = n.id 
      WHERE g.name IN ('Frouard', 'Houdemont')
      ORDER BY g.name
    `);

    console.log('📋 Configuration finale:');
    finalCheck.rows.forEach(row => {
      console.log(`\n  🏪 ${row.name}:`);
      console.log(`    • Table ID: ${row.nocodb_table_id}`);
      console.log(`    • Colonne facture: ${row.invoice_column_name}`);
      console.log(`    • Colonne fournisseur: ${row.nocodb_supplier_column_name}`);
      console.log(`    • Base URL: ${row.base_url}`);
    });

    console.log('\n🎉 CORRECTION TERMINÉE AVEC SUCCÈS !');
    console.log('\n📝 Étapes suivantes:');
    console.log('1. ✅ Configuration NocoDB Houdemont appliquée');
    console.log('2. ✅ Cache de vérification complètement nettoyé');
    console.log('3. 🔄 L\'application va redémarrer automatiquement');
    console.log('4. 🧪 Tester la facture F5162713 pour Houdemont');

  } catch (error) {
    console.error('❌ ERREUR lors de la correction:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runProductionFix().catch(error => {
  console.error('💥 ÉCHEC DE LA CORRECTION:', error);
  process.exit(1);
});