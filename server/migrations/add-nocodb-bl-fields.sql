-- Migration: Ajout des nouveaux champs NocoDB pour rapprochement par N° BL
-- Date: July 22, 2025

-- Ajouter les colonnes pour la configuration du rapprochement par N° BL
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS nocodb_bl_column_name VARCHAR DEFAULT 'Numéro de BL';

ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS nocodb_amount_column_name VARCHAR DEFAULT 'Montant HT';

ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS nocodb_supplier_column_name VARCHAR DEFAULT 'Fournisseur';

-- Commentaires pour documentation
COMMENT ON COLUMN groups.nocodb_bl_column_name IS 'Nom de la colonne contenant les numéros de BL dans NocoDB';
COMMENT ON COLUMN groups.nocodb_amount_column_name IS 'Nom de la colonne contenant les montants HT dans NocoDB';
COMMENT ON COLUMN groups.nocodb_supplier_column_name IS 'Nom de la colonne contenant les noms de fournisseur dans NocoDB';