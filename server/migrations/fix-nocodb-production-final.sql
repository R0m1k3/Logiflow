-- Migration NocoDB pour production - Colonnes spécifiques BL
-- Date: 2025-07-25
-- Objectif: Ajouter uniquement les colonnes NocoDB BL manquantes

-- Ajouter les colonnes NocoDB BL spécifiques qui causent l'erreur
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS nocodb_bl_column_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS nocodb_amount_column_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS nocodb_supplier_column_name VARCHAR(255);

-- Mettre à jour les valeurs par défaut pour les groupes existants
UPDATE groups 
SET 
    nocodb_bl_column_name = COALESCE(nocodb_bl_column_name, 'Numero_BL'),
    nocodb_amount_column_name = COALESCE(nocodb_amount_column_name, 'Montant HT'),
    nocodb_supplier_column_name = COALESCE(nocodb_supplier_column_name, 'Fournisseurs')
WHERE nocodb_bl_column_name IS NULL 
   OR nocodb_amount_column_name IS NULL 
   OR nocodb_supplier_column_name IS NULL;

-- Vérifier que les colonnes ont été créées
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'groups' 
AND column_name IN ('nocodb_bl_column_name', 'nocodb_amount_column_name', 'nocodb_supplier_column_name')
ORDER BY column_name;