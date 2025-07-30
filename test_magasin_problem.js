#!/usr/bin/env node

// Test pour démontrer le problème de sélection de magasin
console.log('🧪 DÉMO DU PROBLÈME SÉLECTION MAGASIN');

console.log('\n❌ PROBLÈME IDENTIFIÉ:');
console.log('Dans votre capture d\'écran, vous regardez le magasin "Frouard"');
console.log('Mais la facture F5162713 n\'existe QUE dans la table Houdemont !');

console.log('\n📊 MAPPING DES DONNÉES:');
console.log('• Magasin "Frouard" (ID: 1) → table NocoDB: mrr733dfb8wtt9b (CommandeF)');
console.log('• Magasin "Houdemont" (ID: 2,5) → table NocoDB: my7zunxprumahmm (CommandeH)');

console.log('\n🎯 SOLUTION:');
console.log('1. Cliquez sur le sélecteur de magasin en haut à droite');
console.log('2. Sélectionnez "Houdemont" au lieu de "Frouard"'); 
console.log('3. La facture F5162713 avec fournisseur "JJA Five" devrait avoir une coche verte');

console.log('\n✅ TEST ALTERNATIF:');
console.log('Ou restez sur "Frouard" et cherchez la facture "25025575" avec "Lidis"');
console.log('Cette combinaison fonctionne car elle existe dans la table Frouard');

console.log('\n🔍 LOGIQUE DE VÉRIFICATION (RAPPEL):');
console.log('1. Le système cherche le numéro de facture dans la table NocoDB du magasin');
console.log('2. Puis il vérifie que le nom du fournisseur correspond exactement');
console.log('3. Les DEUX critères doivent être OK pour avoir la coche verte');

console.log('\n⚠️ C\'EST EXACTEMENT CE QUI SE PASSE:');
console.log('Vous regardez Frouard → cherche dans table mrr733dfb8wtt9b');
console.log('Facture F5162713 n\'existe pas dans cette table');
console.log('Donc résultat: PAS DE COCHE VERTE (normal!)');