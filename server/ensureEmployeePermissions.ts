import { storage } from "./storage.production";

export async function ensureEmployeeSupplierPermissions() {
  try {
    console.log('🔧 EMPLOYEE FIX: Ensuring employee role has all supplier permissions...');
    
    // Get employee role
    const employeeRole = await storage.getRoleByName('employee');
    if (!employeeRole) {
      console.log('❌ Employee role not found');
      return false;
    }
    
    // List of supplier permissions that employee should have
    const requiredSupplierPermissions = [
      'suppliers_read',
      'suppliers_create', 
      'suppliers_update'
      // Note: suppliers_delete intentionally excluded for security
    ];
    
    // Get all existing permissions
    const allPermissions = await storage.getPermissions();
    const supplierPermissions = allPermissions.filter(p => 
      requiredSupplierPermissions.includes(p.name)
    );
    
    console.log('📋 Required supplier permissions for employee:', requiredSupplierPermissions);
    console.log('📋 Found supplier permissions in DB:', supplierPermissions.map(p => p.name));
    
    // Get current role permissions
    const currentRolePermissions = await storage.getRolePermissions(employeeRole.id);
    const currentPermissionNames = currentRolePermissions.map(rp => rp.permission.name);
    
    console.log('📋 Employee role current permissions:', currentPermissionNames);
    
    // Find missing supplier permissions
    const missingSupplierPermissions = supplierPermissions.filter(p => 
      !currentPermissionNames.includes(p.name)
    );
    
    if (missingSupplierPermissions.length === 0) {
      console.log('✅ Employee role already has all required supplier permissions');
      return true;
    }
    
    console.log('🔧 Adding missing supplier permissions to employee role:', 
      missingSupplierPermissions.map(p => p.name));
    
    // Add missing permissions
    for (const permission of missingSupplierPermissions) {
      await storage.addRolePermission(employeeRole.id, permission.id);
      console.log(`✅ Added permission ${permission.name} to employee role`);
    }
    
    console.log('🎉 EMPLOYEE FIX COMPLETED: All supplier permissions added to employee role');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to ensure employee supplier permissions:', error);
    return false;
  }
}