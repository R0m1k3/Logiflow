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
    
    // Permissions hardcodées par rôle
    const rolePermissions: Record<string, string[]> = {
      'employee': [
        'dashboard_read', 'statistics_read', 'reports_generate',
        'calendar_read',
        'orders_read',
        'deliveries_read', 
        'publicities_read',
        'customer_orders_read', 'customer_orders_create', 'customer_orders_update',
        'dlc_read', 'dlc_create', 'dlc_update', 'dlc_validate', 'dlc_print', 'dlc_stats',
        'tasks_read', 'tasks_validate',
        'suppliers_read'
      ],
      'manager': [
        'dashboard_read', 'statistics_read', 'reports_generate',
        'calendar_read',
        'orders_read', 'orders_create', 'orders_update', 'orders_delete',
        'deliveries_read', 'deliveries_create', 'deliveries_update', 'deliveries_delete', 'deliveries_validate',
        'publicities_read',
        'customer_orders_read', 'customer_orders_create', 'customer_orders_update', 'customer_orders_delete',
        'dlc_read', 'dlc_create', 'dlc_update', 'dlc_delete', 'dlc_validate', 'dlc_print', 'dlc_stats',
        'tasks_read', 'tasks_create', 'tasks_update', 'tasks_delete', 'tasks_validate',
        'suppliers_read', 'suppliers_create', 'suppliers_update', 'suppliers_delete',
        'groups_read', 'groups_create', 'groups_update', 'groups_delete'
      ],
      'directeur': [
        'dashboard_read', 'statistics_read', 'reports_generate',
        'calendar_read',
        'orders_read', 'orders_create', 'orders_update', 'orders_delete',
        'deliveries_read', 'deliveries_create', 'deliveries_update', 'deliveries_delete', 'deliveries_validate',
        'publicities_read',
        'customer_orders_read', 'customer_orders_create', 'customer_orders_update', 'customer_orders_delete',
        'dlc_read', 'dlc_create', 'dlc_update', 'dlc_delete', 'dlc_validate', 'dlc_print', 'dlc_stats',
        'tasks_read', 'tasks_create', 'tasks_update', 'tasks_delete', 'tasks_validate',
        'suppliers_read', 'suppliers_create', 'suppliers_update', 'suppliers_delete',
        'groups_read', 'groups_create', 'groups_update', 'groups_delete',
        'reconciliation_read', 'reconciliation_update'
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