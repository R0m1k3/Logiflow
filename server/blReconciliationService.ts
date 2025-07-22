// Service de rapprochement automatique par numéro de BL
import { storage } from "./storage";

export interface BLReconciliationResult {
  processedDeliveries: number;
  reconciledDeliveries: number;
  errors: string[];
  details: Array<{
    deliveryId: number;
    blNumber: string;
    status: 'reconciled' | 'not_found' | 'error';
    invoiceRef?: string;
    amount?: string;
  }>;
}

export interface NocoDBInvoiceData {
  invoiceRef: string;
  amount: string;
  supplier: string;
}

export async function performBLReconciliation(): Promise<BLReconciliationResult> {
  const result: BLReconciliationResult = {
    processedDeliveries: 0,
    reconciledDeliveries: 0,
    errors: [],
    details: []
  };

  try {
    console.log("🔄 [BL-RECONCILIATION] Début du rapprochement automatique par N° BL");
    
    // 1. Récupérer toutes les livraisons validées sans référence facture
    const deliveries = await storage.getDeliveries();
    const unReconciledDeliveries = deliveries.filter(delivery => 
      delivery.status === 'delivered' && 
      delivery.blNumber && 
      !delivery.invoiceReference
    );

    console.log(`🔍 [BL-RECONCILIATION] ${unReconciledDeliveries.length} livraisons non rapprochées trouvées`);
    
    if (unReconciledDeliveries.length === 0) {
      console.log("✅ [BL-RECONCILIATION] Aucune livraison à rapprocher");
      return result;
    }

    // 2. Traiter chaque livraison
    for (const delivery of unReconciledDeliveries) {
      result.processedDeliveries++;
      
      try {
        // 3. Rechercher dans NocoDB par numéro de BL
        const invoiceData = await searchInvoiceByBLNumber(
          delivery.groupId,
          delivery.blNumber!,
          delivery.supplier?.name
        );

        if (invoiceData) {
          // 4. Mettre à jour la livraison avec les données de facture
          await storage.updateDelivery(delivery.id, {
            invoiceReference: invoiceData.invoiceRef,
            invoiceAmount: invoiceData.amount,
            reconciled: true
          });

          result.reconciledDeliveries++;
          result.details.push({
            deliveryId: delivery.id,
            blNumber: delivery.blNumber!,
            status: 'reconciled',
            invoiceRef: invoiceData.invoiceRef,
            amount: invoiceData.amount
          });

          console.log(`✅ [BL-RECONCILIATION] Livraison ${delivery.id} rapprochée: BL ${delivery.blNumber} -> ${invoiceData.invoiceRef} (${invoiceData.amount}€)`);
        } else {
          result.details.push({
            deliveryId: delivery.id,
            blNumber: delivery.blNumber!,
            status: 'not_found'
          });

          console.log(`❌ [BL-RECONCILIATION] Livraison ${delivery.id}: Aucune facture trouvée pour BL ${delivery.blNumber}`);
        }
      } catch (error) {
        const errorMessage = `Erreur lors du traitement de la livraison ${delivery.id}: ${error}`;
        result.errors.push(errorMessage);
        result.details.push({
          deliveryId: delivery.id,
          blNumber: delivery.blNumber!,
          status: 'error'
        });
        console.error(`💥 [BL-RECONCILIATION] ${errorMessage}`);
      }
    }

    console.log(`🎯 [BL-RECONCILIATION] Terminé: ${result.reconciledDeliveries}/${result.processedDeliveries} livraisons rapprochées`);
    
  } catch (error) {
    const errorMessage = `Erreur globale du rapprochement BL: ${error}`;
    result.errors.push(errorMessage);
    console.error(`💥 [BL-RECONCILIATION] ${errorMessage}`);
  }

  return result;
}

