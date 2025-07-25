import axios from 'axios';
import { nocodbLogger } from './nocodbLogger.js';

export interface InvoiceVerificationResult {
  found: boolean;
  matchType?: 'INVOICE_REF' | 'BL_NUMBER' | 'SUPPLIER_AMOUNT' | 'SUPPLIER_DATE' | 'NONE';
  invoice?: any;
  verificationDetails: {
    invoiceRef?: string;
    blNumber?: string;
    supplierName?: string;
    amount?: number;
    searchUrl?: string;
    searchCriteria?: any;
    responseData?: any;
    error?: string;
  };
}

export interface NocoDBConfig {
  id: number;
  name: string;
  baseUrl: string;
  projectId: string;
  apiToken: string;
  isActive: boolean;
}

export interface GroupConfig {
  id: number;
  name: string;
  nocodbConfigId?: number;
  nocodbTableId?: string;
  nocodbTableName?: string;
  invoiceColumnName?: string;
  nocodbBlColumnName?: string;
  nocodbAmountColumnName?: string;
  nocodbSupplierColumnName?: string;
}

class InvoiceVerificationService {
  
  /**
   * Vérification principale d'une facture/BL
   */
  async verifyInvoice(
    invoiceRef: string,
    supplierName: string,
    amount: number,
    groupConfig: GroupConfig,
    nocodbConfig: NocoDBConfig,
    excludeDeliveryId?: number
  ): Promise<InvoiceVerificationResult> {
    const startTime = Date.now();
    
    nocodbLogger.info('VERIFY_INVOICE_START', {
      invoiceRef,
      supplierName,
      amount,
      groupId: groupConfig.id,
      excludeDeliveryId
    }, groupConfig.id, groupConfig.name);

    try {
      // Vérification des configurations
      if (!this.validateConfigs(groupConfig, nocodbConfig)) {
        throw new Error('Configuration NocoDB invalide');
      }

      // Étape 1: Recherche par référence facture
      let result = await this.searchByInvoiceRef(invoiceRef, supplierName, groupConfig, nocodbConfig);
      if (result.found) {
        nocodbLogger.info('VERIFY_INVOICE_SUCCESS', {
          matchType: 'INVOICE_REF',
          invoiceRef,
          invoice: result.invoice
        }, groupConfig.id, groupConfig.name, Date.now() - startTime);
        return result;
      }

      // Étape 2: Recherche par fournisseur + montant
      result = await this.searchBySupplierAndAmount(supplierName, amount, groupConfig, nocodbConfig);
      if (result.found) {
        nocodbLogger.info('VERIFY_INVOICE_SUCCESS', {
          matchType: 'SUPPLIER_AMOUNT',
          supplierName,
          amount,
          invoice: result.invoice
        }, groupConfig.id, groupConfig.name, Date.now() - startTime);
        return result;
      }

      // Étape 3: Recherche par fournisseur + date approximative
      result = await this.searchBySupplierAndDate(supplierName, new Date(), groupConfig, nocodbConfig);
      if (result.found) {
        nocodbLogger.info('VERIFY_INVOICE_SUCCESS', {
          matchType: 'SUPPLIER_DATE',
          supplierName,
          invoice: result.invoice
        }, groupConfig.id, groupConfig.name, Date.now() - startTime);
        return result;
      }

      // Aucune correspondance trouvée
      nocodbLogger.warn('VERIFY_INVOICE_NOT_FOUND', {
        invoiceRef,
        supplierName,
        amount,
        searchAttempts: 3
      }, groupConfig.id, groupConfig.name);

      return {
        found: false,
        matchType: 'NONE',
        verificationDetails: {
          invoiceRef,
          supplierName,
          amount,
          error: 'Aucune facture correspondante trouvée'
        }
      };

    } catch (error) {
      nocodbLogger.error('VERIFY_INVOICE_ERROR', error as Error, groupConfig.id, groupConfig.name, {
        invoiceRef,
        supplierName,
        amount
      });

      return {
        found: false,
        matchType: 'NONE',
        verificationDetails: {
          invoiceRef,
          supplierName,
          amount,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }
      };
    }
  }

