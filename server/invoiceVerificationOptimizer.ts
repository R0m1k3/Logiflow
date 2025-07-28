/**
 * 🚀 PERFORMANCE OPTIMIZATION SERVICE
 * Cache invoice verification results to avoid repeated NocoDB API calls
 * when database grows large with many deliveries
 */

import { storage } from './storage';
import { InvoiceVerificationService } from './services/invoiceVerificationService';
import type { InsertInvoiceVerification } from '@shared/schema';

export class InvoiceVerificationOptimizer {
  private verificationService: InvoiceVerificationService | null = null;

  constructor() {
    // Initialize service lazily to avoid import issues
  }

  private async getVerificationService(): Promise<InvoiceVerificationService> {
    if (!this.verificationService) {
      const { invoiceVerificationService } = await import('./services/invoiceVerificationService');
      this.verificationService = invoiceVerificationService;
    }
    return this.verificationService;
  }

  /**
   * 🔍 Get invoice verification with intelligent caching
   * - First check cache (database table)
   * - If not found or expired, verify via NocoDB
   * - Save/update result in cache
   */
  async getVerificationWithCache(
    deliveryId: number,
    groupId: number,
    invoiceReference: string,
    supplierName?: string
  ): Promise<{ exists: boolean; matchType: string; cacheHit: boolean }> {
    console.log(`🔍 VERIFICATION OPTIMIZER - Checking delivery ${deliveryId} with invoice ${invoiceReference}`);

    // Step 1: Check cache first
    const cachedVerification = await storage.getInvoiceVerification(deliveryId);
    
    if (cachedVerification && this.isCacheValid(cachedVerification)) {
      console.log(`✅ CACHE HIT - Using cached result for delivery ${deliveryId}`);
      return {
        exists: cachedVerification.exists,
        matchType: cachedVerification.matchType || 'CACHED',
        cacheHit: true
      };
    }

    // Step 2: Cache miss or expired - verify via NocoDB
    console.log(`🌐 CACHE MISS - Verifying via NocoDB for delivery ${deliveryId}`);
    
    try {
      const verificationService = await this.getVerificationService();
      const verificationResult = await verificationService.searchByInvoiceReference(
        groupId,
        invoiceReference
      );

      // Step 3: Save/update cache with new result
      const cacheData: InsertInvoiceVerification = {
        deliveryId,
        groupId,
        invoiceReference,
        supplierName: supplierName || null,
        exists: verificationResult.found,
        matchType: verificationResult.found ? 'EXACT_MATCH' : 'NOT_FOUND',
        isValid: true,
      };

      if (cachedVerification) {
        // Update existing cache entry
        await storage.updateInvoiceVerification(deliveryId, cacheData);
        console.log(`🔄 CACHE UPDATED - Delivery ${deliveryId}`);
      } else {
        // Create new cache entry
        await storage.createInvoiceVerification(cacheData);
        console.log(`💾 CACHE CREATED - Delivery ${deliveryId}`);
      }

      return {
        exists: verificationResult.found,
        matchType: verificationResult.found ? 'EXACT_MATCH' : 'NOT_FOUND',
        cacheHit: false
      };

    } catch (error) {
      console.error(`❌ VERIFICATION ERROR - Delivery ${deliveryId}:`, error);
      
      // On error, invalidate cache entry but don't throw
      if (cachedVerification) {
        await storage.updateInvoiceVerification(deliveryId, { isValid: false });
      }

      return {
        exists: false,
        matchType: 'ERROR',
        cacheHit: false
      };
    }
  }

  /**
   * 🕐 Check if cached verification is still valid
   * Cache is valid for 24 hours by default
   */
  private isCacheValid(verification: any): boolean {
    if (!verification.isValid) {
      return false;
    }

    const now = new Date();
    const lastChecked = new Date(verification.lastCheckedAt);
    const cacheExpiryHours = 24; // Cache expires after 24 hours
    const expiryTime = lastChecked.getTime() + (cacheExpiryHours * 60 * 60 * 1000);

    const isValid = now.getTime() < expiryTime;
    console.log(`🕐 CACHE VALIDATION - Delivery ${verification.deliveryId}: ${isValid ? 'VALID' : 'EXPIRED'}`);
    
    return isValid;
  }

