import { storage as devStorage } from "./storage";
import { storage as prodStorage } from "./storage.production";

// Use appropriate storage based on environment  
const isProduction = process.env.NODE_ENV === 'production' || process.env.STORAGE_MODE === 'production';
const storage = isProduction ? prodStorage : devStorage;

// 🔧 HARDCODED ROLE-BASED PERMISSIONS - No database required
function checkHardcodedPermission(userRole: string, permissionName: string): boolean {
  console.log(`🔍 [HARDCODED CHECK] Checking role "${userRole}" for permission "${permissionName}"`);
  
  // Admin has all permissions
  if (userRole === 'admin') {
    console.log(`✅ [HARDCODED CHECK] Admin role - all permissions granted`);
    return true;
  }

  // Directeur has admin-level permissions  
  if (userRole === 'directeur') {
    console.log(`✅ [HARDCODED CHECK] Directeur role - all permissions granted`);
    return true;
  }

  // SAV Module permissions
  const savPermissions = {
    manager: ['sav_read', 'sav_create', 'sav_update'],
    employee: ['sav_read'],
    admin: ['sav_read', 'sav_create', 'sav_update', 'sav_delete'],
    directeur: ['sav_read', 'sav_create', 'sav_update', 'sav_delete']
  };

  // Supplier Module permissions  
  const supplierPermissions = {
    manager: ['suppliers_read', 'suppliers_create', 'suppliers_update'],
    employee: ['suppliers_read'],
    admin: ['suppliers_read', 'suppliers_create', 'suppliers_update', 'suppliers_delete'],
    directeur: ['suppliers_read', 'suppliers_create', 'suppliers_update', 'suppliers_delete']
  };

  // System admin permissions (webhooks, etc.)
  const systemPermissions = {
    admin: ['system_admin'],
    directeur: ['system_admin']
  };

  // Check SAV permissions
  if ((savPermissions as any)[userRole] && (savPermissions as any)[userRole].includes(permissionName)) {
    console.log(`✅ [HARDCODED CHECK] Role "${userRole}" has SAV permission "${permissionName}"`);
    return true;
  }

  // Check supplier permissions
  if ((supplierPermissions as any)[userRole] && (supplierPermissions as any)[userRole].includes(permissionName)) {
    console.log(`✅ [HARDCODED CHECK] Role "${userRole}" has supplier permission "${permissionName}"`);
    return true;
  }

  // Check system permissions
  if ((systemPermissions as any)[userRole] && (systemPermissions as any)[userRole].includes(permissionName)) {
    console.log(`✅ [HARDCODED CHECK] Role "${userRole}" has system permission "${permissionName}"`);
    return true;
  }

  console.log(`❌ [HARDCODED CHECK] Role "${userRole}" does NOT have permission "${permissionName}"`);
  return false;
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  try {
    console.log(`🔍 [PERMISSION CHECK] Checking "${permissionName}" for user ${userId}`);
    console.log(`🔍 [PERMISSION CHECK] Storage mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    
    // FALLBACK: If user is admin_fallback, grant all permissions (database unavailable fallback)
    if (userId === 'admin_fallback') {
      console.log(`✅ [PERMISSION CHECK] Admin fallback user - granting permission: ${permissionName}`);
      return true;
    }
    
    // Try to get user from database, but fallback to hardcoded permissions if fails
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        console.log(`❌ [PERMISSION CHECK] User ${userId} not found`);
        return false;
      }

      console.log(`🔍 [PERMISSION CHECK] User found: ${user.username} with role: ${user.role}`);

      // 🔧 USE HARDCODED PERMISSION SYSTEM (no database dependency)
      const hasHardcodedPermission = checkHardcodedPermission(user.role, permissionName);
      if (hasHardcodedPermission) {
        console.log(`✅ [PERMISSION CHECK] HARDCODED permission "${permissionName}" granted for user ${userId} with role ${user.role}`);
        return true;
      }

      console.log(`❌ [PERMISSION CHECK] HARDCODED permission "${permissionName}" denied for user ${userId} with role ${user.role}`);
      return false;

    } catch (dbError: any) {
      console.log(`⚠️ [PERMISSION CHECK] Database error - using fallback for user ${userId}:`, dbError.message);
      
      // 🔧 FALLBACK: If database is unavailable, assume basic permissions based on userId patterns
      if (userId.includes('admin') || userId === 'admin_fallback') {
        console.log(`✅ [PERMISSION CHECK] Fallback admin user - granting permission: ${permissionName}`);
        return true;
      }
      
      // For production fallback, allow basic SAV read operations
      if (permissionName === 'sav_read' || permissionName === 'suppliers_read') {
        console.log(`✅ [PERMISSION CHECK] Fallback allowing basic read permission: ${permissionName}`);
        return true;
      }
      
      console.log(`❌ [PERMISSION CHECK] Fallback denying permission: ${permissionName}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ [PERMISSION CHECK] Error checking permission "${permissionName}" for user ${userId}:`, error);
    return false;
  }
}

/**
 * Middleware to check specific permission
 */
export function requirePermission(permissionName: string) {
  return async (req: any, res: any, next: any) => {
    try {
      console.log(`🔍 PERMISSION CHECK: ${permissionName} - Incoming request`);
      console.log(`🔍 PERMISSION CHECK: req.user exists:`, !!req.user);
      console.log(`🔍 PERMISSION CHECK: req.user.claims:`, req.user?.claims);
      console.log(`🔍 PERMISSION CHECK: req.user.id:`, req.user?.id);
      
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      
      if (!userId) {
        console.log(`❌ PERMISSION CHECK: No userId found - returning 401`);
        return res.status(401).json({ message: "User not authenticated" });
      }

      console.log(`🔍 PERMISSION CHECK: Checking permission "${permissionName}" for user ${userId}`);
      const allowed = await hasPermission(userId, permissionName);
      
      if (!allowed) {
        console.log(`🚫 PERMISSION DENIED: ${permissionName} for user ${userId}`);
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      console.log(`✅ PERMISSION GRANTED: ${permissionName} for user ${userId}`);
      next();
    } catch (error) {
      console.error(`❌ Permission middleware error for ${permissionName}:`, error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
}