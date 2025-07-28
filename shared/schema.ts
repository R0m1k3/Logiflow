import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - supports both Replit Auth and local auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique(), // For simple login
  email: varchar("email").unique(),
  name: varchar("name"), // Single name field for compatibility
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // For local auth only
  role: varchar("role").notNull().default("employee"), // Legacy role field for compatibility
  passwordChanged: boolean("password_changed").default(false), // Track if default password was changed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Store/Group management
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  color: varchar("color").notNull(), // hex color code
  // Configuration NocoDB pour vérification automatique des factures
  nocodbConfigId: integer("nocodb_config_id"), // Référence vers la configuration NocoDB
  nocodbTableId: varchar("nocodb_table_id"), // ID de la table dans NocoDB
  nocodbTableName: varchar("nocodb_table_name"), // Nom de la table dans NocoDB
  invoiceColumnName: varchar("invoice_column_name").default("Ref Facture"), // Nom de la colonne contenant les références de facture
  // Nouveaux champs pour rapprochement par N° BL
  nocodbBlColumnName: varchar("nocodb_bl_column_name").default("Numéro de BL"), // Nom de la colonne N° BL dans NocoDB
  nocodbAmountColumnName: varchar("nocodb_amount_column_name").default("Montant HT"), // Nom de la colonne Montant HT dans NocoDB
  nocodbSupplierColumnName: varchar("nocodb_supplier_column_name").default("Fournisseur"), // Nom de la colonne Fournisseur dans NocoDB
  // Configuration webhook pour factures/avoirs
  webhookUrl: varchar("webhook_url").default(""), // URL du webhook pour ce groupe
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-Group assignments (many-to-many)
export const userGroups = pgTable("user_groups", {
  userId: varchar("user_id").notNull(),
  groupId: integer("group_id").notNull(),
  assignedBy: varchar("assigned_by"),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  contact: varchar("contact"),
  phone: varchar("phone"),
  hasDlc: boolean("has_dlc").default(false), // Coche DLC pour la gestion DLC
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  groupId: integer("group_id").notNull(),
  plannedDate: date("planned_date").notNull(),
  quantity: integer("quantity"), // Optional - will be set when delivery is linked
  unit: varchar("unit"), // Optional - 'palettes' or 'colis'
  status: varchar("status").notNull().default("pending"), // pending, planned, delivered
  notes: text("notes"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deliveries
export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id"), // optional link to order
  supplierId: integer("supplier_id").notNull(),
  groupId: integer("group_id").notNull(),
  scheduledDate: date("scheduled_date").notNull(),
  deliveredDate: timestamp("delivered_date"),
  quantity: integer("quantity").notNull(),
  unit: varchar("unit").notNull(), // 'palettes' or 'colis'
  status: varchar("status").notNull().default("planned"), // planned, delivered
  notes: text("notes"),
  // Champs pour le rapprochement BL/Factures
  blNumber: varchar("bl_number"), // Numéro de Bon de Livraison
  blAmount: decimal("bl_amount", { precision: 10, scale: 2 }), // Montant BL
  invoiceReference: varchar("invoice_reference"), // Référence facture
  invoiceAmount: decimal("invoice_amount", { precision: 10, scale: 2 }), // Montant facture
  reconciled: boolean("reconciled").default(false), // Rapprochement effectué
  validatedAt: timestamp("validated_at"), // Date de validation de la livraison
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Publicities
export const publicities = pgTable("publicities", {
  id: serial("id").primaryKey(),
  pubNumber: varchar("pub_number").notNull().unique(),
  designation: text("designation").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  year: integer("year").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Publicity Participations
export const publicityParticipations = pgTable("publicity_participations", {
  publicityId: integer("publicity_id").notNull(),
  groupId: integer("group_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.publicityId, table.groupId] })
}));

// Roles - Dynamic role management
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  color: varchar("color").default("#6b7280"), // Couleur d'affichage
  isSystem: boolean("is_system").default(false), // Rôles système non supprimables
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Permissions - Available permissions in the system
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // dashboard, orders, deliveries, users, etc.
  action: varchar("action").notNull(), // read, create, update, delete, validate
  resource: varchar("resource").notNull(), // orders, deliveries, users, etc.
  isSystem: boolean("is_system").default(true), // Permissions système
  createdAt: timestamp("created_at").defaultNow(),
});

// Role Permissions - Many to many relationship
export const rolePermissions = pgTable("role_permissions", {
  roleId: integer("role_id").notNull(),
  permissionId: integer("permission_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] })
}));

// NocoDB configuration globale (une seule instance NocoDB partagée)
export const nocodbConfig = pgTable("nocodb_config", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // Nom de la configuration
  baseUrl: varchar("base_url").notNull(), // URL de l'instance NocoDB
  projectId: varchar("project_id").notNull(), // NocoDB Project ID
  apiToken: varchar("api_token").notNull(), // Personal API Token
  description: text("description"), // Description de la configuration
  isActive: boolean("is_active").default(true), // Configuration active ou non
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer Orders (Commandes Client)
export const customerOrders = pgTable("customer_orders", {
  id: serial("id").primaryKey(),
  // Information de commande
  orderTaker: varchar("order_taker").notNull(), // Qui a pris la commande
  customerName: varchar("customer_name").notNull(), // Nom du client
  customerPhone: varchar("customer_phone").notNull(), // N° de téléphone
  customerEmail: varchar("customer_email"), // Email du client (optionnel)
  
  // Information produit
  productDesignation: text("product_designation").notNull(), // Désignation du produit
  productReference: varchar("product_reference"), // Référence
  gencode: varchar("gencode").notNull(), // Code à barres (obligatoire)
  quantity: integer("quantity").notNull().default(1), // Quantité commandée
  supplierId: integer("supplier_id").notNull(), // Fournisseur
  
  // Statuts
  status: varchar("status").notNull().default("En attente de Commande"), // Statut du produit
  
  // Options financières
  deposit: decimal("deposit", { precision: 10, scale: 2 }).default("0.00"), // Acompte
  isPromotionalPrice: boolean("is_promotional_price").default(false), // Prix publicité
  
  // Communication client
  customerNotified: boolean("customer_notified").default(false), // Client appelé
  
  // Notes additionnelles
  notes: text("notes"), // Notes sur la commande
  
  // Métadonnées
  groupId: integer("group_id").notNull(), // Magasin
  createdBy: varchar("created_by").notNull(), // Créateur
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Roles - Many to many relationship (supports multiple roles per user)
export const userRoles = pgTable("user_roles", {
  userId: varchar("user_id").notNull(),
  roleId: integer("role_id").notNull(),
  assignedBy: varchar("assigned_by").notNull(), // Who assigned this role
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] })
}));

// DLC Products (Date Limite de Consommation)
export const dlcProducts = pgTable("dlc_products", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // Nom du produit (colonne obligatoire en base)
  productName: varchar("product_name").notNull(), // Nom du produit (nouveau format)
  gencode: varchar("gencode"), // Code-barres/gencode EAN13 (optionnel)
  supplierId: integer("supplier_id").notNull(), // ID du fournisseur
  groupId: integer("group_id").notNull(), // ID du magasin/groupe
  expiryDate: date("expiry_date").notNull(), // Date limite de consommation
  dateType: varchar("date_type").notNull().default("dlc"), // Type: dlc, ddm, dluo
  quantity: integer("quantity").notNull().default(1), // Quantité
  unit: varchar("unit").notNull().default("unité"), // Unité (fixe par défaut)
  location: varchar("location").notNull().default("Magasin"), // Emplacement (fixe par défaut)
  alertThreshold: integer("alert_threshold").notNull().default(15), // Seuil d'alerte fixe à 15 jours
  status: varchar("status").notNull().default("en_cours"), // Statut: en_cours, expires_soon, expires, valides
  notes: text("notes"), // Notes (optionnel)
  createdBy: varchar("created_by").notNull(), // Créateur
  validatedBy: varchar("validated_by"), // Validé par (optionnel)
  validatedAt: timestamp("validated_at"), // Date de validation (optionnel)
  createdAt: timestamp("created_at").defaultNow(), // Date de création
  updatedAt: timestamp("updated_at").defaultNow(), // Date de mise à jour
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(), // Titre de la tâche (requis)
  description: text("description"), // Description de la tâche (optionnel)
  startDate: timestamp("start_date"), // Date de début (optionnel)
  dueDate: timestamp("due_date"), // Date d'échéance (optionnel)
  priority: varchar("priority").notNull().default("medium"), // low, medium, high
  status: varchar("status").notNull().default("pending"), // pending, completed
  assignedTo: text("assigned_to").notNull(), // Utilisateur responsable (champ libre)
  createdBy: varchar("created_by").notNull(), // Utilisateur créateur
  groupId: integer("group_id").notNull(), // Magasin/groupe associé
  completedAt: timestamp("completed_at"), // Date de completion
  completedBy: varchar("completed_by"), // Utilisateur qui a complété la tâche
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Database backups table
export const databaseBackups = pgTable("database_backups", {
  id: varchar("id").primaryKey().notNull(),
  filename: varchar("filename").notNull(),
  description: text("description"),
  size: integer("size").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
  tablesCount: integer("tables_count").default(0),
  status: varchar("status").default("creating"), // 'creating', 'completed', 'failed'
});

// Invoice Verifications - Cache des vérifications NocoDB pour optimisation
export const invoiceVerifications = pgTable("invoice_verifications", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").notNull(), // ID de la livraison
  groupId: integer("group_id").notNull(), // ID du magasin
  invoiceReference: varchar("invoice_reference").notNull(), // Référence facture vérifiée
  supplierName: varchar("supplier_name"), // Nom du fournisseur
  
  // Résultats de vérification NocoDB
  exists: boolean("exists").notNull(), // true si facture trouvée
  matchType: varchar("match_type"), // BL_NUMBER, SUPPLIER_AMOUNT, SUPPLIER_DATE, NONE
  
  // Métadonnées de vérification
  verifiedAt: timestamp("verified_at").defaultNow(), // Quand la vérification a été faite
  isValid: boolean("is_valid").default(true), // false si vérification expirée/invalide
  
  // Pour éviter re-vérifications inutiles
  lastCheckedAt: timestamp("last_checked_at").defaultNow(),
}, (table) => ({
  // Index pour recherche rapide par livraison
  deliveryIdx: index("invoice_verifications_delivery_idx").on(table.deliveryId),
  // Index pour recherche par référence facture (éviter doublons)
  invoiceRefIdx: index("invoice_verifications_invoice_ref_idx").on(table.invoiceReference, table.groupId),
}));

// 🚀 INVOICE VERIFICATION CACHE: Performance optimization table for high-volume databases
export const invoiceVerificationCache = pgTable("invoice_verification_cache", {
  id: serial("id").primaryKey(),
  cacheKey: varchar("cache_key").notNull().unique(), // Format: "groupId:invoiceRef:supplierName"
  groupId: integer("group_id").notNull(),
  invoiceReference: varchar("invoice_reference").notNull(),
  supplierName: varchar("supplier_name"),
  // Cached verification result
  exists: boolean("exists").notNull(),
  matchType: varchar("match_type").notNull(), // "EXACT", "APPROXIMATE", "NONE", "ERROR"
  errorMessage: text("error_message"),
  // Cache metadata
  cacheHit: boolean("cache_hit").default(false),
  apiCallTime: integer("api_call_time"), // Time taken for original API call in ms
  expiresAt: timestamp("expires_at").notNull(), // Cache expiration time
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Index pour recherche rapide par clé de cache
  cacheKeyIdx: index("invoice_verification_cache_key_idx").on(table.cacheKey),
  // Index pour recherche par groupe et référence facture
  groupInvoiceIdx: index("invoice_verification_cache_group_invoice_idx").on(table.groupId, table.invoiceReference),
  // Index pour nettoyage des entrées expirées
  expiresAtIdx: index("invoice_verification_cache_expires_at_idx").on(table.expiresAt),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userGroups: many(userGroups),
  userRoles: many(userRoles),
  createdOrders: many(orders),
  createdDeliveries: many(deliveries),
  createdPublicities: many(publicities),
  createdCustomerOrders: many(customerOrders),
  createdDlcProducts: many(dlcProducts),
  createdTasks: many(tasks),
  assignedTasks: many(tasks),
  createdBackups: many(databaseBackups),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  userGroups: many(userGroups),
  orders: many(orders),
  deliveries: many(deliveries),
  publicityParticipations: many(publicityParticipations),
  customerOrders: many(customerOrders),
  dlcProducts: many(dlcProducts),
  tasks: many(tasks),
  nocodbConfig: one(nocodbConfig, {
    fields: [groups.nocodbConfigId],
    references: [nocodbConfig.id],
  }),
}));

export const userGroupsRelations = relations(userGroups, ({ one }) => ({
  user: one(users, {
    fields: [userGroups.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [userGroups.groupId],
    references: [groups.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  orders: many(orders),
  deliveries: many(deliveries),
  dlcProducts: many(dlcProducts),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [orders.supplierId],
    references: [suppliers.id],
  }),
  group: one(groups, {
    fields: [orders.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  deliveries: many(deliveries),
}));

export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
  supplier: one(suppliers, {
    fields: [deliveries.supplierId],
    references: [suppliers.id],
  }),
  group: one(groups, {
    fields: [deliveries.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [deliveries.createdBy],
    references: [users.id],
  }),
  verifications: many(invoiceVerifications),
}));

export const publicitiesRelations = relations(publicities, ({ one, many }) => ({
  creator: one(users, {
    fields: [publicities.createdBy],
    references: [users.id],
  }),
  participations: many(publicityParticipations),
}));

export const publicityParticipationsRelations = relations(publicityParticipations, ({ one }) => ({
  publicity: one(publicities, {
    fields: [publicityParticipations.publicityId],
    references: [publicities.id],
  }),
  group: one(groups, {
    fields: [publicityParticipations.groupId],
    references: [groups.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const customerOrdersRelations = relations(customerOrders, ({ one }) => ({
  group: one(groups, {
    fields: [customerOrders.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [customerOrders.createdBy],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [customerOrders.supplierId],
    references: [suppliers.id],
  }),
}));

export const dlcProductsRelations = relations(dlcProducts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [dlcProducts.supplierId],
    references: [suppliers.id],
  }),
  group: one(groups, {
    fields: [dlcProducts.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [dlcProducts.createdBy],
    references: [users.id],
  }),
  validator: one(users, {
    fields: [dlcProducts.validatedBy],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [tasks.groupId],
    references: [groups.id],
  }),
}));

export const invoiceVerificationsRelations = relations(invoiceVerifications, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [invoiceVerifications.deliveryId],
    references: [deliveries.id],
  }),
  group: one(groups, {
    fields: [invoiceVerifications.groupId],
    references: [groups.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  name: true,
  profileImageUrl: true,
  password: true,
  role: true,
  passwordChanged: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserGroupSchema = createInsertSchema(userGroups).omit({
  createdAt: true,
});

export const insertPublicitySchema = createInsertSchema(publicities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPublicityParticipationSchema = createInsertSchema(publicityParticipations).omit({
  createdAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  createdAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  assignedAt: true,
});

export const insertNocodbConfigSchema = createInsertSchema(nocodbConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerOrderSchema = createInsertSchema(customerOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDlcProductSchema = createInsertSchema(dlcProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Frontend-compatible schema with dlcDate instead of expiryDate and productName field
export const insertDlcProductFrontendSchema = insertDlcProductSchema
  .omit({ expiryDate: true, name: true }) // Remove name from validation since frontend uses productName
  .extend({ 
    dlcDate: z.coerce.date(),
    productName: z.string().min(1, "Le nom du produit est obligatoire") // Frontend field
  });

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  completedBy: true,
}).extend({
  startDate: z.coerce.date().optional().nullable(), // Date de début de la tâche
  dueDate: z.coerce.date().optional().nullable(), // Convertit automatiquement les chaînes en Date
});

export const insertDatabaseBackupSchema = createInsertSchema(databaseBackups).omit({
  createdAt: true,
  size: true,
  tablesCount: true,
});

export const insertInvoiceVerificationSchema = createInsertSchema(invoiceVerifications).omit({
  id: true,
  verifiedAt: true,
  lastCheckedAt: true,
});

// 🚀 Invoice verification cache schema
export const insertInvoiceVerificationCacheSchema = createInsertSchema(invoiceVerificationCache).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type UserGroup = typeof userGroups.$inferSelect;
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type DatabaseBackup = typeof databaseBackups.$inferSelect;
export type DatabaseBackupInsert = z.infer<typeof insertDatabaseBackupSchema>;

export type InvoiceVerification = typeof invoiceVerifications.$inferSelect;
export type InsertInvoiceVerification = z.infer<typeof insertInvoiceVerificationSchema>;

// 🚀 Invoice verification cache types
export type InvoiceVerificationCache = typeof invoiceVerificationCache.$inferSelect;
export type InsertInvoiceVerificationCache = z.infer<typeof insertInvoiceVerificationCacheSchema>;

// Extended types with relations
export type OrderWithRelations = Order & {
  supplier: Supplier;
  group: Group;
  creator: User;
  deliveries?: Delivery[];
};

export type DeliveryWithRelations = Delivery & {
  supplier: Supplier;
  group: Group;
  creator: User;
  order?: Order | null;
};

export type UserWithGroups = User & {
  userGroups: (UserGroup & { group: Group })[];
};

export type Publicity = typeof publicities.$inferSelect;
export type InsertPublicity = z.infer<typeof insertPublicitySchema>;

export type PublicityParticipation = typeof publicityParticipations.$inferSelect;
export type InsertPublicityParticipation = z.infer<typeof insertPublicityParticipationSchema>;

export type PublicityWithRelations = Publicity & {
  creator: User;
  participations: (PublicityParticipation & { group: Group })[];
};

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;

export type RoleWithPermissions = Role & {
  rolePermissions: (RolePermission & { permission: Permission })[];
};

export type UserWithRoles = User & {
  userRoles: (UserRole & { role: Role })[];
};

export type PermissionWithActions = Permission & {
  action: string;
  resource: string;
};

export type NocodbConfig = typeof nocodbConfig.$inferSelect;
export type InsertNocodbConfig = z.infer<typeof insertNocodbConfigSchema>;

export type CustomerOrder = typeof customerOrders.$inferSelect;
export type InsertCustomerOrder = z.infer<typeof insertCustomerOrderSchema>;

export type CustomerOrderWithRelations = CustomerOrder & {
  group: Group;
  creator: User;
  supplier: Supplier;
};

export type UserWithRole = User & {
  dynamicRole?: Role | null;
  userGroups: (UserGroup & { group: Group })[];
};

export type DlcProduct = typeof dlcProducts.$inferSelect;
export type InsertDlcProduct = z.infer<typeof insertDlcProductSchema>;

// Frontend-compatible types with dlcDate field
export type DlcProductFrontend = Omit<DlcProduct, 'expiryDate'> & {
  dlcDate: Date;
};

export type InsertDlcProductFrontend = Omit<InsertDlcProduct, 'expiryDate'> & {
  dlcDate: Date;
};

export type DlcProductWithRelations = DlcProductFrontend & {
  supplier: Supplier;
  group: Group;
  creator: User;
  validator?: User | null;
};
