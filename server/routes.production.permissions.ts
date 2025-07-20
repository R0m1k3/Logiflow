import type { Express } from "express";
import { storage as prodStorage } from "./storage.production";
import { requirePermission } from "./permissions";
import { 
  insertSupplierSchema,
} from "@shared/schema";

// Add permission-based routes to replace role-based checks
export function addPermissionRoutes(app: Express, isAuthenticated: any) {
  
  // Suppliers routes with permission checks
  app.get('/api/suppliers', isAuthenticated, requirePermission('suppliers_read'), async (req: any, res) => {
    try {
      // Check if DLC filter is requested
      const dlcOnly = req.query.dlc === 'true';
      const suppliers = await prodStorage.getSuppliers(dlcOnly);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, requirePermission('suppliers_create'), async (req: any, res) => {
    try {
      console.log('🚚 POST /api/suppliers - Raw request received');
      console.log('📨 Request headers:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'user-agent': req.headers['user-agent']?.substring(0, 50)
      });
      console.log('📋 Request body type:', typeof req.body);
      console.log('📋 Request body content:', JSON.stringify(req.body, null, 2));
      console.log('📋 Request body keys:', Object.keys(req.body || {}));
      
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      console.log('🔐 User requesting supplier creation:', userId);
      
      // Permission check is handled by middleware, proceed with creation
      console.log('✅ User has permission to create supplier (verified by middleware)');
      
      // Validate request body with insertSupplierSchema
      const parseResult = insertSupplierSchema.safeParse(req.body);
      if (!parseResult.success) {
        console.log('❌ Validation failed:', parseResult.error.errors);
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: parseResult.error.errors 
        });
      }
      
      console.log('✅ Supplier data validation passed:', parseResult.data);
      
      const supplier = await prodStorage.createSupplier(parseResult.data);
      console.log('✅ Supplier created successfully:', { id: supplier.id, name: supplier.name });
      
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, requirePermission('suppliers_update'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertSupplierSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const supplier = await prodStorage.updateSupplier(id, result.data);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, requirePermission('suppliers_delete'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await prodStorage.deleteSupplier(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });
}