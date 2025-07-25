// Test de diagnostic pour la recherche Lidis
import axios from 'axios';

async function testLidisSearch() {
  console.log('🔍 Test de recherche Lidis dans NocoDB...');
  
  const baseUrl = 'https://nocodb.ffnancy.fr';
  const projectId = 'pcg4uw79ukvycxc';
  const tableId = 'mrr733dfb8wtt9b';
  const apiToken = 'z4BAwLo6dgoN_E7PKJSHN7PA7kdBePtKOYcsDlwQ';
  
  try {
    // Test 1: Recherche par référence facture exacte
    console.log('\n📋 Test 1: Recherche par RefFacture = 25025575');
    const searchUrl1 = `${baseUrl}/api/v1/db/data/noco/${projectId}/${tableId}`;
    const response1 = await axios.get(searchUrl1, {
      headers: {
        'xc-token': apiToken,
        'Content-Type': 'application/json'
      },
      params: {
        where: '(RefFacture,eq,25025575)'
      }
    });
    
    console.log('Résultats trouvés:', response1.data?.list?.length || 0);
    if (response1.data?.list?.length > 0) {
      const facture = response1.data.list[0];
      console.log('Facture trouvée:', {
        RefFacture: facture.RefFacture,
        Fournisseurs: facture.Fournisseurs,
        'Montant HT': facture['Montant HT'],
        Numero_BL: facture.Numero_BL
      });
      
      // Test de correspondance du nom fournisseur
      console.log('\n🔍 Test de correspondance fournisseur:');
      console.log('- Fournisseur dans NocoDB:', `"${facture.Fournisseurs}"`);
      console.log('- Recherché:', `"Lidis"`);
      console.log('- Correspondance exacte:', facture.Fournisseurs === 'Lidis');
      console.log('- Correspondance insensible à la casse:', facture.Fournisseurs.toLowerCase() === 'lidis');
      console.log('- Contient "Lidis":', facture.Fournisseurs.includes('Lidis'));
    }
    
    // Test 2: Recherche par fournisseur
    console.log('\n📋 Test 2: Recherche par Fournisseurs contenant Lidis');
    const response2 = await axios.get(searchUrl1, {
      headers: {
        'xc-token': apiToken,
        'Content-Type': 'application/json'
      },
      params: {
        where: '(Fournisseurs,like,%Lidis%)'
      }
    });
    
    console.log('Résultats trouvés:', response2.data?.list?.length || 0);
    response2.data?.list?.forEach((facture, index) => {
      console.log(`Facture ${index + 1}:`, {
        RefFacture: facture.RefFacture,
        Fournisseurs: facture.Fournisseurs,
        'Montant HT': facture['Montant HT']
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testLidisSearch();