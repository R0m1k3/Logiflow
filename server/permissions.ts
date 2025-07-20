import { storage as devStorage } from "./storage";
import { storage as prodStorage } from "./storage.production";

// Use appropriate storage based on environment  
const isProduction = process.env.NODE_ENV === 'production' || process.env.STORAGE_MODE === 'production';
const storage = isProduction ? prodStorage : devStorage;

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  try {
    console.log(`🔍 [PERMISSION CHECK] Checking "${permissionName}" for user ${userId}`);
    console.log(`🔍 [PERMISSION CHECK] Storage mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    
    const user = await storage.getUser(userId);
    if (!user) {
      console.log(`❌ [PERMISSION CHECK] User ${userId} not found`);
      return false;
    }

    console.log(`🔍 [PERMISSION CHECK] User found: ${user.username} with role: ${user.role}`);

    // Admin always has all permissions
    if (user.role === 'admin') {
      console.log(`✅ [PERMISSION CHECK] User ${userId} is admin - permission granted`);
      return true;
    }

    // Get user's role permissions
    console.log(`🔍 [PERMISSION CHECK] Getting user roles for ${userId}...`);
    const userRoles = await storage.getUserRoles(userId);
    console.log(`📋 [PERMISSION CHECK] User ${userId} has ${userRoles.length} roles:`, userRoles.map(ur => `${ur.role.name} (ID: ${ur.role.id})`));
    
    if (userRoles.length === 0) {
      console.log(`❌ [PERMISSION CHECK] No roles found for user ${userId}`);
      return false;
    }
    
    for (const userRole of userRoles) {
      console.log(`🔐 [PERMISSION CHECK] Checking permissions for role: ${userRole.role.name} (ID: ${userRole.role.id})`);
      const rolePermissions = await storage.getRolePermissions(userRole.role.id);
      console.log(`🔐 [PERMISSION CHECK] Role ${userRole.role.name} has ${rolePermissions.length} permissions`);
      
      // Log some sample permissions for debugging
      const samplePermissions = rolePermissions.slice(0, 3).map(rp => rp.permission.name);
      console.log(`🔍 [PERMISSION CHECK] Sample permissions: ${samplePermissions.join(', ')}`);
      
      const hasPermission = rolePermissions.some(rp => rp.permission.name === permissionName);
      if (hasPermission) {
        console.log(`✅ [PERMISSION CHECK] Permission "${permissionName}" FOUND for user ${userId} via role ${userRole.role.name}`);
        return true;
      } else {
        console.log(`❌ [PERMISSION CHECK] Permission "${permissionName}" NOT found in role ${userRole.role.name}`);
      }
    }
    
    console.log(`❌ [PERMISSION CHECK] Permission "${permissionName}" NOT found for user ${userId} in any role`);
    return false;
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