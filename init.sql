-- LogiFlow Database Initialization Script
-- Creates all necessary tables and initial data

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS publicity_participations CASCADE;
DROP TABLE IF EXISTS customer_orders CASCADE;
DROP TABLE IF EXISTS dlc_products CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS publicities CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Create users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    password_changed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create groups (stores) table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#1976D2',
    address TEXT,
    phone VARCHAR(255),
    email VARCHAR(255),
    nocodb_config_id INTEGER,
    nocodb_table_id VARCHAR(255),
    nocodb_table_name VARCHAR(255),
    invoice_column_name VARCHAR(255) DEFAULT 'Ref Facture',
    nocodb_bl_column_name VARCHAR(255) DEFAULT 'Numéro de BL',
    nocodb_amount_column_name VARCHAR(255) DEFAULT 'Montant HT',
    nocodb_supplier_column_name VARCHAR(255) DEFAULT 'Fournisseur',
    webhook_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1976D2',
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles junction table (CORRECTED STRUCTURE)
CREATE TABLE user_roles (
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR(255),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Create user_groups junction table (for store assignments)
CREATE TABLE user_groups (
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    assigned_by VARCHAR(255),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id)
);

-- Create suppliers table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    phone VARCHAR(255),
    has_dlc BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    group_id INTEGER REFERENCES groups(id),
    planned_date DATE,
    quantity INTEGER,
    unit VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled', 'planned')),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create deliveries table
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    group_id INTEGER REFERENCES groups(id),
    scheduled_date DATE,
    quantity INTEGER,
    unit VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled', 'planned')),
    notes TEXT,
    bl_number VARCHAR(255),
    bl_amount DECIMAL(10,2),
    invoice_reference VARCHAR(255),
    invoice_amount DECIMAL(10,2),
    reconciled BOOLEAN DEFAULT FALSE,
    delivered_date DATE,
    validated_at TIMESTAMP,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to VARCHAR(255) NOT NULL DEFAULT 'Non assigné',
    group_id INTEGER REFERENCES groups(id),
    created_by VARCHAR(255),
    completed_by VARCHAR(255),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dlc_products table
CREATE TABLE dlc_products (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    group_id INTEGER REFERENCES groups(id),
    dlc_date DATE,
    expiry_date DATE,
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'unités',
    gencode VARCHAR(255),
    status VARCHAR(50) DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'valides', 'expires')),
    notes TEXT,
    type VARCHAR(50) DEFAULT 'dlc' CHECK (type IN ('dlc', 'dluo')),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_orders table
CREATE TABLE customer_orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(255),
    items TEXT NOT NULL,
    total_amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
    notes TEXT,
    group_id INTEGER REFERENCES groups(id),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create publicities table