async function searchInvoiceByBLNumber(
  groupId: number, 
  blNumber: string,
  supplierName?: string
): Promise<NocoDBInvoiceData | null> {
  try {
    // Récupérer la configuration NocoDB du groupe
    const group = await storage.getGroup(groupId);
    
    if (!group || !group.nocodbConfigId || !group.nocodbTableId) {
      console.log(`⚠️ [BL-RECONCILIATION] Groupe ${groupId}: Pas de configuration NocoDB`);
      return null;
    }

    // Récupérer la configuration NocoDB
    const nocodbConfig = await storage.getNocodbConfig(group.nocodbConfigId);
    
    if (!nocodbConfig) {
      console.log(`⚠️ [BL-RECONCILIATION] Configuration NocoDB ${group.nocodbConfigId} introuvable`);
      return null;
    }

    // Noms des colonnes configurés dans le groupe
    const blColumnName = group.nocodbBlColumnName || "Numéro de BL";
    const amountColumnName = group.nocodbAmountColumnName || "Montant HT";
    const supplierColumnName = group.nocodbSupplierColumnName || "Fournisseur";
    const invoiceColumnName = group.invoiceColumnName || "Ref Facture";
    
    // Construire l'URL de l'API NocoDB
    const url = `${nocodbConfig.baseUrl}/api/v1/db/data/noco/${nocodbConfig.projectId}/${group.nocodbTableId}`;
    
    console.log(`🔍 [BL-RECONCILIATION] Recherche NocoDB pour BL ${blNumber}:`, {
      url,
      blColumnName,
      groupId,
      supplier: supplierName
    });
    
    // Appel à l'API NocoDB
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xc-token": nocodbConfig.apiToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`💥 [BL-RECONCILIATION] Erreur API NocoDB: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Rechercher la ligne correspondant au numéro de BL
    const normalizedBLNumber = blNumber.trim().toLowerCase();
    
    const matchingRow = data.list?.find((row: any) => {
      const rowBLNumber = row[blColumnName]?.toString().trim().toLowerCase();
      const rowSupplier = row[supplierColumnName]?.toString().trim().toLowerCase();
      
      // Vérifier d'abord le numéro de BL
      const blMatches = rowBLNumber === normalizedBLNumber;
      
      // Si un fournisseur est spécifié, vérifier également la correspondance
      if (supplierName && rowSupplier) {
        const normalizedSupplier = supplierName.trim().toLowerCase();
        return blMatches && rowSupplier.includes(normalizedSupplier);
      }
      
      return blMatches;
    });

    if (matchingRow) {
      const invoiceData: NocoDBInvoiceData = {
        invoiceRef: matchingRow[invoiceColumnName]?.toString() || '',
        amount: matchingRow[amountColumnName]?.toString() || '',
        supplier: matchingRow[supplierColumnName]?.toString() || ''
      };

      console.log(`✅ [BL-RECONCILIATION] Trouvé dans NocoDB:`, invoiceData);
      return invoiceData;
    } else {
      console.log(`❌ [BL-RECONCILIATION] BL ${blNumber} non trouvé dans NocoDB`);
      return null;
    }
    
  } catch (error) {
    console.error(`💥 [BL-RECONCILIATION] Erreur recherche NocoDB:`, error);
    return null;
  }
}

// Fonction pour démarrer le rapprochement automatique
export async function startBLReconciliationScheduler() {
  const cron = await import('node-cron');
  
  // Programmer l'exécution toutes les 20 minutes
  cron.schedule('*/20 * * * *', async () => {
    console.log("⏰ [BL-RECONCILIATION] Démarrage du rapprochement automatique programmé");
    
    try {
      const result = await performBLReconciliation();
      
      if (result.reconciledDeliveries > 0) {
        console.log(`🎉 [BL-RECONCILIATION] ${result.reconciledDeliveries} nouvelles livraisons rapprochées automatiquement`);
      }
      
      if (result.errors.length > 0) {
        console.error(`⚠️ [BL-RECONCILIATION] ${result.errors.length} erreurs lors du rapprochement automatique`);
      }
    } catch (error) {
      console.error("💥 [BL-RECONCILIATION] Erreur lors du rapprochement automatique:", error);
    }
  });
  
  console.log("⏰ [BL-RECONCILIATION] Scheduler configuré: rapprochement automatique toutes les 20 minutes");
}