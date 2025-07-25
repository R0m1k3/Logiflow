-- Migration complète pour résoudre définitivement les colonnes NocoDB en production
-- Date: 2025-07-25
-- Objectif: Créer toutes les colonnes NocoDB manquantes et harmoniser la structure

-- 1. Ajouter les colonnes de base si elles n'existent pas
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS nocodb_config_id INTEGER,
ADD COLUMN IF NOT EXISTS nocodb_table_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS nocodb_table_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS invoice_column_name VARCHAR(255);

-- 2. Ajouter les colonnes NocoDB BL spécifiques qui causent l'erreur
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS nocodb_bl_column_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS nocodb_amount_column_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS nocodb_supplier_column_name VARCHAR(255);

-- 3. Créer la table nocodb_configs si elle n'existe pas
CREATE TABLE IF NOT EXISTS nocodb_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NOT NULL,
    api_token VARCHAR(500) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Insérer une configuration NocoDB par défaut si aucune n'existe
INSERT INTO nocodb_configs (name, base_url, project_id, api_token, description, is_active, created_by)
SELECT 'Nocodb', 'https://nocodb.ffnancy.fr', 'nocodb', 'z4BAwLo6dgoN_E7PKJSHN7PA7kdBePtKOYcsDlwQ', 'Configuration principale NocoDB', true, '1'
WHERE NOT EXISTS (SELECT 1 FROM nocodb_configs WHERE name = 'Nocodb');

-- 5. Mettre à jour les valeurs par défaut pour les groupes existants
UPDATE groups 
SET 
    nocodb_bl_column_name = COALESCE(nocodb_bl_column_name, 'Numéro de BL'),
    nocodb_amount_column_name = COALESCE(nocodb_amount_column_name, 'Montant HT'),
    nocodb_supplier_column_name = COALESCE(nocodb_supplier_column_name, 'Fournisseur'),
    invoice_column_name = COALESCE(invoice_column_name, 'RefFacture')
WHERE nocodb_bl_column_name IS NULL 
   OR nocodb_amount_column_name IS NULL 
   OR nocodb_supplier_column_name IS NULL
   OR invoice_column_name IS NULL;

-- 6. Ajouter une foreign key vers nocodb_configs si pas déjà présente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'groups_nocodb_config_id_fkey'
    ) THEN
        ALTER TABLE groups 
        ADD CONSTRAINT groups_nocodb_config_id_fkey 
        FOREIGN KEY (nocodb_config_id) REFERENCES nocodb_configs(id);
    END IF;
END $$;

-- 7. Vérifier la structure finale
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'groups' 
AND column_name LIKE '%nocodb%'
ORDER BY column_name;

-- 8. Afficher les groupes avec leurs configurations NocoDB
SELECT 
    id, 
    name, 
    nocodb_config_id,
    nocodb_table_id,
    nocodb_table_name,
    nocodb_bl_column_name,
    nocodb_amount_column_name,
    nocodb_supplier_column_name
FROM groups 
ORDER BY name;

-- 9. Afficher les configurations NocoDB disponibles
SELECT 
    id,
    name,
    base_url,
    project_id,
    is_active
FROM nocodb_configs 
WHERE is_active = true;