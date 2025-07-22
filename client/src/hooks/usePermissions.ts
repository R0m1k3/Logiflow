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
    gcTime: 0, // 🔧 DEBUG - Pas de cache en mémoire (TanStack Query v5)
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

  // 🔧 FIX PERMISSIONS - Extraire les noms des permissions
  const permissionNames = React.useMemo(() => {
    if (!Array.isArray(userPermissions)) return [];
    return userPermissions.map(p => 
      typeof p === 'string' ? p : p.name
    ).filter(Boolean);
  }, [userPermissions]);

  // 🔧 DEBUG - Logs pour vérifier le bon fonctionnement
  console.log('🔧 usePermissions - Nicolas Directeur:', {
    permissionsCount: permissionNames.length,
    hasDashboard: permissionNames.includes('dashboard_read'),
    hasCalendar: permissionNames.includes('calendar_read'),
    hasOrders: permissionNames.includes('orders_read'),
    hasGestion: permissionNames.includes('suppliers_create') || permissionNames.includes('groups_create'),
    permissionNames: permissionNames.slice(0, 10) // Premiers 10 pour vérification
  });

  // Fonction pour vérifier une permission basée sur les vrais rôles de la base
  const hasPermission = (requiredPermission: string): boolean => {
    // Si l'utilisateur n'est pas chargé, ne pas autoriser
    if (!user || permissionsLoading) {
      return false;
    }

    // 🔧 CORRECTION - Vérifier dans les noms extraits
    return permissionNames.includes(requiredPermission);
  };

  return {
    hasPermission,
    isLoading: userLoading || permissionsLoading,
    userPermissions
  };
}