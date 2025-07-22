import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthUnified } from "./useAuthUnified";

export function usePermissions() {
  const { user, isLoading: userLoading } = useAuthUnified();

  // Récupérer les permissions utilisateur depuis l'API - NOUVEAU SYSTÈME
  const { data: userPermissions = [], isLoading: permissionsLoading, error: permissionsError, refetch } = useQuery({
    queryKey: ['/api/user/permissions', user?.id || user?.username],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    retry: 1,
    refetchOnWindowFocus: false
  });

  // 🔧 FORCE REFRESH - Forcer actualisation si aucune permission
  React.useEffect(() => {
    if (user && !permissionsLoading && Array.isArray(userPermissions) && userPermissions.length === 0) {
      console.log('🔧 Force refresh permissions - aucune permission détectée');
      refetch();
    }
  }, [user, permissionsLoading, userPermissions, refetch]);

  // 🔧 FIX PERMISSIONS - Extraire les noms des permissions (PRODUCTION FORMAT)
  const permissionNames = React.useMemo(() => {
    if (!Array.isArray(userPermissions)) return [];
    
    // Format production : objets avec propriété 'name'
    // Format développement : chaînes de caractères
    const names = userPermissions.map(p => {
      if (typeof p === 'string') return p;
      if (typeof p === 'object' && p?.name) return p.name;
      return null;
    }).filter(Boolean);
    
    console.log('🔧 PRODUCTION - Permission names extracted:', names.slice(0, 10));
    return names;
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