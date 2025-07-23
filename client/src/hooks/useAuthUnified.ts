import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

// Hook d'authentification unifié simplifié - utilise uniquement React Query
export function useAuthUnified() {
  const authQuery = useQuery({
    queryKey: ["/api/user"],
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval: 5 * 60 * 1000, // Vérification toutes les 5 minutes
    refetchOnWindowFocus: true, // Vérifier quand la fenêtre reprend le focus
    refetchOnMount: true,
    refetchOnReconnect: true, // Vérifier lors de la reconnexion
    staleTime: 2 * 60 * 1000, // Données valides 2 minutes
    gcTime: 15 * 60 * 1000,
  });

  // Redirection automatique vers /auth en cas d'erreur d'authentification
  useEffect(() => {
    if (authQuery.error && !authQuery.isLoading) {
      const errorMessage = authQuery.error?.message || '';
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        console.log('🔒 Utilisateur non connecté, redirection vers authentification');
        // Redirection via window.location pour éviter les problèmes de hooks
        window.location.href = '/auth';
      }
    }
  }, [authQuery.error, authQuery.isLoading]);

  const refreshAuth = () => {
    authQuery.refetch();
  };

  const forceAuthRefresh = async () => {
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    await new Promise(resolve => setTimeout(resolve, 50));
    const result = await authQuery.refetch();
    return result.data;
  };

  return {
    user: authQuery.data || null,
    isLoading: authQuery.isLoading,
    isAuthenticated: !!authQuery.data,
    error: authQuery.error,
    refreshAuth,
    forceAuthRefresh,
    environment: 'unified'
  };
}