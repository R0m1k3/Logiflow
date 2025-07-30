#!/usr/bin/env node

// Test complet des deux critères de vérification
import fetch from 'node-fetch';

console.log('🧪 TEST COMPLET DOUBLE CRITÈRE F5162713 + JJA Five');

async function testBothCriteria() {
  const baseUrl = 'https://nocodb.ffnancy.fr/api/v1/db/data/noco/pcg4uw79ukvycxc';
  const tableId = 'my7zunxprumahmm'; // Houdemont
  const token = 'z4BAwLo6dgoN_E7PKJSHN7PA7kdBePtKOYcsDlwQ';

  console.log('\n🔍 1. Test: Recherche par numéro de facture uniquement');
  try {
    const response1 = await fetch(`${baseUrl}/${tableId}?where=(RefFacture,eq,F5162713)`, {
      headers: {
        'xc-token': token,
        'Content-Type': 'application/json'
      }
    });
    const data1 = await response1.json();
    console.log(`✅ Facture F5162713 trouvée: ${data1.list?.length || 0} résultat(s)`);
    if (data1.list?.length > 0) {
      console.log(`   Fournisseur trouvé: "${data1.list[0].Fournisseurs}"`);
    }
  } catch (error) {
    console.error('❌ Erreur recherche facture:', error.message);
  }

  console.log('\n🔍 2. Test: Recherche par fournisseur uniquement');
  try {
    const response2 = await fetch(`${baseUrl}/${tableId}?where=(Fournisseurs,eq,JJA Five)`, {
      headers: {
        'xc-token': token,
        'Content-Type': 'application/json'
      }
    });
    const data2 = await response2.json();
    console.log(`✅ Fournisseur "JJA Five" trouvé: ${data2.list?.length || 0} résultat(s)`);
    if (data2.list?.length > 0) {
      data2.list.forEach((item, index) => {
        console.log(`   Facture ${index + 1}: "${item.RefFacture}"`);
      });
    }
  } catch (error) {
    console.error('❌ Erreur recherche fournisseur:', error.message);
  }

  console.log('\n🎯 3. Test: DOUBLE CRITÈRE (facture ET fournisseur)');
  try {
    const response3 = await fetch(`${baseUrl}/${tableId}?where=(RefFacture,eq,F5162713)&where=(Fournisseurs,eq,JJA Five)`, {
      headers: {
        'xc-token': token,
        'Content-Type': 'application/json'
      }
    });
    const data3 = await response3.json();
    console.log(`✅ Double critère F5162713 + JJA Five: ${data3.list?.length || 0} résultat(s)`);
    
    if (data3.list?.length > 0) {
      console.log('🎉 SUCCÈS ! Les deux critères correspondent !');
      console.log('   Facture:', data3.list[0].RefFacture);
      console.log('   Fournisseur:', data3.list[0].Fournisseurs);
      console.log('   Montant HT:', data3.list[0]['Montant HT']);
      console.log('   → COCHE VERTE ATTENDUE ✅');
    } else {
      console.log('❌ ÉCHEC ! Les critères ne correspondent pas');
      console.log('   → PAS DE COCHE VERTE (normal)');
    }
  } catch (error) {
    console.error('❌ Erreur double critère:', error.message);
  }

  console.log('\n📊 RÉSUMÉ:');
  console.log('Si vous voyez "SUCCÈS ! Les deux critères correspondent !", alors:');
  console.log('✅ Le système NocoDB fonctionne correctement');
  console.log('✅ La facture F5162713 existe avec fournisseur "JJA Five"');
  console.log('✅ Une coche verte DOIT s\'afficher sur Houdemont');
  console.log('\nSinon, le problème est dans la configuration ou les données NocoDB.');
}

testBothCriteria();