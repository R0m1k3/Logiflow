import type { Express } from "express";

// Système de vérification simplifié et ultra-robuste
export function setupSimpleVerify(app: Express, isAuthenticated: any, storage: any) {
  
  // Route ultra-simple pour vérifier les factures
  app.post('/api/verify-invoices', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔍 SIMPLE VERIFY - Request received:', req.body);
      
      const { invoices, invoiceReferences } = req.body;
      const invoicesToVerify = invoices || invoiceReferences || [];
      
      if (!Array.isArray(invoicesToVerify) || invoicesToVerify.length === 0) {
        return res.json({});
      }

      const results: any = {};
      
      // Vérifier chaque facture une par une
      for (const invoice of invoicesToVerify) {
        try {
          const invoiceRef = typeof invoice === 'string' ? invoice : invoice.invoiceReference;
          const groupId = typeof invoice === 'object' ? invoice.groupId : null;
          const deliveryId = typeof invoice === 'object' ? invoice.deliveryId : null;
          const supplierName = typeof invoice === 'object' ? invoice.supplierName : null;

          console.log(`🔍 Vérifying invoice: ${invoiceRef} for group ${groupId}`);

          if (!invoiceRef) {
            console.log(`❌ No invoice reference provided`);
            continue;
          }

          // Récupérer la configuration NocoDB pour le groupe
          let group = null;
          if (groupId) {
            try {
              group = await storage.getGroup(groupId);
              console.log(`📋 Group config:`, group ? {
                id: group.id,
                name: group.name,
                hasNocodbConfig: !!group.nocodbConfigId,
                tableId: group.nocodbTableId,
                tableName: group.nocodbTableName
              } : 'NOT FOUND');
            } catch (error) {
              console.log(`❌ Error getting group ${groupId}:`, (error as Error).message);
            }
          }

          // Si pas de configuration NocoDB, marquer comme non trouvé
          if (!group || !group.nocodbTableId) {
            results[deliveryId || invoiceRef] = {
              exists: false,
              error: 'Pas de configuration NocoDB pour ce magasin',
              cached: false,
              matchType: 'CONFIG_ERROR'
            };
            continue;
          }

          // Appel direct à NocoDB avec AbortController pour timeout
          const nocodbUrl = `https://nocodb.ffnancy.fr/api/v1/db/data/noco/pcg4uw79ukvycxc/${group.nocodbTableId}`;
          
          console.log(`🌐 Calling NocoDB: ${nocodbUrl}`);
          console.log(`🔍 Searching for: ${invoiceRef}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(`${nocodbUrl}?where=(RefFacture,eq,${encodeURIComponent(invoiceRef)})`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'xc-token': 'raNDjQ_0OKEQeNWsqDwSu5jGBhIgjMfO7RFFHYID'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.log(`❌ NocoDB API error: ${response.status} ${response.statusText}`);
            results[deliveryId || invoiceRef] = {
              exists: false,
              error: `Erreur API NocoDB: ${response.status}`,
              cached: false,
              matchType: 'API_ERROR'
            };
            continue;
          }

          const data = await response.json();
          console.log(`📊 NocoDB response for ${invoiceRef}:`, {
            found: data.list?.length || 0,
            firstResult: data.list?.[0] ? {
              RefFacture: data.list[0].RefFacture,
              Fournisseurs: data.list[0].Fournisseurs
            } : null
          });

          const found = data.list && data.list.length > 0;
          let matchType = 'NOT_FOUND';

          if (found) {
            const foundInvoice = data.list[0];
            
            // Vérifier le fournisseur si fourni
            if (supplierName && foundInvoice.Fournisseurs) {
              const supplierMatch = foundInvoice.Fournisseurs.toLowerCase().includes(supplierName.toLowerCase()) ||
                                   supplierName.toLowerCase().includes(foundInvoice.Fournisseurs.toLowerCase());
              
              if (supplierMatch) {
                matchType = 'INVOICE_AND_SUPPLIER';
              } else {
                matchType = 'INVOICE_ONLY';
                console.log(`⚠️ Supplier mismatch: expected "${supplierName}", found "${foundInvoice.Fournisseurs}"`);
              }
            } else {
              matchType = 'INVOICE_REF';
            }
          }

          results[deliveryId || invoiceRef] = {
            exists: found,
            cached: false,
            matchType: matchType,
            supplier: found ? data.list[0].Fournisseurs : null,
            foundData: found ? data.list[0] : null
          };

        } catch (error) {
          console.error(`❌ Error verifying invoice:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results[deliveryId || invoiceRef] = {
            exists: false,
            error: `Erreur de vérification: ${errorMessage}`,
            cached: false,
            matchType: 'SYSTEM_ERROR'
          };
        }
      }

      console.log('✅ SIMPLE VERIFY - Final results:', results);
      res.json(results);

    } catch (error) {
      console.error('❌ SIMPLE VERIFY - Global error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: "Erreur lors de la vérification des factures",
        error: errorMessage 
      });
    }
  });
}