  /**
   * Recherche par référence facture avec vérification fournisseur obligatoire
   */
  private async searchByInvoiceRef(
    invoiceRef: string,
    supplierName: string,
    groupConfig: GroupConfig,
    nocodbConfig: NocoDBConfig
  ): Promise<InvoiceVerificationResult> {
    
    nocodbLogger.debug('SEARCH_BY_INVOICE_REF_START', {
      invoiceRef,
      supplierName,
      tableId: groupConfig.nocodbTableId
    }, groupConfig.id, groupConfig.name);

    try {
      const searchUrl = `${nocodbConfig.baseUrl}/api/v1/db/data/noco/${nocodbConfig.projectId}/${groupConfig.nocodbTableId}`;
      const whereClause = `(${groupConfig.invoiceColumnName || 'RefFacture'},eq,${invoiceRef})`;
      
      nocodbLogger.debug('SEARCH_BY_INVOICE_REF_REQUEST', {
        searchUrl,
        whereClause,
        invoiceColumnName: groupConfig.invoiceColumnName,
        apiToken: nocodbConfig.apiToken ? `${nocodbConfig.apiToken.substring(0, 10)}...` : 'NOT_SET'
      }, groupConfig.id, groupConfig.name);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'xc-token': nocodbConfig.apiToken,
          'Content-Type': 'application/json'
        },
        params: {
          where: whereClause
        },
        timeout: 10000
      });

      nocodbLogger.debug('SEARCH_BY_INVOICE_REF_HTTP_DETAILS', {
        requestUrl: `${searchUrl}?where=${encodeURIComponent(whereClause)}`,
        responseStatus: response.status,
        responseHeaders: response.headers['content-type'],
        dataStructure: {
          hasData: !!response.data,
          hasList: !!response.data?.list,
          listLength: response.data?.list?.length || 0
        }
      }, groupConfig.id, groupConfig.name);

      nocodbLogger.debug('SEARCH_BY_INVOICE_REF_RESPONSE', {
        statusCode: response.status,
        recordsFound: response.data?.list?.length || 0,
        firstRecord: response.data?.list?.[0] || null
      }, groupConfig.id, groupConfig.name);

      if (response.data?.list?.length > 0) {
        // Vérifier que le fournisseur correspond
        const invoice = response.data.list[0];
        const invoiceSupplier = invoice[groupConfig.nocodbSupplierColumnName || 'Fournisseurs'];
        
        if (this.suppliersMatch(supplierName, invoiceSupplier)) {
          return {
            found: true,
            matchType: 'INVOICE_REF',
            invoice,
            verificationDetails: {
              invoiceRef,
              supplierName,
              searchUrl,
              searchCriteria: { invoiceRef, expectedSupplier: supplierName, foundSupplier: invoiceSupplier },
              responseData: response.data
            }
          };
        } else {
          nocodbLogger.warn('SEARCH_BY_INVOICE_REF_SUPPLIER_MISMATCH', {
            invoiceRef,
            expectedSupplier: supplierName,
            foundSupplier: invoiceSupplier
          }, groupConfig.id, groupConfig.name);
        }
      }

      return {
        found: false,
        verificationDetails: {
          invoiceRef,
          supplierName,
          searchUrl,
          responseData: response.data
        }
      };

    } catch (error) {
      const axiosError = error as any;
      nocodbLogger.error('SEARCH_BY_INVOICE_REF_ERROR', error as Error, groupConfig.id, groupConfig.name, {
        invoiceRef,
        supplierName,
        errorDetails: {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          responseData: axiosError.response?.data,
          requestUrl: `${nocodbConfig.baseUrl}/api/v1/db/data/noco/${nocodbConfig.projectId}/${groupConfig.nocodbTableId}`,
          fullUrl: `${nocodbConfig.baseUrl}/api/v1/db/data/noco/${nocodbConfig.projectId}/${groupConfig.nocodbTableId}?where=${encodeURIComponent(`(${groupConfig.invoiceColumnName || 'RefFacture'},eq,${invoiceRef})`)}`
        }
      });
      
      return {
        found: false,
        verificationDetails: {
          invoiceRef,
          supplierName,
          error: error instanceof Error ? error.message : 'Erreur recherche référence facture'
        }
      };
    }
  }

  /**
   * Recherche par numéro BL avec vérification fournisseur obligatoire
   */
  private async searchByBLNumber(
    blNumber: string,
    supplierName: string,
    groupConfig: GroupConfig,
    nocodbConfig: NocoDBConfig
  ): Promise<InvoiceVerificationResult> {
    
    nocodbLogger.debug('SEARCH_BY_BL_START', {
      blNumber,
      supplierName,
      tableId: groupConfig.nocodbTableId
    }, groupConfig.id, groupConfig.name);

    try {
      const searchUrl = `${nocodbConfig.baseUrl}/api/v1/db/data/noco/${nocodbConfig.projectId}/${groupConfig.nocodbTableId}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'xc-token': nocodbConfig.apiToken,
          'Content-Type': 'application/json'
        },
        params: {
          where: `(${groupConfig.nocodbBlColumnName},eq,${blNumber})`
        }
      });

      nocodbLogger.debug('SEARCH_BY_BL_RESPONSE', {
        statusCode: response.status,
        recordsFound: response.data?.list?.length || 0,
        firstRecord: response.data?.list?.[0] || null
      }, groupConfig.id, groupConfig.name);

      if (response.data?.list?.length > 0) {
        // Vérifier que le fournisseur correspond
        const invoice = response.data.list[0];
        const invoiceSupplier = invoice[groupConfig.nocodbSupplierColumnName || 'Fournisseurs'];
        
        if (this.suppliersMatch(supplierName, invoiceSupplier)) {
          return {
            found: true,
            matchType: 'BL_NUMBER',
            invoice,
            verificationDetails: {
              blNumber,
              supplierName,
              searchUrl,
              searchCriteria: { blNumber, expectedSupplier: supplierName, foundSupplier: invoiceSupplier },
              responseData: response.data
            }
          };
        } else {
          nocodbLogger.warn('SEARCH_BY_BL_SUPPLIER_MISMATCH', {
            blNumber,
            expectedSupplier: supplierName,
            foundSupplier: invoiceSupplier
          }, groupConfig.id, groupConfig.name);
        }
      }

      return {
        found: false,
        verificationDetails: {
          blNumber,
          supplierName,
          searchUrl,
          responseData: response.data
        }
      };

    } catch (error) {
      nocodbLogger.error('SEARCH_BY_BL_ERROR', error as Error, groupConfig.id, groupConfig.name, {
        blNumber,
        supplierName
      });
      
      return {
        found: false,
        verificationDetails: {
          blNumber,
          supplierName,
          error: error instanceof Error ? error.message : 'Erreur recherche BL'
        }
      };
    }
  }

  /**
   * Recherche par fournisseur et montant avec tolérance
   */
  private async searchBySupplierAndAmount(
    supplierName: string,
    amount: number,
    groupConfig: GroupConfig,
    nocodbConfig: NocoDBConfig
  ): Promise<InvoiceVerificationResult> {
    
    nocodbLogger.debug('SEARCH_BY_SUPPLIER_AMOUNT_START', {
      supplierName,
      amount,
      tableId: groupConfig.nocodbTableId
    }, groupConfig.id, groupConfig.name);

    try {
      const searchUrl = `${nocodbConfig.baseUrl}/api/v1/db/data/noco/${nocodbConfig.projectId}/${groupConfig.nocodbTableId}`;
      
      // Recherche avec tolérance de ±0.01€
      const minAmount = amount - 0.01;
      const maxAmount = amount + 0.01;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'xc-token': nocodbConfig.apiToken,
          'Content-Type': 'application/json'
        },
        params: {
          where: `(${groupConfig.nocodbSupplierColumnName},like,%${supplierName}%)~and(${groupConfig.nocodbAmountColumnName},gte,${minAmount})~and(${groupConfig.nocodbAmountColumnName},lte,${maxAmount})`
        }
      });

      nocodbLogger.debug('SEARCH_BY_SUPPLIER_AMOUNT_RESPONSE', {
        statusCode: response.status,
        recordsFound: response.data?.list?.length || 0,
        searchCriteria: { supplierName, minAmount, maxAmount }
      }, groupConfig.id, groupConfig.name);

      if (response.data?.list?.length > 0) {
        const invoice = response.data.list[0];
        return {
          found: true,
          matchType: 'SUPPLIER_AMOUNT',
          invoice,
          verificationDetails: {
            supplierName,
            amount,
            searchUrl,
            searchCriteria: { supplierName, minAmount, maxAmount },
            responseData: response.data
          }
        };
      }

      return {
        found: false,
        verificationDetails: {
          supplierName,
          amount,
          searchUrl,
          responseData: response.data
        }
      };

    } catch (error) {
      nocodbLogger.error('SEARCH_BY_SUPPLIER_AMOUNT_ERROR', error as Error, groupConfig.id, groupConfig.name, {
        supplierName,
        amount
      });
      
      return {
        found: false,
        verificationDetails: {
          supplierName,
          amount,
          error: error instanceof Error ? error.message : 'Erreur recherche fournisseur/montant'
        }
      };
    }
  }

  /**
   * Recherche par fournisseur et date approximative
   */
  private async searchBySupplierAndDate(
    supplierName: string,
    targetDate: Date,
    groupConfig: GroupConfig,
    nocodbConfig: NocoDBConfig
  ): Promise<InvoiceVerificationResult> {
    
    nocodbLogger.debug('SEARCH_BY_SUPPLIER_DATE_START', {
      supplierName,
      targetDate: targetDate.toISOString(),
      tableId: groupConfig.nocodbTableId
    }, groupConfig.id, groupConfig.name);

    try {
      const searchUrl = `${nocodbConfig.baseUrl}/api/v1/db/data/noco/${nocodbConfig.projectId}/${groupConfig.nocodbTableId}`;
      
      // Recherche dans une fenêtre de ±7 jours
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 7);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'xc-token': nocodbConfig.apiToken,
          'Content-Type': 'application/json'
        },
        params: {
          where: `(${groupConfig.nocodbSupplierColumnName},like,%${supplierName}%)`
        }
      });

      nocodbLogger.debug('SEARCH_BY_SUPPLIER_DATE_RESPONSE', {
        statusCode: response.status,
        recordsFound: response.data?.list?.length || 0,
        searchWindow: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
      }, groupConfig.id, groupConfig.name);

      if (response.data?.list?.length > 0) {
        // Prendre la première correspondance pour la démonstration
        const invoice = response.data.list[0];
        return {
          found: true,
          matchType: 'SUPPLIER_DATE',
          invoice,
          verificationDetails: {
            supplierName,
            searchUrl,
            searchCriteria: { supplierName, dateWindow: { startDate, endDate } },
            responseData: response.data
          }
        };
      }

      return {
        found: false,
        verificationDetails: {
          supplierName,
          searchUrl,
          responseData: response.data
        }
      };

    } catch (error) {
      nocodbLogger.error('SEARCH_BY_SUPPLIER_DATE_ERROR', error as Error, groupConfig.id, groupConfig.name, {
        supplierName,
        targetDate: targetDate.toISOString()
      });
      
      return {
        found: false,
        verificationDetails: {
          supplierName,
          error: error instanceof Error ? error.message : 'Erreur recherche fournisseur/date'
        }
      };
    }
  }

  /**
   * Validation des configurations requises
   */
  private validateConfigs(groupConfig: GroupConfig, nocodbConfig: NocoDBConfig): boolean {
    if (!nocodbConfig.isActive) {
      nocodbLogger.warn('NOCODB_CONFIG_INACTIVE', {
        configId: nocodbConfig.id,
        configName: nocodbConfig.name
      });
      return false;
    }

    if (!groupConfig.nocodbTableId || !groupConfig.nocodbBlColumnName) {
      nocodbLogger.warn('GROUP_CONFIG_INCOMPLETE', {
        groupId: groupConfig.id,
        missingFields: {
          tableId: !groupConfig.nocodbTableId,
          blColumnName: !groupConfig.nocodbBlColumnName
        }
      }, groupConfig.id, groupConfig.name);
      return false;
    }

    return true;
  }

  /**
   * Comparaison intelligente des noms de fournisseurs
   */
  private suppliersMatch(supplier1: string, supplier2: string): boolean {
    if (!supplier1 || !supplier2) return false;
    
    const normalize = (str: string) => str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');
    
    const norm1 = normalize(supplier1);
    const norm2 = normalize(supplier2);
    
    // Correspondance exacte
    if (norm1 === norm2) return true;
    
    // Correspondance partielle (l'un contient l'autre)
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    
    return false;
  }

  /**
   * Test de connectivité NocoDB
   */
  async testConnection(nocodbConfig: NocoDBConfig): Promise<{ success: boolean; error?: string; data?: any }> {
    nocodbLogger.info('TEST_CONNECTION_START', {
      configId: nocodbConfig.id,
      baseUrl: nocodbConfig.baseUrl
    });

    try {
      const testUrl = `${nocodbConfig.baseUrl}/api/v1/db/meta/projects/${nocodbConfig.projectId}/info`;
      
      const response = await axios.get(testUrl, {
        headers: {
          'xc-token': nocodbConfig.apiToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      nocodbLogger.info('TEST_CONNECTION_SUCCESS', {
        statusCode: response.status,
        projectInfo: response.data
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      nocodbLogger.error('TEST_CONNECTION_ERROR', error as Error, undefined, undefined, {
        configId: nocodbConfig.id,
        baseUrl: nocodbConfig.baseUrl
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      };
    }
  }
}

// Instance singleton
export const invoiceVerificationService = new InvoiceVerificationService();