CREATE TABLE publicities (
    id SERIAL PRIMARY KEY,
    pub_number VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    year INTEGER NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create publicity_participations table
CREATE TABLE publicity_participations (
    id SERIAL PRIMARY KEY,
    publicity_id INTEGER REFERENCES publicities(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX idx_session_expire ON sessions(expire);

-- Insert default data

-- Insert default groups (stores) with webhook URLs
INSERT INTO groups (name, color, webhook_url) VALUES 
('Frouard', '#1976D2', 'https://workflow.ffnancy.fr/webhook-test/acf9cbf7-040a-4cf5-a43d-80210420d30a'),
('Houdemont', '#455A64', '');

-- Insert 4 fixed roles with soft colors
INSERT INTO roles (id, name, display_name, description, color, is_system, is_active) VALUES
(1, 'admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités', '#fca5a5', true, true),
(2, 'manager', 'Manager', 'Accès étendu sauf administration', '#93c5fd', true, true),
(3, 'employee', 'Employé', 'Accès limité aux opérations de base', '#86efac', true, true),
(4, 'directeur', 'Directeur', 'Accès direction sans administration', '#c4b5fd', true, true);

-- Insert permissions with French display names
INSERT INTO permissions (name, display_name, category) VALUES
-- Dashboard permissions
('dashboard_view', 'Voir le tableau de bord', 'tableau_de_bord'),

-- Store management
('stores_read', 'Voir les magasins', 'magasins'),
('stores_create', 'Créer des magasins', 'magasins'),
('stores_update', 'Modifier les magasins', 'magasins'),
('stores_delete', 'Supprimer les magasins', 'magasins'),

-- Supplier management
('suppliers_read', 'Voir les fournisseurs', 'fournisseurs'),
('suppliers_create', 'Créer des fournisseurs', 'fournisseurs'),
('suppliers_update', 'Modifier les fournisseurs', 'fournisseurs'),
('suppliers_delete', 'Supprimer les fournisseurs', 'fournisseurs'),

-- Order management
('orders_read', 'Voir les commandes', 'commandes'),
('orders_create', 'Créer des commandes', 'commandes'),
('orders_update', 'Modifier les commandes', 'commandes'),
('orders_delete', 'Supprimer les commandes', 'commandes'),
('orders_validate', 'Valider les commandes', 'commandes'),

-- Delivery management
('deliveries_read', 'Voir les livraisons', 'livraisons'),
('deliveries_create', 'Créer des livraisons', 'livraisons'),
('deliveries_update', 'Modifier les livraisons', 'livraisons'),
('deliveries_delete', 'Supprimer les livraisons', 'livraisons'),
('deliveries_validate', 'Valider les livraisons', 'livraisons'),

-- Publicity management
('publicities_read', 'Voir les publicités', 'publicites'),
('publicities_create', 'Créer des publicités', 'publicites'),
('publicities_update', 'Modifier les publicités', 'publicites'),
('publicities_delete', 'Supprimer les publicités', 'publicites'),
('publicities_participate', 'Gérer les participations', 'publicites'),

-- Customer orders
('customer_orders_read', 'Voir les commandes clients', 'commandes_clients'),
('customer_orders_create', 'Créer des commandes clients', 'commandes_clients'),
('customer_orders_update', 'Modifier les commandes clients', 'commandes_clients'),
('customer_orders_delete', 'Supprimer les commandes clients', 'commandes_clients'),
('customer_orders_print', 'Imprimer les commandes clients', 'commandes_clients'),

-- User management
('users_read', 'Voir les utilisateurs', 'utilisateurs'),
('users_create', 'Créer des utilisateurs', 'utilisateurs'),
('users_update', 'Modifier les utilisateurs', 'utilisateurs'),
('users_delete', 'Supprimer les utilisateurs', 'utilisateurs'),
('users_assign_roles', 'Assigner des rôles', 'utilisateurs'),

-- Role management
('roles_read', 'Voir les rôles', 'gestion_roles'),
('roles_create', 'Créer des rôles', 'gestion_roles'),
('roles_update', 'Modifier les rôles', 'gestion_roles'),
('roles_delete', 'Supprimer les rôles', 'gestion_roles'),
('roles_permissions', 'Gérer les permissions', 'gestion_roles'),

-- DLC management
('dlc_read', 'Voir les produits DLC', 'gestion_dlc'),
('dlc_create', 'Créer des produits DLC', 'gestion_dlc'),
('dlc_update', 'Modifier les produits DLC', 'gestion_dlc'),
('dlc_delete', 'Supprimer les produits DLC', 'gestion_dlc'),
('dlc_validate', 'Valider les produits DLC', 'gestion_dlc'),
('dlc_print', 'Imprimer les étiquettes DLC', 'gestion_dlc'),
('dlc_stats', 'Voir les statistiques DLC', 'gestion_dlc'),

-- Task management
('tasks_read', 'Voir les tâches', 'gestion_taches'),
('tasks_create', 'Créer des tâches', 'gestion_taches'),
('tasks_update', 'Modifier les tâches', 'gestion_taches'),
('tasks_delete', 'Supprimer les tâches', 'gestion_taches'),
('tasks_assign', 'Assigner des tâches', 'gestion_taches'),

-- Reconciliation/BL management  
('reconciliation_read', 'Voir les rapprochements', 'rapprochement'),
('reconciliation_update', 'Rapprocher BL/Factures', 'rapprochement'),

-- Calendar management
('calendar_read', 'Voir le calendrier', 'calendrier'),

-- Statistics and reporting
('statistics_read', 'Voir les statistiques', 'statistiques'),
('reports_generate', 'Générer des rapports', 'statistiques'),

-- Groups/stores reading (essential for filtering)
('groups_read', 'Voir les magasins assignés', 'magasins'),

-- Administration
('system_admin', 'Administration système', 'administration'),
('nocodb_config', 'Configuration NocoDB', 'administration');

-- Assign permissions to roles

-- Admin gets all permissions (56 total)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, p.id FROM permissions p;

-- Manager gets everything except administration and reconciliation (50 permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, p.id FROM permissions p 
WHERE p.category NOT IN ('administration') 
  AND p.name NOT IN ('reconciliation_read', 'reconciliation_update');

-- Employee gets basic operations only (19 permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, p.id FROM permissions p 
WHERE p.name IN (
  'dashboard_view', 'calendar_read', 'orders_read', 'deliveries_read', 'publicities_read',
  'customer_orders_create', 'customer_orders_read', 'customer_orders_update',
  'dlc_read', 'dlc_create', 'dlc_update', 'dlc_validate',
  'tasks_read', 'tasks_validate', 'suppliers_read', 'users_read',
  'statistics_read', 'reports_generate', 'groups_read'
);

-- Directeur gets everything except administration (52 permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, p.id FROM permissions p 
WHERE p.category NOT IN ('administration');

-- Insert test suppliers
INSERT INTO suppliers (name, contact, phone, has_dlc) VALUES
('Fournisseur Test 1', 'Jean Dupont', '01 23 45 67 89', TRUE),
('Fournisseur Test 2', 'Marie Martin', '01 23 45 67 90', FALSE);

-- Insert admin user (password will be set programmatically)
INSERT INTO users (id, username, email, name, first_name, last_name, role, password_changed) VALUES
('1', 'admin', 'admin@logiflow.com', 'Admin System', 'Admin', 'System', 'admin', FALSE);

-- Success message
SELECT 'Database initialization completed successfully!' as message;