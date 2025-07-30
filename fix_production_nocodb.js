#!/usr/bin/env node
/**
 * 🔧 SCRIPT DE CORRECTION PRODUCTION NOCODB
 * 
 * Ce script applique la configuration NocoDB manquante pour Houdemont
 * et nettoie le cache de vérification des factures.
 * 
 * Usage: node fix_production_nocodb.js
 */

import { Client } from 'pg';

// Configuration de la base de données
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non définie');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixProductionNocoDB() {
  try {
    console.log('🔗 Connexion à la base de données...');
    await client.connect();

    // 1. Vérifier la configuration actuelle
    console.log('🔍 Vérification de la configuration actuelle...');
    const currentConfig = await client.query(`
      SELECT id, name, nocodb_config_id, nocodb_table_id, invoice_column_name 
      FROM groups 
      WHERE name IN ('Frouard', 'Houdemont')
    `);
    
    console.log('📋 Configuration actuelle:');
    currentConfig.rows.forEach(row => {
      console.log(`  - ${row.name}: nocodb_config_id=${row.nocodb_config_id}, table_id=${row.nocodb_table_id}`);
    });

    // 2. Mettre à jour Houdemont si nécessaire
    const houdemontConfig = currentConfig.rows.find(row => row.name === 'Houdemont');
    if (!houdemontConfig.nocodb_config_id) {
      console.log('🔧 Mise à jour de la configuration Houdemont...');
      await client.query(`
        UPDATE groups SET 
          nocodb_config_id = 1, 
          nocodb_table_id = 'my7zunxprumahmm', 
          invoice_column_name = 'RefFacture'
        WHERE name = 'Houdemont'
      `);
      console.log('✅ Configuration Houdemont mise à jour');
    } else {
      console.log('✅ Configuration Houdemont déjà en place');
    }

    // 3. Nettoyer le cache de vérification
    console.log('🗑️ Nettoyage du cache de vérification...');
    const deletedRows = await client.query('DELETE FROM invoice_verification_cache');
    console.log(`✅ Cache nettoyé (${deletedRows.rowCount} entrées supprimées)`);

    // 4. Vérification finale
    console.log('🔍 Vérification finale...');
    const finalConfig = await client.query(`
      SELECT 
        g.id, 
        g.name, 
        g.nocodb_config_id, 
        g.nocodb_table_id, 
        g.invoice_column_name,
        n.base_url,
        n.project_id
      FROM groups g 
      LEFT JOIN nocodb_config n ON g.nocodb_config_id = n.id 
      WHERE g.name IN ('Frouard', 'Houdemont')
    `);

    console.log('📋 Configuration finale:');
    finalConfig.rows.forEach(row => {
      console.log(`  - ${row.name}:`);
      console.log(`    • Table ID: ${row.nocodb_table_id}`);
      console.log(`    • Colonne: ${row.invoice_column_name}`);
      console.log(`    • URL: ${row.base_url}`);
    });

    console.log('🎉 Correction terminée avec succès !');
    console.log('');
    console.log('📝 Actions à effectuer:');
    console.log('1. Redémarrer l\'application en production');
    console.log('2. Tester la facture F5162713 pour Houdemont');
    console.log('3. Vérifier que la coche verte apparaît');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Exécution du script
fixProductionNocoDB().catch(console.error);