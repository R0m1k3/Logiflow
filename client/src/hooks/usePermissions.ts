import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthUnified } from "./useAuthUnified";

export function usePermissions() {
  const { user, isLoading: userLoading } = useAuthUnified();

  // Récupérer les permissions utilisateur depuis l'API - NOUVEAU SYSTÈME
  const { data: userPermissions = [], isLoading: permissionsLoading, error: permissionsError, refetch } = useQuery({
    queryKey: ['/api/user/permissions'],
    enabled: !!user,
    staleTime: 0, // 🔧 DEBUG - Désactiver le cache pour forcer requête fraîche
    cacheTime: 0, // 🔧 DEBUG - Pas de cache en mémoire
    retry: false,
    refetchOnWindowFocus: false
  });

  // 🔧 FORCE REFRESH - Forcer actualisation si aucune permission
  React.useEffect(() => {
    if (user && !permissionsLoading && Array.isArray(userPermissions) && userPermissions.length === 0) {
      console.log('🔧 Force refresh permissions - aucune permission détectée');
      refetch();
    }
  }, [user, permissionsLoading, userPermissions, refetch]);

  // 🔧 DEBUG - Logs pour diagnostiquer le problème de données
  console.log('🔧 usePermissions Debug:', {
    hasUser: !!user,
    permissionsLoading,
    permissionsError: permissionsError?.message,
    userPermissionsType: typeof userPermissions,
    userPermissionsIsArray: Array.isArray(userPermissions),
    userPermissionsLength: Array.isArray(userPermissions) ? userPermissions.length : 'not-array',
    firstFewPermissions: Array.isArray(userPermissions) ? userPermissions.slice(0, 3) : userPermissions,
    userPermissionsRaw: userPermissions // 🔧 Voir la vraie structure des données
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