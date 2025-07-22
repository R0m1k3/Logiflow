import { useAuthUnified } from "./useAuthUnified";

export function usePermissions() {
  const { user, isLoading: userLoading } = useAuthUnified();

  // Fonction pour vérifier une permission basée sur le rôle fixe
  const hasPermission = (requiredPermission: string): boolean => {
    // Si l'utilisateur n'est pas chargé, ne pas autoriser
    if (!user) {
      return false;
    }
    
    // Admin a toujours accès
    if ((user as any).role === 'admin') {
      return true;
    }
    
    // Permissions hardcodées par rôle - 4 RÔLES FIXES
    const rolePermissions: Record<string, string[]> = {
      'employee': [
        // Tableau de bord
        'dashboard_read', 'statistics_read', 'reports_generate',
        // Calendrier
        'calendar_read',
        // Commandes (lecture seulement)
        'orders_read',
        // Livraisons (lecture seulement)
        'deliveries_read', 
        // Publicités (lecture seulement)
        'publicities_read',
        // Commandes clients (création/modification)
        'customer_orders_read', 'customer_orders_create', 'customer_orders_update',
        // DLC (création/modification/validation)
        'dlc_read', 'dlc_create', 'dlc_update', 'dlc_validate', 'dlc_print', 'dlc_stats',
        // Tâches (lecture/validation)
        'tasks_read', 'tasks_validate',
        // Fournisseurs (lecture uniquement pour formulaires - PAS DE MENU GESTION)
        'suppliers_read'
      ],
      'manager': [
        // Tableau de bord
        'dashboard_read', 'statistics_read', 'reports_generate',
        // Calendrier
        'calendar_read',
        // Commandes (complet)
        'orders_read', 'orders_create', 'orders_update', 'orders_delete',
        // Livraisons (complet)
        'deliveries_read', 'deliveries_create', 'deliveries_update', 'deliveries_delete', 'deliveries_validate',
        // Publicités (lecture seulement - pas d'édition)
        'publicities_read',
        // Commandes clients (complet)
        'customer_orders_read', 'customer_orders_create', 'customer_orders_update', 'customer_orders_delete',
        // DLC (complet)
        'dlc_read', 'dlc_create', 'dlc_update', 'dlc_delete', 'dlc_validate', 'dlc_print', 'dlc_stats',
        // Tâches (complet)
        'tasks_read', 'tasks_create', 'tasks_update', 'tasks_delete', 'tasks_validate',
        // Fournisseurs (lecture uniquement pour formulaires - PAS DE MENU GESTION)
        'suppliers_read'
        // PAS D'ACCÈS aux menus gestion (fournisseurs, magasins) ni administration (utilisateurs)
      ],
      'directeur': [
        // Tableau de bord
        'dashboard_read', 'statistics_read', 'reports_generate',
        // Calendrier
        'calendar_read',
        // Commandes (complet)
        'orders_read', 'orders_create', 'orders_update', 'orders_delete',
        // Livraisons (complet)
        'deliveries_read', 'deliveries_create', 'deliveries_update', 'deliveries_delete', 'deliveries_validate',
        // Publicités (lecture seulement - pas d'édition)
        'publicities_read',
        // Commandes clients (complet)
        'customer_orders_read', 'customer_orders_create', 'customer_orders_update', 'customer_orders_delete',
        // DLC (complet)
        'dlc_read', 'dlc_create', 'dlc_update', 'dlc_delete', 'dlc_validate', 'dlc_print', 'dlc_stats',
        // Tâches (complet)
        'tasks_read', 'tasks_create', 'tasks_update', 'tasks_delete', 'tasks_validate',
        // Rapprochement (lecture/modification)
        'reconciliation_read', 'reconciliation_update',
        // Fournisseurs (lecture uniquement pour formulaires - PAS DE MENU GESTION)
        'suppliers_read'
        // PAS D'ACCÈS aux menus gestion (fournisseurs, magasins) ni administration (utilisateurs)
      ]
    };
    
    // Vérifier si l'utilisateur a la permission selon son rôle
    const userRolePermissions = rolePermissions[(user as any).role] || [];
    return userRolePermissions.includes(requiredPermission);
  };

  return {
    hasPermission,
    isLoading: userLoading
  };
}