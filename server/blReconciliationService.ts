// Service de rapprochement automatique par numéro de BL
// Import dynamique du storage selon l'environnement
let storage: any;

export interface BLReconciliationResult {
  processedDeliveries: number;
  reconciledDeliveries: number;
  errors: string[];
  details: Array<{
    deliveryId: number;
    blNumber: string;
    status: 'reconciled' | 'not_found' | 'error' | 'already_used';
    invoiceRef?: string;
    amount?: string;
  }>;
}

export interface NocoDBInvoiceData {
  invoiceRef: string;
  amount: string;
  supplier: string;
}

// Fonction pour vérifier si une facture est déjà utilisée par une autre livraison
async function isInvoiceAlreadyUsed(invoiceReference: string, excludeDeliveryId?: number): Promise<boolean> {
  try {
    // Initialiser le storage si nécessaire
    if (!storage) {
      const storageMode = process.env.STORAGE_MODE || (process.env.DATABASE_URL ? 'production' : 'development');
      if (storageMode === 'production') {
        const { storage: prodStorage } = await import('./storage.production.js');
        storage = prodStorage;
      } else {
        const { storage: devStorage } = await import('./storage.js');
        storage = devStorage;
      }
    }

    const deliveries = await storage.getDeliveries();
    const alreadyUsed = deliveries.some(delivery => 
      delivery.invoiceReference === invoiceReference && 
      delivery.reconciled === true &&
      delivery.id !== excludeDeliveryId
    );
    
    if (alreadyUsed) {
      console.log(`⚠️ [BL-RECONCILIATION] Facture ${invoiceReference} déjà utilisée par une autre livraison`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`💥 [BL-RECONCILIATION] Erreur lors de la vérification de la facture ${invoiceReference}:`, error);
    return false;
  }
}

export async function performBLReconciliation(): Promise<BLReconciliationResult> {
  const result: BLReconciliationResult = {
    processedDeliveries: 0,
    reconciledDeliveries: 0,
    errors: [],
    details: []
  };

  try {
    // Initialiser le storage selon l'environnement
    if (!storage) {
      const storageMode = process.env.STORAGE_MODE || (process.env.DATABASE_URL ? 'production' : 'development');
      console.log(`🔍 [BL-RECONCILIATION] Initializing storage mode: ${storageMode}`);
      
      if (storageMode === 'production') {
        const { storage: prodStorage } = await import('./storage.production.js');
        storage = prodStorage;
      } else {
        const { storage: devStorage } = await import('./storage.js');
        storage = devStorage;
      }
    }

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
        // 3. Rechercher d'abord dans NocoDB par numéro de BL
        let invoiceData = await searchInvoiceByBLNumber(
          delivery.groupId,
          delivery.blNumber!,
          delivery.supplier?.name
        );

        // 4. Si pas trouvé par BL, essayer par fournisseur et montant
        if (!invoiceData && delivery.blAmount) {
          console.log(`🔄 [BL-RECONCILIATION] BL ${delivery.blNumber} non trouvé, recherche par fournisseur + montant...`);
          invoiceData = await searchInvoiceBySupplierAndAmount(
            delivery.groupId,
            delivery.supplier?.name,
            delivery.blAmount
          );
        }

        // 5. Si pas trouvé par montant, essayer par fournisseur et date
        if (!invoiceData) {
          console.log(`🔄 [BL-RECONCILIATION] Recherche par fournisseur + date pour livraison ${delivery.id}...`);
          const scheduledDate = delivery.scheduledDate ? new Date(delivery.scheduledDate) : undefined;
          invoiceData = await searchInvoiceBySupplierAndDate(
            delivery.groupId,
            delivery.supplier?.name,
            scheduledDate
          );
        }

        if (invoiceData) {
          // 6. Vérifier si la facture trouvée n'est pas déjà utilisée par une autre livraison
          const isAlreadyUsed = await isInvoiceAlreadyUsed(invoiceData.invoiceRef, delivery.id);
          
          if (isAlreadyUsed) {
            result.details.push({
              deliveryId: delivery.id,
              blNumber: delivery.blNumber!,
              status: 'already_used',
              invoiceRef: invoiceData.invoiceRef
            });

            console.log(`⚠️ [BL-RECONCILIATION] Livraison ${delivery.id}: Facture ${invoiceData.invoiceRef} déjà validée, ignorée`);
          } else {
            // 7. Mettre à jour la livraison avec les données de facture
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
          }
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
    
    // Appel à l'API NocoDB avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes de timeout
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xc-token": nocodbConfig.apiToken,
        "Content-Type": "application/json",
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`💥 [BL-RECONCILIATION] Erreur API NocoDB: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Rechercher la ligne correspondant au numéro de BL
    const normalizedBLNumber = blNumber.trim().toLowerCase();
    
    // Le fournisseur est OBLIGATOIRE pour la sécurité du rapprochement
    if (!supplierName) {
      console.log(`❌ [BL-RECONCILIATION] Fournisseur manquant pour BL ${blNumber}, rapprochement refusé`);
      return null;
    }

    const normalizedSupplier = supplierName.trim().toLowerCase();

    const matchingRow = data.list?.find((row: any) => {
      const rowBLNumber = row[blColumnName]?.toString().trim().toLowerCase();
      const rowSupplier = row[supplierColumnName]?.toString().trim().toLowerCase();
      
      // Vérifier le numéro de BL ET le fournisseur (obligatoire)
      const blMatches = rowBLNumber === normalizedBLNumber;
      const supplierMatches = rowSupplier && rowSupplier.includes(normalizedSupplier);
      
      return blMatches && supplierMatches;
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
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ [BL-RECONCILIATION] Timeout de connexion lors de la recherche NocoDB pour BL ${blNumber}`);
        return null;
      }
      if (error.message.includes('Connection terminated due to connection timeout')) {
        console.error(`🔌 [BL-RECONCILIATION] Connexion terminée pour BL ${blNumber}: ${error.message}`);
        return null;
      }
    }
    console.error(`💥 [BL-RECONCILIATION] Erreur recherche NocoDB:`, error);
    return null;
  }
}

