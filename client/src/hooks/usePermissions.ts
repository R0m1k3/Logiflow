import { useQuery } from "@tanstack/react-query";
import { useAuthUnified } from "./useAuthUnified";

export function usePermissions() {
  const { user, isLoading: userLoading } = useAuthUnified();

  // Récupérer les permissions de l'utilisateur
  const { data: userPermissions = [], isLoading: permissionsLoading, error: permissionsError } = useQuery({
    queryKey: ['/api/user/permissions'],
    queryFn: async () => {
      const response = await fetch('/api/user/permissions', { 
        credentials: 'include',
        cache: 'no-cache' 
      });
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      const permissions = await response.json();
      return permissions;
    },
    enabled: !!user && !userLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  });

  // Fonction pour vérifier une permission
  const hasPermission = (requiredPermission: string): boolean => {
    // Si l'utilisateur n'est pas chargé, ne pas autoriser
    if (!user) {
      return false;
    }
    
    // Admin a toujours accès
    if (user.role === 'admin') {
      return true;
    }
    
    // Si les permissions sont en cours de chargement, ne pas autoriser (sauf admin)
    if (permissionsLoading) {
      return false;
    }
    
    // Si erreur de chargement des permissions, ne pas autoriser
    if (permissionsError) {
      return false;
    }
    
    // Si pas de permissions chargées pour un non-admin, ne pas autoriser
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }
    
    // Vérifier si l'utilisateur a la permission spécifique
    const hasSpecificPermission = userPermissions.some((perm: any) => 
      perm.name === requiredPermission || perm.permission?.name === requiredPermission
    );
    
    return hasSpecificPermission;
  };

  return {
    permissions: userPermissions,
    isLoading: userLoading || permissionsLoading,
    error: permissionsError,
    hasPermission
  };
}