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
    console.log(`🔍 Checking permission "${permissionName}" for user ${userId}`);
    
    const user = await storage.getUser(userId);
    if (!user) {
      console.log(`❌ User ${userId} not found`);
      return false;
    }

    // Admin always has all permissions
    if (user.role === 'admin') {
      console.log(`✅ User ${userId} is admin - permission granted`);
      return true;
    }

    // Get user's role permissions
    const userRoles = await storage.getUserRoles(userId);
    console.log(`📋 User ${userId} roles:`, userRoles.map(ur => ur.role.name));
    
    for (const userRole of userRoles) {
      const rolePermissions = await storage.getRolePermissions(userRole.role.id);
      console.log(`🔐 Role ${userRole.role.name} permissions:`, rolePermissions.map(rp => rp.permission.name));
      
      const hasPermission = rolePermissions.some(rp => rp.permission.name === permissionName);
      if (hasPermission) {
        console.log(`✅ Permission "${permissionName}" found for user ${userId} via role ${userRole.role.name}`);
        return true;
      }
    }
    
    console.log(`❌ Permission "${permissionName}" NOT found for user ${userId}`);
    return false;
  } catch (error) {
    console.error(`❌ Error checking permission "${permissionName}" for user ${userId}:`, error);
    return false;
  }
}

/**
 * Middleware to check specific permission
 */
export function requirePermission(permissionName: string) {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const allowed = await hasPermission(userId, permissionName);
      
      if (!allowed) {
        console.log(`🚫 Permission denied: ${permissionName} for user ${userId}`);
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error(`❌ Permission middleware error for ${permissionName}:`, error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
}