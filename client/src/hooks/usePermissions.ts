import { useQuery } from "@tanstack/react-query";
import { useAuthUnified } from "./useAuthUnified";

export function usePermissions() {
  const { user, isLoading: userLoading } = useAuthUnified();

  // Récupérer les permissions utilisateur depuis l'API - NOUVEAU SYSTÈME
  const { data: userPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/user/permissions'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: false
  });

  // Fonction pour vérifier une permission basée sur les vrais rôles de la base
  const hasPermission = (requiredPermission: string): boolean => {
    // Si l'utilisateur n'est pas chargé, ne pas autoriser
    if (!user || permissionsLoading) {
      return false;
    }

    // Vérifier si l'utilisateur a la permission selon les données de la base
    return Array.isArray(userPermissions) && userPermissions.includes(requiredPermission);
  };

  return {
    hasPermission,
    isLoading: userLoading || permissionsLoading,
    userPermissions
  };
}