import { useQuery } from "@tanstack/react-query";
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
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

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