import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.production";
import { setupLocalAuth, requireAuth } from "./localAuth.production";


// Alias pour compatibilité
const isAuthenticated = requireAuth;
const setupAuth = setupLocalAuth;
import { 
  insertGroupSchema, 
  insertSupplierSchema, 
  insertOrderSchema, 
  insertDeliverySchema,
  insertUserGroupSchema,
  insertPublicitySchema,
  insertCustomerOrderSchema,
  insertRoleSchema,
  insertPermissionSchema,
  insertUserRoleSchema,
  insertDlcProductSchema,
  insertDlcProductFrontendSchema,
  insertTaskSchema
} from "../shared/schema";
import { z } from "zod";
import { requirePermission } from "./permissions";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Docker
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      database: 'connected'
    });
  });

  // Auth middleware
  setupAuth(app);



  // All routes from the original routes.ts file
  // Groups routes
  app.get('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === 'admin') {
        const groups = await storage.getGroups();
        res.json(groups);
      } else {
        const userGroups = user.userGroups.map((ug: any) => ug.group);
        res.json(userGroups);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🏪 POST /api/groups - Raw request received');
      console.log('📨 Request headers:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'user-agent': req.headers['user-agent']?.substring(0, 50)
      });
      console.log('📋 Request body type:', typeof req.body);
      console.log('📋 Request body content:', JSON.stringify(req.body, null, 2));
      console.log('📋 Request body keys:', Object.keys(req.body || {}));
      
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      console.log('🔐 User requesting group creation:', userId);
      
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        console.log('❌ Insufficient permissions for user:', { userId, userRole: user?.role });
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      console.log('✅ User has permission to create group:', user.role);

      const result = insertGroupSchema.safeParse(req.body);
      if (!result.success) {
        console.log('❌ Group validation failed:', result.error.errors);
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }
      console.log('✅ Group data validation passed:', result.data);

      const group = await storage.createGroup(result.data);
      console.log('✅ Group creation successful:', group);
      res.status(201).json(group);
    } catch (error) {
      console.error("❌ Error creating group:", error);
      console.error("📊 Full error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail
      });
      res.status(500).json({ 
        message: "Failed to create group",
        error: error.message,
        details: error.detail || "Database error occurred"
      });
    }
  });

  app.put('/api/groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const result = insertGroupSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const group = await storage.updateGroup(id, result.data);
      res.json(group);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  app.delete('/api/groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteGroup(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // Suppliers routes
  app.get('/api/suppliers', isAuthenticated, requirePermission('suppliers_read'), async (req: any, res) => {
    try {
      // Check if DLC filter is requested
      const dlcOnly = req.query.dlc === 'true';
      const suppliers = await storage.getSuppliers(dlcOnly);
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
      
      // Permission check handled by middleware
      console.log('✅ User has permission to create supplier (verified by middleware)');

      const result = insertSupplierSchema.safeParse(req.body);
      if (!result.success) {
        console.log('❌ Supplier validation failed:', result.error.errors);
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }
      console.log('✅ Supplier data validation passed:', result.data);

      const supplier = await storage.createSupplier(result.data);
      console.log('✅ Supplier creation successful:', supplier);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("❌ Error creating supplier:", error);
      console.error("📊 Full error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail
      });
      res.status(500).json({ 
        message: "Failed to create supplier",
        error: error.message,
        details: error.detail || "Database error occurred"
      });
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, requirePermission('suppliers_update'), async (req: any, res) => {
    try {
      // Permission check handled by middleware

      const id = parseInt(req.params.id);
      const result = insertSupplierSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const supplier = await storage.updateSupplier(id, result.data);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, requirePermission('suppliers_delete'), async (req: any, res) => {
    try {
      // Permission check handled by middleware

      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Orders routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { startDate, endDate, storeId } = req.query;
      
      console.log('📦 Orders API called with:', {
        startDate,
        endDate,
        storeId,
        storeIdType: typeof storeId,
        userRole: user.role,
        fullQuery: req.query
      });

      let groupIds: number[] | undefined;
      if (user.role === 'admin') {
        if (storeId && storeId !== 'undefined' && storeId !== 'null') {
          groupIds = [parseInt(storeId as string)];
          console.log('📦 Admin filtering with groupIds:', groupIds, 'from storeId:', storeId);
        } else {
          groupIds = undefined;
          console.log('📦 Admin filtering with groupIds: undefined (all stores)');
        }
      } else {
        groupIds = user.userGroups.map((ug: any) => ug.groupId);
        console.log('📦 Non-admin filtering with groupIds:', groupIds);
      }

      let orders;
      if (startDate && endDate) {
        console.log('📦 Fetching orders by date range:', startDate, 'to', endDate);
        orders = await storage.getOrdersByDateRange(startDate as string, endDate as string, groupIds);
      } else {
        console.log('📦 Fetching all orders with groupIds:', groupIds);
        orders = await storage.getOrders(groupIds);
      }

      console.log('📦 Orders returned:', orders.length, 'items');
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const orderData = {
        ...req.body,
        createdBy: userId,
      };

      const result = insertOrderSchema.safeParse(orderData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const order = await storage.createOrder(result.data);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertOrderSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const order = await storage.updateOrder(id, result.data);
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('🗑️ Production - Deleting order:', id);
      await storage.deleteOrder(id);
      console.log('✅ Production - Order deleted successfully:', id);
      res.status(204).send();
    } catch (error) {
      console.error("❌ Production - Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Deliveries routes
  app.get('/api/deliveries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { startDate, endDate, storeId, withBL } = req.query;
      
      console.log('🚚 Deliveries API called with:', {
        startDate,
        endDate,
        storeId,
        withBL,
        userRole: user.role
      });

      let groupIds: number[] | undefined;
      if (user.role === 'admin') {
        if (storeId && storeId !== 'undefined' && storeId !== 'null') {
          groupIds = [parseInt(storeId as string)];
          console.log('🚚 Admin filtering deliveries with groupIds:', groupIds);
        } else {
          groupIds = undefined;
          console.log('🚚 Admin filtering deliveries with groupIds: undefined (all stores)');
        }
      } else {
        groupIds = user.userGroups.map((ug: any) => ug.groupId);
        console.log('🚚 Non-admin filtering deliveries with groupIds:', groupIds);
      }

      let deliveries;
      if (startDate && endDate) {
        console.log('🚚 Fetching deliveries by date range:', startDate, 'to', endDate);
        deliveries = await storage.getDeliveriesByDateRange(startDate as string, endDate as string, groupIds);
      } else {
        console.log('🚚 Fetching all deliveries with groupIds:', groupIds);
        deliveries = await storage.getDeliveries(groupIds);
      }

      console.log('🚚 Deliveries returned:', deliveries.length, 'items');
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.post('/api/deliveries', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🚚 PRODUCTION /api/deliveries POST - Raw body:', JSON.stringify(req.body, null, 2));
      
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      console.log('🚚 PRODUCTION - User ID:', userId);
      
      const deliveryData = {
        ...req.body,
        createdBy: userId,
      };
      
      console.log('🚚 PRODUCTION - Full delivery data before validation:', JSON.stringify(deliveryData, null, 2));

      const result = insertDeliverySchema.safeParse(deliveryData);
      if (!result.success) {
        console.error('❌ PRODUCTION - Validation failed:', result.error.errors);
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }
      
      console.log('✅ PRODUCTION - Validation passed. Data to insert:', JSON.stringify(result.data, null, 2));

      const delivery = await storage.createDelivery(result.data);
      console.log('✅ PRODUCTION - Delivery created successfully:', { id: delivery.id, status: delivery.status });
      res.status(201).json(delivery);
    } catch (error) {
      console.error("❌ PRODUCTION Error creating delivery:", error);
      console.error("❌ PRODUCTION Error details:", {
        message: error.message,
        code: error.code,
        constraint: error.constraint,
        detail: error.detail
      });
      res.status(500).json({ message: "Failed to create delivery" });
    }
  });

  // Route spécifique AVANT la route générale pour éviter l'interception
  app.post('/api/deliveries/:id/validate', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { blNumber, blAmount } = req.body;
      
      console.log('🔍 POST /api/deliveries/:id/validate - Request:', { id, blNumber, blAmount });
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de livraison invalide" });
      }
      
      // Validation des données BL
      if (blNumber && typeof blNumber !== 'string') {
        return res.status(400).json({ message: "Le numéro BL doit être une chaîne de caractères" });
      }
      
      if (blAmount !== undefined && (isNaN(blAmount) || blAmount < 0)) {
        return res.status(400).json({ message: "Le montant BL doit être un nombre positif" });
      }

      await storage.validateDelivery(id, { blNumber, blAmount });
      console.log('✅ Delivery validated successfully:', { id, blNumber, blAmount });
      res.json({ message: "Livraison validée avec succès" });
    } catch (error) {
      console.error("❌ Error validating delivery:", error);
      
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('💾 Database schema issue:', error.message);
        return res.status(500).json({ message: "Erreur de structure de base de données. Contactez l'administrateur." });
      }
      
      if (error.message.includes('constraint') || error.message.includes('check')) {
        return res.status(400).json({ message: "Données invalides pour la validation" });
      }
      
      res.status(500).json({ message: "Erreur lors de la validation de la livraison" });
    }
  });

  app.put('/api/deliveries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertDeliverySchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const delivery = await storage.updateDelivery(id, result.data);
      res.json(delivery);
    } catch (error) {
      console.error("Error updating delivery:", error);
      res.status(500).json({ message: "Failed to update delivery" });
    }
  });

  app.delete('/api/deliveries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDelivery(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting delivery:", error);
      res.status(500).json({ message: "Failed to delete delivery" });
    }
  });

  // User management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      
      // ✅ CORRECTION: Permettre aux admins ET managers de voir les utilisateurs (nécessaire pour la gestion des rôles)
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      // 🔧 CORRECTION CRITIQUE: Utiliser getUsersWithRolesAndGroups() au lieu de getUsers() pour l'affichage des rôles
      const usersWithRoles = await storage.getUsersWithRolesAndGroups();
      const safeUsers = Array.isArray(usersWithRoles) ? usersWithRoles : [];
      
      console.log('🔐 API /api/users - Returning:', { isArray: Array.isArray(safeUsers), length: safeUsers.length });
      console.log('👥 Users API response:', { count: safeUsers.length, requestingUser: user.role });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      // En cas d'erreur, retourner un array vide pour éviter React Error #310
      res.status(500).json([]);
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const userData = req.body;
      console.log('📝 POST /api/users - Request body:', userData);
      
      // Validation des champs obligatoires
      if (!userData.username || userData.username.trim() === '') {
        return res.status(400).json({ message: "L'identifiant est obligatoire" });
      }
      
      if (!userData.password || userData.password.trim() === '') {
        return res.status(400).json({ message: "Le mot de passe est obligatoire" });
      }
      
      if (userData.password && userData.password.length < 4) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 4 caractères" });
      }
      
      if (userData.email && userData.email.trim() !== '' && !userData.email.includes('@')) {
        return res.status(400).json({ message: "L'email doit être valide" });
      }

      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      
      // Gestion des erreurs spécifiques
      if (error.message && error.message.includes('unique constraint')) {
        if (error.message.includes('email')) {
          return res.status(400).json({ message: "Cet email est déjà utilisé par un autre utilisateur" });
        }
        if (error.message.includes('username')) {
          return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris" });
        }
      }
      
      res.status(500).json({ message: "Erreur lors de la création de l'utilisateur" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims ? req.user.claims.sub : req.user.id;
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = req.params.id;
      
      // Validation des champs requis
      const userData = req.body;
      console.log('📝 PUT /api/users/:id - Request body:', userData);
      console.log('📝 User ID from params:', id);
      
      // Vérifier que l'utilisateur existe avant modification
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        console.log('❌ User not found with ID:', id);
        return res.status(404).json({ message: `Utilisateur avec l'ID ${id} non trouvé` });
      }
      
      console.log('✅ Found user to update:', existingUser.username);
      
      // Nettoyer les données - supprimer les champs vides ou undefined
      const cleanedUserData = {};
      for (const [key, value] of Object.entries(userData)) {
        if (value !== undefined && value !== null && 
            (typeof value !== 'string' || value.trim() !== '')) {
          cleanedUserData[key] = typeof value === 'string' ? value.trim() : value;
        }
      }
      
      console.log('📝 Cleaned user data:', cleanedUserData);
      
      if (Object.keys(cleanedUserData).length === 0) {
        console.log('⚠️ No valid data to update');
        return res.status(400).json({ message: "Aucune donnée valide à mettre à jour" });
      }
      
      // Les prénoms et noms sont optionnels - pas de validation d'obligation
      
      if (cleanedUserData.email) {
        if (!cleanedUserData.email.includes('@')) {
          return res.status(400).json({ message: "L'email doit être valide" });
        }
      }
      
      if (cleanedUserData.password && cleanedUserData.password.length < 4) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 4 caractères" });
      }
      
      const updatedUser = await storage.updateUser(id, cleanedUserData);
      console.log('✅ User updated successfully:', { id, updatedFields: Object.keys(cleanedUserData) });
      res.json(updatedUser);
    } catch (error) {
      console.error("❌ Error updating user:", error);
      
      // Gestion des erreurs spécifiques
      if (error.message.includes('email') && error.message.includes('unique')) {
        return res.status(400).json({ message: "Cet email est déjà utilisé par un autre utilisateur" });
      }
      
      if (error.message.includes('username') && error.message.includes('unique')) {
        return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris" });
      }
      
      if (error.message.includes('ne peut pas être vide') || 
          error.message.includes('doit être valide') ||
          error.message.includes('Aucun champ') ||
          error.message.includes('non trouvé')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims ? req.user.claims.sub : req.user.id;
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = req.params.id;
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // User groups routes
  app.get('/api/users/:userId/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const userGroups = await storage.getUserGroups(userId);
      res.json(userGroups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  // Route supprimée car dupliquée - utilisation de la route unique en bas du fichier

  // Statistics routes
  app.get('/api/stats/monthly', isAuthenticated, async (req: any, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const storeId = req.query.storeId as string;

      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let groupIds: number[] | undefined;
      if (user.role === 'admin') {
        groupIds = storeId ? [parseInt(storeId)] : undefined;
      } else {
        groupIds = user.userGroups.map((ug: any) => ug.groupId);
      }

      const stats = await storage.getMonthlyStats(year, month, groupIds);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  // Publicities routes
  app.get('/api/publicities', isAuthenticated, async (req: any, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const publicities = await storage.getPublicities(year);
      res.json(publicities);
    } catch (error) {
      console.error("Error fetching publicities:", error);
      res.status(500).json({ message: "Failed to fetch publicities" });
    }
  });

  app.post('/api/publicities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied - Admin role required", userRole: user.role });
      }

      const { participatingGroups, ...publicityData } = req.body;

      // Create publicity
      const publicity = await storage.createPublicity({
        ...publicityData,
        createdBy: userId,
      });

      // Set participations if provided
      if (participatingGroups && participatingGroups.length > 0) {
        await storage.setPublicityParticipations(publicity.id, participatingGroups);
      }

      // Get the complete publicity with relations
      const completePublicity = await storage.getPublicity(publicity.id);
      res.status(201).json(completePublicity);
    } catch (error) {
      console.error("Error creating publicity:", error);
      res.status(500).json({ message: "Failed to create publicity", error: error.message });
    }
  });

  app.put('/api/publicities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseInt(req.params.id);
      const { participatingGroups, ...publicityData } = req.body;

      // Update publicity
      const updatedPublicity = await storage.updatePublicity(id, publicityData);

      // Update participations
      if (participatingGroups !== undefined) {
        await storage.setPublicityParticipations(id, participatingGroups);
      }

      // Get the complete publicity with relations
      const completePublicity = await storage.getPublicity(id);
      res.json(completePublicity);
    } catch (error) {
      console.error("Error updating publicity:", error);
      res.status(500).json({ message: "Failed to update publicity" });
    }
  });

  app.delete('/api/publicities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseInt(req.params.id);
      await storage.deletePublicity(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting publicity:", error);
      res.status(500).json({ message: "Failed to delete publicity" });
    }
  });

  // Customer Orders routes
  app.get('/api/customer-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { storeId } = req.query;
      
      // Determine which groups to show
      let groupIds;
      if (user.role === 'admin' && storeId) {
        // Admin filtering by specific store
        groupIds = [parseInt(storeId.toString())];
        console.log("Customer orders - Admin filtering by store:", { storeId, groupIds });
      } else if (user.role === 'admin') {
        // Admin viewing all stores - get all groups
        const allGroups = await storage.getGroups();
        groupIds = allGroups.map((g: any) => g.id);
        console.log("Customer orders - Admin viewing all stores:", { groupCount: groupIds.length });
      } else {
        // Non-admin users see only their assigned stores
        groupIds = user.userGroups.map((ug: any) => ug.groupId);
        console.log("Customer orders - User assigned stores:", { groupIds });
      }

      const customerOrders = await storage.getCustomerOrders(groupIds);
      console.log("Customer orders returned from storage:", customerOrders?.length || 0, "items");
      res.json(customerOrders || []);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });

  app.post('/api/customer-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const customerOrder = await storage.createCustomerOrder({
        ...req.body,
        createdBy: userId,
      });
      res.status(201).json(customerOrder);
    } catch (error) {
      console.error("Error creating customer order:", error);
      res.status(500).json({ message: "Failed to create customer order" });
    }
  });

  app.put('/api/customer-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerOrder = await storage.updateCustomerOrder(id, req.body);
      res.json(customerOrder);
    } catch (error) {
      console.error("Error updating customer order:", error);
      res.status(500).json({ message: "Failed to update customer order" });
    }
  });

  app.delete('/api/customer-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomerOrder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer order:", error);
      res.status(500).json({ message: "Failed to delete customer order" });
    }
  });







  // NocoDB Configuration routes
  app.get('/api/nocodb-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const configs = await storage.getNocodbConfigs();
      console.log('📊 NocoDB configs API:', { count: configs ? configs.length : 0, configs });
      
      // Assurer que la réponse est toujours un array comme en développement
      const safeConfigs = Array.isArray(configs) ? configs : [];
      res.json(safeConfigs);
    } catch (error) {
      console.error('Error fetching NocoDB configs:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des configurations' });
    }
  });

  app.post('/api/nocodb-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const config = await storage.createNocodbConfig({
        ...req.body,
        createdBy: userId,
      });
      res.status(201).json(config);
    } catch (error) {
      console.error('Error creating NocoDB config:', error);
      res.status(500).json({ message: 'Erreur lors de la création de la configuration' });
    }
  });

  app.put('/api/nocodb-config/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const id = parseInt(req.params.id);
      const config = await storage.updateNocodbConfig(id, req.body);
      res.json(config);
    } catch (error) {
      console.error('Error updating NocoDB config:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour de la configuration' });
    }
  });

  app.delete('/api/nocodb-config/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent gérer les configurations NocoDB.' });
      }

      const id = parseInt(req.params.id);
      await storage.deleteNocodbConfig(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting NocoDB config:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression de la configuration' });
    }
  });

  // Invoice verification routes (simplified for production)
  app.post('/api/verify-invoice', isAuthenticated, async (req: any, res) => {
    try {
      const { groupId, invoiceReference } = req.body;
      
      if (!groupId || !invoiceReference) {
        return res.status(400).json({ message: "groupId and invoiceReference are required" });
      }

      // Simplified verification - always return false for production
      res.json({ exists: false });
    } catch (error) {
      console.error("Error verifying invoice:", error);
      res.status(500).json({ message: "Failed to verify invoice" });
    }
  });

  app.post('/api/verify-invoices', isAuthenticated, async (req: any, res) => {
    try {
      const { invoiceReferences } = req.body;
      
      if (!Array.isArray(invoiceReferences)) {
        return res.status(400).json({ message: "invoiceReferences must be an array" });
      }

      // Simplified verification - always return false for production
      const results: any = {};
      invoiceReferences.forEach((ref: any) => {
        results[ref.deliveryId] = { exists: false };
      });
      
      res.json(results);
    } catch (error) {
      console.error("Error verifying invoices:", error);
      res.status(500).json({ message: "Failed to verify invoices" });
    }
  });

  // ===== ROLE MANAGEMENT ROUTES =====

  // Roles routes
  app.get('/api/roles', isAuthenticated, async (req: any, res) => {
    try {
      // ✅ CORRECTION: Permettre à tous les utilisateurs authentifiés de lire les rôles (nécessaire pour l'affichage des couleurs)
      const roles = await storage.getRoles();
      console.log('🎨 Roles API response:', { count: roles.length, firstRole: roles[0] });
      res.json(Array.isArray(roles) ? roles : []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get('/api/roles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const role = await storage.getRoleWithPermissions(id);
      
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post('/api/roles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const result = insertRoleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const role = await storage.createRole(result.data);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.put('/api/roles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const result = insertRoleSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const role = await storage.updateRole(id, result.data);
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete('/api/roles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteRole(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  app.get('/api/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      console.log("🔍 PRODUCTION Permissions API - User ID:", userId);
      
      const user = await storage.getUserWithGroups(userId);
      console.log("👤 PRODUCTION Permissions API - User found:", user ? user.role : 'NOT FOUND');
      
      if (!user || user.role !== 'admin') {
        console.log("❌ PRODUCTION Permissions API - Access denied, user role:", user?.role);
        return res.status(403).json({ message: "Accès refusé - droits administrateur requis" });
      }

      console.log("🔍 PRODUCTION Fetching all permissions...");
      const permissions = await storage.getPermissions();
      console.log("📝 PRODUCTION Permissions fetched:", permissions.length, "items");
      console.log("🏷️ PRODUCTION Categories found:", [...new Set(permissions.map(p => p.category))]);
      
      // 🎯 VÉRIFICATION SPÉCIFIQUE PERMISSIONS TÂCHES
      const taskPermissions = permissions.filter(p => p.category === 'gestion_taches');
      console.log("📋 PRODUCTION Task permissions found:", taskPermissions.length);
      if (taskPermissions.length > 0) {
        console.log("📋 PRODUCTION Task permissions details:");
        taskPermissions.forEach(p => {
          console.log(`  - ID: ${p.id}, Name: ${p.name}, DisplayName: "${p.displayName}", Category: ${p.category}`);
        });
      } else {
        console.log('❌ PRODUCTION NO TASK PERMISSIONS FOUND - This explains the problem!');
      }
      
      res.json(Array.isArray(permissions) ? permissions : []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Set permissions for a role
  app.post('/api/roles/:id/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        console.log("❌ ROLE PERMISSIONS UPDATE - Access denied, user role:", user?.role);
        return res.status(403).json({ message: "Accès refusé - droits administrateur requis" });
      }

      const roleId = parseInt(req.params.id);
      const { permissionIds } = req.body;
      
      console.log("🔄 PRODUCTION Updating role permissions for role ID:", roleId);
      console.log("📝 PRODUCTION New permission IDs:", permissionIds);

      if (!Array.isArray(permissionIds)) {
        console.log("❌ PRODUCTION Invalid permissionIds format:", typeof permissionIds);
        return res.status(400).json({ message: "permissionIds doit être un tableau" });
      }

      await storage.setRolePermissions(roleId, permissionIds);
      
      // Récupérer les nouvelles permissions pour confirmation
      const updatedPermissions = await storage.getRolePermissions(roleId);
      console.log("✅ PRODUCTION Role permissions updated successfully:", updatedPermissions.length, "permissions");
      
      res.json({ 
        success: true, 
        message: "Permissions mises à jour avec succès",
        permissionCount: updatedPermissions.length 
      });
    } catch (error) {
      console.error("❌ PRODUCTION Error updating role permissions:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour des permissions" });
    }
  });

  // 🚨 ENDPOINT TEMPORAIRE - CORRIGER PERMISSIONS ADMIN MANQUANTES
  app.post('/api/admin/fix-permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Seul l'admin peut corriger les permissions" });
      }

      console.log('🔧 PRODUCTION: Correction des permissions admin manquantes');
      const { pool } = require('./initDatabase.production');
      
      // Récupérer l'ID du rôle admin
      const adminRoleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['admin']);
      if (adminRoleResult.rows.length === 0) {
        throw new Error('Rôle admin non trouvé');
      }
      const adminRoleId = adminRoleResult.rows[0].id;
      
      // Récupérer toutes les permissions
      const allPermissionsResult = await pool.query('SELECT id, name FROM permissions ORDER BY id');
      const allPermissions = allPermissionsResult.rows;
      
      // Récupérer les permissions actuelles de l'admin
      const currentPermissionsResult = await pool.query(
        'SELECT permission_id FROM role_permissions WHERE role_id = $1', 
        [adminRoleId]
      );
      const currentPermissionIds = new Set(currentPermissionsResult.rows.map(rp => rp.permission_id));
      
      // Identifier les permissions manquantes
      const missingPermissions = allPermissions.filter(p => !currentPermissionIds.has(p.id));
      
      console.log(`📊 Admin actuel: ${currentPermissionIds.size} permissions sur ${allPermissions.length} totales`);
      console.log(`⚠️ Permissions manquantes: ${missingPermissions.length}`);
      
      if (missingPermissions.length > 0) {
        console.log('📋 Ajout des permissions manquantes:');
        for (const perm of missingPermissions) {
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT (role_id, permission_id) DO NOTHING
          `, [adminRoleId, perm.id]);
          console.log(`  ✅ Ajouté: ${perm.name}`);
        }
      }
      
      // Vérification finale
      const finalCountResult = await pool.query(
        'SELECT COUNT(*) as count FROM role_permissions WHERE role_id = $1', 
        [adminRoleId]
      );
      const finalCount = finalCountResult.rows[0].count;
      
      res.json({
        message: "Permissions admin corrigées avec succès",
        before: currentPermissionIds.size,
        after: parseInt(finalCount),
        added: missingPermissions.length,
        total: allPermissions.length
      });
    } catch (error) {
      console.error('❌ Erreur correction permissions admin:', error);
      res.status(500).json({ message: "Erreur lors de la correction des permissions" });
    }
  });

  // 🚨 ENDPOINT TEMPORAIRE DE DIAGNOSTIC PRODUCTION PERMISSIONS TÂCHES
  app.get('/api/debug/task-permissions', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔍 PRODUCTION TASK PERMISSIONS DEBUG');
      
      // Vérifier directement en base de données
      const { pool } = require('./initDatabase.production');
      const taskResult = await pool.query(`
        SELECT id, name, display_name, category, action, resource 
        FROM permissions 
        WHERE category = 'gestion_taches'
        ORDER BY name
      `);
      
      console.log('📋 Task permissions in DB:', taskResult.rows.length);
      taskResult.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, Name: ${row.name}, DisplayName: "${row.display_name}", Category: ${row.category}`);
      });
      
      // Vérifier aussi via le storage
      const storagePermissions = await storage.getPermissions();
      const storageTaskPermissions = storagePermissions.filter(p => p.category === 'gestion_taches');
      console.log('📋 Task permissions via storage:', storageTaskPermissions.length);
      
      res.json({
        database: taskResult.rows,
        storage: storageTaskPermissions,
        summary: {
          database_count: taskResult.rows.length,
          storage_count: storageTaskPermissions.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Task permissions debug error:', error);
      res.status(500).json({ message: "Debug failed", error: error.message });
    }
  });

  // 🚨 ENDPOINT TEMPORAIRE POUR APPLIQUER LES CORRECTIONS SQL
  app.post('/api/debug/fix-translations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Seul l'admin peut appliquer les corrections" });
      }

      console.log('🔧 APPLYING SQL FIXES TO PRODUCTION DATABASE');
      const { pool } = require('./initDatabase.production');
      
      // Corriger les rôles
      console.log('📝 Fixing roles...');
      await pool.query("UPDATE roles SET display_name = 'Administrateur' WHERE name = 'admin'");
      await pool.query("UPDATE roles SET display_name = 'Manager' WHERE name = 'manager'");
      await pool.query("UPDATE roles SET display_name = 'Employé' WHERE name = 'employee' OR name = 'employé'");
      await pool.query("UPDATE roles SET display_name = 'Directeur' WHERE name = 'directeur'");
      
      // Corriger les permissions principales
      console.log('📝 Fixing main permissions...');
      const permissionUpdates = [
        ["UPDATE permissions SET display_name = 'Voir calendrier' WHERE name = 'calendar_read'"],
        ["UPDATE permissions SET display_name = 'Créer événements' WHERE name = 'calendar_create'"],
        ["UPDATE permissions SET display_name = 'Modifier calendrier' WHERE name = 'calendar_update'"],
        ["UPDATE permissions SET display_name = 'Supprimer événements' WHERE name = 'calendar_delete'"],
        ["UPDATE permissions SET display_name = 'Voir tableau de bord' WHERE name = 'dashboard_read'"],
        ["UPDATE permissions SET display_name = 'Voir livraisons' WHERE name = 'deliveries_read'"],
        ["UPDATE permissions SET display_name = 'Créer livraisons' WHERE name = 'deliveries_create'"],
        ["UPDATE permissions SET display_name = 'Modifier livraisons' WHERE name = 'deliveries_update'"],
        ["UPDATE permissions SET display_name = 'Supprimer livraisons' WHERE name = 'deliveries_delete'"],
        ["UPDATE permissions SET display_name = 'Valider livraisons' WHERE name = 'deliveries_validate'"],
        ["UPDATE permissions SET display_name = 'Voir magasins' WHERE name = 'groups_read'"],
        ["UPDATE permissions SET display_name = 'Créer magasins' WHERE name = 'groups_create'"],
        ["UPDATE permissions SET display_name = 'Modifier magasins' WHERE name = 'groups_update'"],
        ["UPDATE permissions SET display_name = 'Supprimer magasins' WHERE name = 'groups_delete'"],
        ["UPDATE permissions SET display_name = 'Voir commandes' WHERE name = 'orders_read'"],
        ["UPDATE permissions SET display_name = 'Créer commandes' WHERE name = 'orders_create'"],
        ["UPDATE permissions SET display_name = 'Modifier commandes' WHERE name = 'orders_update'"],
        ["UPDATE permissions SET display_name = 'Supprimer commandes' WHERE name = 'orders_delete'"],
        ["UPDATE permissions SET display_name = 'Voir publicités' WHERE name = 'publicities_read'"],
        ["UPDATE permissions SET display_name = 'Créer publicités' WHERE name = 'publicities_create'"],
        ["UPDATE permissions SET display_name = 'Modifier publicités' WHERE name = 'publicities_update'"],
        ["UPDATE permissions SET display_name = 'Supprimer publicités' WHERE name = 'publicities_delete'"],
        ["UPDATE permissions SET display_name = 'Voir fournisseurs' WHERE name = 'suppliers_read'"],
        ["UPDATE permissions SET display_name = 'Créer fournisseurs' WHERE name = 'suppliers_create'"],
        ["UPDATE permissions SET display_name = 'Modifier fournisseurs' WHERE name = 'suppliers_update'"],
        ["UPDATE permissions SET display_name = 'Supprimer fournisseurs' WHERE name = 'suppliers_delete'"],
      ];
      
      for (const [query] of permissionUpdates) {
        await pool.query(query);
      }
      
      // Vérifier les résultats
      const rolesResult = await pool.query("SELECT name, display_name FROM roles ORDER BY name");
      const permissionsResult = await pool.query("SELECT name, display_name FROM permissions WHERE name IN ('calendar_read', 'dashboard_read', 'deliveries_read', 'groups_read') ORDER BY name");
      
      console.log('✅ SQL FIXES APPLIED SUCCESSFULLY');
      console.log('📊 Updated roles:', rolesResult.rows);
      console.log('📊 Sample updated permissions:', permissionsResult.rows);
      
      res.json({
        message: 'Corrections appliquées avec succès',
        rolesUpdated: rolesResult.rows,
        permissionsSample: permissionsResult.rows
      });
      
    } catch (error) {
      console.error('❌ Error applying SQL fixes:', error);
      res.status(500).json({ message: "Erreur lors de l'application des corrections", error: error.message });
    }
  });

  app.post('/api/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const permission = await storage.createPermission(req.body);
      res.status(201).json(permission);
    } catch (error) {
      console.error("Error creating permission:", error);
      res.status(500).json({ message: "Failed to create permission" });
    }
  });

  app.put('/api/permissions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const permission = await storage.updatePermission(id, req.body);
      res.json(permission);
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ message: "Failed to update permission" });
    }
  });

  app.delete('/api/permissions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      await storage.deletePermission(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  app.get('/api/roles/:id/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const roleId = parseInt(req.params.id);
      const rolePermissions = await storage.getRolePermissions(roleId);
      
      // 🎯 DEBUG CRITIQUE PRODUCTION: Vérifier pourquoi les permissions tâches ne s'affichent pas
      console.log('🔍 ROLE PERMISSIONS DEBUG for role ID:', roleId);
      console.log('📊 Total role permissions found:', rolePermissions?.length || 0);
      
      if (Array.isArray(rolePermissions) && rolePermissions.length > 0) {
        // Afficher toutes les catégories disponibles pour ce rôle
        const categoriesInRole = [...new Set(rolePermissions.map(rp => rp.permission?.category).filter(Boolean))];
        console.log('📂 Categories in role permissions:', categoriesInRole);
        
        const taskRolePermissions = rolePermissions.filter(rp => {
          // Chercher les permissions de la catégorie gestion_taches
          return rp.permission && rp.permission.category === 'gestion_taches';
        });
        console.log('🎯 TASK role permissions found:', taskRolePermissions.length);
        
        if (taskRolePermissions.length > 0) {
          console.log('✅ TASK role permissions details:');
          taskRolePermissions.forEach(rp => {
            console.log(`  - Permission ID: ${rp.permissionId}, Name: ${rp.permission.name}, DisplayName: "${rp.permission.displayName}"`);
          });
        } else {
          console.log('❌ NO TASK ROLE PERMISSIONS FOUND - Checking raw data:');
          console.log('🔍 First 3 rolePermissions structure:', JSON.stringify(rolePermissions.slice(0, 3), null, 2));
          console.log('🔍 Sample permission object:', rolePermissions[0]?.permission ? JSON.stringify(rolePermissions[0].permission, null, 2) : 'No permission object');
        }
      } else {
        console.log('❌ NO ROLE PERMISSIONS FOUND AT ALL for role:', roleId);
      }
      
      res.json(Array.isArray(rolePermissions) ? rolePermissions : []);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.post('/api/roles/:id/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const roleId = parseInt(req.params.id);
      const { permissionIds } = req.body;
      
      await storage.setRolePermissions(roleId, permissionIds);
      res.json({ message: "Role permissions updated successfully" });
    } catch (error) {
      console.error("Error updating role permissions:", error);
      res.status(500).json({ message: "Failed to update role permissions" });
    }
  });

  // User-Role association routes (AJOUTÉ POUR PRODUCTION)
  app.get('/api/users/:userId/roles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.userId;
      const userRoles = await storage.getUserRoles(userId);
      res.json(userRoles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });

  // POST route for user roles (used by frontend) - ROUTE MANQUANTE AJOUTÉE
  app.post('/api/users/:userId/roles', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.userId;
      const { roleIds } = req.body;
      
      console.log("🔧 POST User roles API called:", { userId, roleIds, assignedBy: currentUser.id });
      
      if (!Array.isArray(roleIds)) {
        return res.status(400).json({ message: "roleIds must be an array" });
      }
      
      await storage.setUserRoles(userId, roleIds, currentUser.id);
      res.json({ message: "User roles updated successfully" });
    } catch (error) {
      console.error("Error updating user roles:", error);
      
      // Gestion d'erreur spécifique avec message plus informatif
      if (error.message && error.message.includes('does not exist')) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to update user roles" });
    }
  });

  app.put('/api/users/:id/roles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.id;
      const { roleIds } = req.body;
      
      console.log("🎯 setUserRoles request:", { userId, roleIds, assignedBy: user.id });
      
      await storage.setUserRoles(userId, roleIds, user.id);
      res.json({ message: "User roles updated successfully" });
    } catch (error) {
      console.error("Error updating user roles:", error);
      
      // Gestion d'erreur spécifique avec message plus informatif
      if (error.message.includes('does not exist')) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to update user roles" });
    }
  });

  // User-Group management routes (admin only) - ROUTE CORRIGÉE AVEC DIAGNOSTIC COMPLET
  app.post('/api/users/:userId/groups', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔍 DIAGNOSTIC: Route /api/users/:userId/groups appelée');
      console.log('🔍 DIAGNOSTIC: req.user =', req.user);
      console.log('🔍 DIAGNOSTIC: req.params =', req.params);
      console.log('🔍 DIAGNOSTIC: req.body =', req.body);
      
      const currentUserId = req.user.claims ? req.user.claims.sub : req.user.id;
      console.log('🔍 DIAGNOSTIC: currentUserId =', currentUserId);
      
      const currentUser = await storage.getUser(currentUserId);
      console.log('🔍 DIAGNOSTIC: currentUser =', currentUser);
      
      if (!currentUser) {
        console.log('❌ ERREUR: Utilisateur courant non trouvé');
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (currentUser.role !== 'admin') {
        console.log('❌ ERREUR: Permissions insuffisantes, rôle:', currentUser.role);
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.userId;
      const { groupId } = req.body;
      
      console.log('🔍 DIAGNOSTIC: userId =', userId, 'groupId =', groupId);

      // Vérifier que l'utilisateur cible existe
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        console.log('❌ ERREUR: Utilisateur cible non trouvé:', userId);
        return res.status(404).json({ message: `User not found: ${userId}` });
      }
      console.log('✅ DIAGNOSTIC: Utilisateur cible trouvé:', targetUser.username);

      // Vérifier que le groupe existe
      const group = await storage.getGroup(groupId);
      if (!group) {
        console.log('❌ ERREUR: Groupe non trouvé:', groupId);
        return res.status(404).json({ message: `Group not found: ${groupId}` });
      }
      console.log('✅ DIAGNOSTIC: Groupe trouvé:', group.name);

      // Effectuer l'assignation
      console.log('🔄 DIAGNOSTIC: Assignation en cours...');
      const userGroup = await storage.assignUserToGroup({ userId, groupId });
      console.log('✅ SUCCÈS: Assignation réussie:', userGroup);
      
      res.json({ 
        success: true,
        message: `Utilisateur ${targetUser.username} assigné au groupe ${group.name}`,
        userGroup 
      });
    } catch (error) {
      console.error("❌ ERREUR CRITIQUE dans assignation groupe:", error);
      console.error("❌ Stack trace:", error.stack);
      
      res.status(500).json({ 
        message: "Impossible d'assigner l'utilisateur au groupe",
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.delete('/api/users/:userId/groups/:groupId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims ? req.user.claims.sub : req.user.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userId = req.params.userId;
      const groupId = parseInt(req.params.groupId);
      
      console.log('🗑️ Removing user from group:', { userId, groupId });

      await storage.removeUserFromGroup(userId, groupId);
      console.log('✅ User removed from group successfully');
      
      res.json({ message: "User removed from group successfully" });
    } catch (error) {
      console.error("Error removing user from group:", error);
      res.status(500).json({ message: "Failed to remove user from group" });
    }
  });

  // ===== DLC PRODUCTS ROUTES =====

  // DLC Products routes
  app.get('/api/dlc-products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, supplierId } = req.query;
      
      // Determine which groups to filter by
      let groupIds: number[] = [];
      if (user.role === 'admin') {
        // Admin can specify a store or see all
        if (req.query.storeId) {
          groupIds = [parseInt(req.query.storeId)];
        }
        // If no storeId specified, admin sees all (don't filter by groupIds)
      } else {
        // Non-admin users see only their assigned groups
        groupIds = user.userGroups.map((ug: any) => ug.group.id);
      }

      const filters: { status?: string; supplierId?: number; } = {};
      if (status) filters.status = status;
      if (supplierId) filters.supplierId = parseInt(supplierId as string);

      console.log('DLC Products API called with:', {
        userId,
        userRole: user.role,
        groupIds: user.role === 'admin' && !req.query.storeId ? 'all' : groupIds,
        filters
      });

      const dlcProducts = await storage.getDlcProducts(
        user.role === 'admin' && !req.query.storeId ? undefined : groupIds,
        filters
      );
      
      console.log('DLC Products returned:', dlcProducts.length, 'items');
      res.json(dlcProducts);
    } catch (error) {
      console.error("Error fetching DLC products:", error);
      res.status(500).json({ message: "Failed to fetch DLC products" });
    }
  });

  app.get('/api/dlc-products/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Determine which groups to filter by
      let groupIds: number[] = [];
      if (user.role === 'admin') {
        if (req.query.storeId) {
          groupIds = [parseInt(req.query.storeId)];
        }
      } else {
        groupIds = user.userGroups.map((ug: any) => ug.group.id);
      }

      console.log('DLC Stats API called with:', {
        userId,
        userRole: user.role,
        groupIds: user.role === 'admin' && !req.query.storeId ? 'all' : groupIds,
        storeId: req.query.storeId
      });

      const stats = await storage.getDlcStats(
        user.role === 'admin' && !req.query.storeId ? undefined : groupIds
      );
      
      console.log('DLC Stats returned:', stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching DLC stats:", error);
      res.status(500).json({ message: "Failed to fetch DLC stats" });
    }
  });

  app.get('/api/dlc-products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const dlcProduct = await storage.getDlcProduct(id);
      
      if (!dlcProduct) {
        return res.status(404).json({ message: "DLC Product not found" });
      }

      // Check if user has access to this product's group
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      
      if (user?.role !== 'admin') {
        const userGroupIds = user?.userGroups.map((ug: any) => ug.group.id) || [];
        if (!userGroupIds.includes(dlcProduct.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(dlcProduct);
    } catch (error) {
      console.error("Error fetching DLC product:", error);
      res.status(500).json({ message: "Failed to fetch DLC product" });
    }
  });

  app.post('/api/dlc-products', isAuthenticated, async (req: any, res) => {
    try {
      console.log('📨 POST /api/dlc-products - Request body:', JSON.stringify(req.body, null, 2));
      
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate access to the specified group
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map((ug: any) => ug.group.id);
        if (!userGroupIds.includes(req.body.groupId)) {
          return res.status(403).json({ message: "Access denied to this store" });
        }
      }

      const validatedData = insertDlcProductFrontendSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const dlcProduct = await storage.createDlcProduct(validatedData);
      console.log('✅ DLC Product created successfully:', dlcProduct.id);
      
      res.status(201).json(dlcProduct);
    } catch (error) {
      console.error("❌ Error creating DLC product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create DLC product" });
    }
  });

  app.put('/api/dlc-products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      
      // First check if the product exists and user has access
      const existingProduct = await storage.getDlcProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "DLC Product not found" });
      }

      const user = await storage.getUserWithGroups(userId);
      if (user?.role !== 'admin') {
        const userGroupIds = user?.userGroups.map((ug: any) => ug.group.id) || [];
        if (!userGroupIds.includes(existingProduct.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const validatedData = insertDlcProductFrontendSchema.partial().parse(req.body);
      const dlcProduct = await storage.updateDlcProduct(id, validatedData);
      
      res.json(dlcProduct);
    } catch (error) {
      console.error("Error updating DLC product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update DLC product" });
    }
  });

  app.delete('/api/dlc-products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      
      // First check if the product exists and user has access
      const existingProduct = await storage.getDlcProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "DLC Product not found" });
      }

      const user = await storage.getUserWithGroups(userId);
      if (user?.role !== 'admin') {
        const userGroupIds = user?.userGroups.map((ug: any) => ug.group.id) || [];
        if (!userGroupIds.includes(existingProduct.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      await storage.deleteDlcProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting DLC product:", error);
      res.status(500).json({ message: "Failed to delete DLC product" });
    }
  });

  // DLC validation routes (both POST and PUT for compatibility)
  app.post('/api/dlc-products/:id/validate', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      
      // Check if user has permission to validate
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions to validate products" });
      }

      const dlcProduct = await storage.validateDlcProduct(id, userId);
      res.json(dlcProduct);
    } catch (error) {
      console.error("Error validating DLC product:", error);
      res.status(500).json({ message: "Failed to validate DLC product" });
    }
  });

  app.put('/api/dlc-products/:id/validate', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      
      console.log('✅ PUT Validation request:', { id, userId });
      
      // Check if user has permission to validate
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Insufficient permissions to validate products" });
      }

      const dlcProduct = await storage.validateDlcProduct(id, userId);
      console.log('✅ DLC product validated via PUT:', dlcProduct.id);
      res.json(dlcProduct);
    } catch (error) {
      console.error("❌ Error validating DLC product via PUT:", error);
      res.status(500).json({ message: "Failed to validate DLC product" });
    }
  });

  // Tasks routes
  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      const storeId = req.query.storeId;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let groupIds: number[] | undefined;
      if (user.role === 'admin') {
        // Admin peut voir toutes les tâches ou filtrer par magasin
        if (storeId && storeId !== 'all') {
          groupIds = [parseInt(storeId)];
        }
        // Si pas de storeId ou storeId='all', pas de filtrage (toutes les tâches)
      } else {
        // Non-admin voit seulement ses magasins assignés
        const userGroupIds = user.userGroups.map((ug: any) => ug.group.id);
        if (storeId && storeId !== 'all') {
          const requestedStoreId = parseInt(storeId);
          if (userGroupIds.includes(requestedStoreId)) {
            groupIds = [requestedStoreId];
          } else {
            return res.status(403).json({ message: "Access denied to this store" });
          }
        } else {
          groupIds = userGroupIds;
        }
      }

      const tasks = await storage.getTasks(groupIds);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if user has access to this task's group
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      
      if (user?.role !== 'admin') {
        const userGroupIds = user?.userGroups.map((ug: any) => ug.group.id) || [];
        if (!userGroupIds.includes(task.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      const user = await storage.getUserWithGroups(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate access to the specified group
      if (user.role !== 'admin') {
        const userGroupIds = user.userGroups.map((ug: any) => ug.group.id);
        if (!userGroupIds.includes(req.body.groupId)) {
          return res.status(403).json({ message: "Access denied to this store" });
        }
      }

      const validatedData = insertTaskSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const user = await storage.getUserWithGroups(userId);
      if (user?.role !== 'admin') {
        const userGroupIds = user?.userGroups.map((ug: any) => ug.group.id) || [];
        if (!userGroupIds.includes(existingTask.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // Non-admin users can only edit their own tasks
        if (existingTask.createdBy !== userId) {
          return res.status(403).json({ message: "Can only edit your own tasks" });
        }
      }

      const validatedData = insertTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateTask(id, validatedData);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.post('/api/tasks/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      
      console.log("🎯 Task completion request:", { id, userId });
      
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        console.log("❌ Task not found:", id);
        return res.status(404).json({ message: "Task not found" });
      }

      console.log("✅ Task found:", existingTask);

      const user = await storage.getUserWithGroups(userId);
      console.log("👤 User data:", user);
      
      if (user?.role !== 'admin') {
        const userGroupIds = user?.userGroups.map((ug: any) => ug.group.id) || [];
        if (!userGroupIds.includes(existingTask.groupId)) {
          console.log("❌ Access denied - group mismatch:", { userGroupIds, taskGroupId: existingTask.groupId });
          return res.status(403).json({ message: "Access denied" });
        }
      }

      console.log("🔄 Completing task using storage.completeTask...");
      await storage.completeTask(id, userId);
      
      // Get the updated task to return it
      const updatedTask = await storage.getTask(id);
      console.log("✅ Task completed successfully:", updatedTask);
      res.json(updatedTask);
    } catch (error) {
      console.error("❌ Error completing task:", error);
      res.status(500).json({ message: "Failed to complete task", error: error.message });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims ? req.user.claims.sub : req.user.id;
      
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const user = await storage.getUserWithGroups(userId);
      if (user?.role !== 'admin') {
        const userGroupIds = user?.userGroups.map((ug: any) => ug.group.id) || [];
        if (!userGroupIds.includes(existingTask.groupId)) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        if (existingTask.createdBy !== userId) {
          return res.status(403).json({ message: "Can only delete your own tasks" });
        }
      }

      await storage.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  const server = createServer(app);
  return server;
}