  /**
   * 🗑️ Invalidate cache for specific delivery
   * Useful when delivery data changes
   */
  async invalidateCache(deliveryId: number): Promise<void> {
    console.log(`🗑️ CACHE INVALIDATION - Delivery ${deliveryId}`);
    await storage.deleteInvoiceVerification(deliveryId);
  }

  /**
   * 🔄 Bulk verify multiple deliveries with optimal caching
   * Processes deliveries in batches to avoid overwhelming NocoDB API
   */
  async bulkVerifyWithCache(deliveries: Array<{
    id: number;
    groupId: number;
    invoiceReference: string;
    supplierName?: string;
  }>): Promise<Array<{
    deliveryId: number;
    exists: boolean;
    matchType: string;
    cacheHit: boolean;
  }>> {
    console.log(`🔄 BULK VERIFICATION OPTIMIZER - Processing ${deliveries.length} deliveries`);
    
    const results = [];
    const batchSize = 5; // Process 5 at a time to avoid rate limits

    for (let i = 0; i < deliveries.length; i += batchSize) {
      const batch = deliveries.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(deliveries.length/batchSize)}`);

      const batchPromises = batch.map(async (delivery) => {
        const result = await this.getVerificationWithCache(
          delivery.id,
          delivery.groupId,
          delivery.invoiceReference,
          delivery.supplierName
        );
        return {
          deliveryId: delivery.id,
          ...result
        };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`❌ Batch verification failed for delivery ${batch[index].id}:`, result.reason);
          results.push({
            deliveryId: batch[index].id,
            exists: false,
            matchType: 'ERROR',
            cacheHit: false
          });
        }
      });

      // Small delay between batches to be respectful to NocoDB API
      if (i + batchSize < deliveries.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const cacheHits = results.filter(r => r.cacheHit).length;
    const apiCalls = results.length - cacheHits;
    
    console.log(`✅ BULK VERIFICATION COMPLETE - ${results.length} deliveries processed`);
    console.log(`📊 CACHE PERFORMANCE - ${cacheHits} cache hits, ${apiCalls} API calls`);
    console.log(`⚡ CACHE EFFICIENCY - ${Math.round((cacheHits/results.length)*100)}% cache hit rate`);

    return results;
  }

  /**
   * 📊 Get cache statistics for monitoring
   */
  async getCacheStats(groupId?: number): Promise<{
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    cacheHitRate?: number;
  }> {
    const entries = groupId 
      ? await storage.getInvoiceVerificationsByGroup(groupId)
      : []; // Could add getAllInvoiceVerifications method if needed

    const validEntries = entries.filter(entry => this.isCacheValid(entry)).length;
    const expiredEntries = entries.length - validEntries;

    return {
      totalEntries: entries.length,
      validEntries,
      expiredEntries,
      cacheHitRate: undefined // Could be calculated over time
    };
  }

  /**
   * 🧹 Clean up expired cache entries
   */
  async cleanupExpiredCache(groupId?: number): Promise<number> {
    console.log(`🧹 CACHE CLEANUP - Starting cleanup for group ${groupId || 'all'}`);
    
    const entries = groupId 
      ? await storage.getInvoiceVerificationsByGroup(groupId)
      : []; // Could add method to get all entries

    let cleanedCount = 0;
    
    for (const entry of entries) {
      if (!this.isCacheValid(entry)) {
        await storage.deleteInvoiceVerification(entry.deliveryId);
        cleanedCount++;
      }
    }

    console.log(`🧹 CACHE CLEANUP COMPLETE - Removed ${cleanedCount} expired entries`);
    return cleanedCount;
  }
}

export const invoiceVerificationOptimizer = new InvoiceVerificationOptimizer();