// Fonction de recherche alternative par fournisseur et montant
async function searchInvoiceBySupplierAndAmount(
  groupId: number,
  supplierName?: string,
  amount?: string
): Promise<NocoDBInvoiceData | null> {
  if (!supplierName || !amount) {
    return null;
  }

  try {
    const group = await storage.getGroup(groupId);
    if (!group || !group.nocodbConfigId || !group.nocodbTableId) {
      return null;
    }

    const nocodbConfig = await storage.getNocodbConfig(group.nocodbConfigId);
    if (!nocodbConfig) {
      return null;
    }

    const amountColumnName = group.nocodbAmountColumnName || "Montant HT";
    const supplierColumnName = group.nocodbSupplierColumnName || "Fournisseur";
    const invoiceColumnName = group.invoiceColumnName || "Ref Facture";
    
    const url = `${nocodbConfig.baseUrl}/api/v1/db/data/noco/${nocodbConfig.projectId}/${group.nocodbTableId}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes de timeout
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xc-token": nocodbConfig.apiToken,
        "Content-Type": "application/json",
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    const normalizedSupplier = supplierName.trim().toLowerCase();
    const normalizedAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    
    const matchingRow = data.list?.find((row: any) => {
      const rowSupplier = row[supplierColumnName]?.toString().trim().toLowerCase();
      const rowAmount = parseFloat(row[amountColumnName]?.toString().replace(/[^\d.-]/g, '') || '0');
      
      const supplierMatches = rowSupplier && rowSupplier.includes(normalizedSupplier);
      const amountMatches = Math.abs(rowAmount - normalizedAmount) < 0.01;
      
      return supplierMatches && amountMatches;
    });

    if (matchingRow) {
      const invoiceData: NocoDBInvoiceData = {
        invoiceRef: matchingRow[invoiceColumnName]?.toString() || '',
        amount: matchingRow[amountColumnName]?.toString() || '',
        supplier: matchingRow[supplierColumnName]?.toString() || ''
      };

      console.log(`✅ [BL-RECONCILIATION] Trouvé par fournisseur+montant:`, invoiceData);
      return invoiceData;
    }
    
    return null;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ [BL-RECONCILIATION] Timeout de connexion lors de la recherche par fournisseur+montant`);
        return null;
      }
      if (error.message.includes('Connection terminated due to connection timeout')) {
        console.error(`🔌 [BL-RECONCILIATION] Connexion terminée lors de recherche par fournisseur+montant: ${error.message}`);
        return null;
      }
    }
    console.error(`💥 [BL-RECONCILIATION] Erreur recherche par fournisseur+montant:`, error);
    return null;
  }
}

// Fonction de recherche alternative par fournisseur et date (approximative)
async function searchInvoiceBySupplierAndDate(
  groupId: number,
  supplierName?: string,
  deliveryDate?: Date
): Promise<NocoDBInvoiceData | null> {
  if (!supplierName || !deliveryDate) {
    return null;
  }

  try {
    const group = await storage.getGroup(groupId);
    if (!group || !group.nocodbConfigId || !group.nocodbTableId) {
      return null;
    }

    const nocodbConfig = await storage.getNocodbConfig(group.nocodbConfigId);
    if (!nocodbConfig) {
      return null;
    }

    const supplierColumnName = group.nocodbSupplierColumnName || "Fournisseur";
    const invoiceColumnName = group.invoiceColumnName || "Ref Facture";
    const amountColumnName = group.nocodbAmountColumnName || "Montant HT";
    
    const url = `${nocodbConfig.baseUrl}/api/v1/db/data/noco/${nocodbConfig.projectId}/${group.nocodbTableId}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes de timeout
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xc-token": nocodbConfig.apiToken,
        "Content-Type": "application/json",
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    const normalizedSupplier = supplierName.trim().toLowerCase();
    
    // Chercher par fournisseur et prendre la facture la plus récente non encore rapprochée
    const candidateRows = data.list?.filter((row: any) => {
      const rowSupplier = row[supplierColumnName]?.toString().trim().toLowerCase();
      return rowSupplier && rowSupplier.includes(normalizedSupplier);
    });

    if (candidateRows && candidateRows.length > 0) {
      // Prendre la première facture correspondante du fournisseur
      const matchingRow = candidateRows[0];
      
      const invoiceData: NocoDBInvoiceData = {
        invoiceRef: matchingRow[invoiceColumnName]?.toString() || '',
        amount: matchingRow[amountColumnName]?.toString() || '',
        supplier: matchingRow[supplierColumnName]?.toString() || ''
      };

      console.log(`✅ [BL-RECONCILIATION] Trouvé par fournisseur+date:`, invoiceData);
      return invoiceData;
    }
    
    return null;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`⏱️ [BL-RECONCILIATION] Timeout de connexion lors de la recherche par fournisseur+date`);
        return null;
      }
      if (error.message.includes('Connection terminated due to connection timeout')) {
        console.error(`🔌 [BL-RECONCILIATION] Connexion terminée lors de recherche par fournisseur+date: ${error.message}`);
        return null;
      }
    }
    console.error(`💥 [BL-RECONCILIATION] Erreur recherche par fournisseur+date:`, error);
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