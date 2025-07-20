/**
 * Utility functions for permission checking
 */

export function hasPermission(userRole: string | undefined, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function hasSpecificPermission(userPermissions: string[] | undefined, permission: string): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(permission);
}

export function canCreateOrders(userRole: string | undefined, userPermissions: string[] | undefined): boolean {
  return hasPermission(userRole, ['admin', 'manager']) || 
         hasSpecificPermission(userPermissions, 'orders_create');
}

export function canCreateDeliveries(userRole: string | undefined, userPermissions: string[] | undefined): boolean {
  return hasPermission(userRole, ['admin', 'manager']) || 
         hasSpecificPermission(userPermissions, 'deliveries_create');
}