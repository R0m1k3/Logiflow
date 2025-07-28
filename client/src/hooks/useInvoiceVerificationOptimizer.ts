/**
 * 🚀 PERFORMANCE OPTIMIZATION HOOK
 * React hook for optimized invoice verification with caching
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CachedVerificationResult {
  exists: boolean;
  matchType: string;
  cacheHit: boolean;
}

interface BulkVerificationRequest {
  id: number;
  groupId: number;
  invoiceReference: string;
  supplierName?: string;
}

interface BulkVerificationResult {
  deliveryId: number;
  exists: boolean;
  matchType: string;
  cacheHit: boolean;
}

interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  cacheHitRate?: number;
}

export function useInvoiceVerificationOptimizer() {
  // Single optimized verification with cache
  const verifySingleWithCache = useMutation({
    mutationFn: async ({
      deliveryId,
      groupId,
      invoiceReference,
      supplierName
    }: {
      deliveryId: number;
      groupId: number;
      invoiceReference: string;
      supplierName?: string;
    }): Promise<CachedVerificationResult> => {
      const response = await apiRequest('/api/invoice-verifications/verify-with-cache', {
        method: 'POST',
        body: JSON.stringify({
          deliveryId,
          groupId,
          invoiceReference,
          supplierName
        })
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-verifications'] });
    }
  });

  // Bulk optimized verification with cache
  const verifyBulkWithCache = useMutation({
    mutationFn: async (deliveries: BulkVerificationRequest[]): Promise<BulkVerificationResult[]> => {
      return await apiRequest('/api/invoice-verifications/bulk-verify', {
        method: 'POST',
        body: JSON.stringify({ deliveries })
      });
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-verifications'] });
    }
  });

  // Get cached verification for specific delivery
  const getCachedVerification = (deliveryId: number) => {
    return useQuery({
      queryKey: ['/api/invoice-verifications', deliveryId],
      queryFn: async () => {
        const response = await apiRequest(`/api/invoice-verifications/${deliveryId}`);
        return response.json();
      },
      enabled: !!deliveryId
    });
  };

  // Get cache statistics
  const getCacheStats = (groupId?: number) => {
    return useQuery({
      queryKey: ['/api/invoice-verifications/cache-stats', groupId],
      queryFn: async (): Promise<CacheStats> => {
        const endpoint = groupId 
          ? `/api/invoice-verifications/cache-stats/${groupId}`
          : '/api/invoice-verifications/cache-stats';
        const response = await apiRequest(endpoint);
        return response.json();
      }
    });
  };

  // Clean up expired cache entries
  const cleanupExpiredCache = useMutation({
    mutationFn: async (groupId?: number): Promise<{ cleanedCount: number }> => {
      const endpoint = groupId 
        ? `/api/invoice-verifications/cleanup/${groupId}`
        : '/api/invoice-verifications/cleanup';
      const response = await apiRequest(endpoint, { method: 'DELETE' });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate cache stats queries
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-verifications/cache-stats'] });
    }
  });

  // Invalidate cache for specific delivery
  const invalidateDeliveryCache = useMutation({
    mutationFn: async (deliveryId: number): Promise<void> => {
      await apiRequest(`/api/invoice-verifications/${deliveryId}`, { method: 'DELETE' });
    },
    onSuccess: (_, deliveryId) => {
      // Invalidate specific delivery cache
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-verifications', deliveryId] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-verifications/cache-stats'] });
    }
  });

  return {
    // Mutations
    verifySingleWithCache,
    verifyBulkWithCache,
    cleanupExpiredCache,
    invalidateDeliveryCache,
    
    // Query functions
    getCachedVerification,
    getCacheStats
  };
}