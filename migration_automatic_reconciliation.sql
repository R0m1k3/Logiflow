-- Migration: Add automatic_reconciliation column to suppliers table
-- Date: 2025-08-07
-- Description: Ajoute la colonne automatic_reconciliation à la table suppliers pour permettre le rapprochement automatique lors de la validation des livraisons

BEGIN;

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'automatic_reconciliation'
    ) THEN
        -- Ajouter la colonne automatic_reconciliation
        ALTER TABLE suppliers 
        ADD COLUMN automatic_reconciliation BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Column automatic_reconciliation added to suppliers table';
    ELSE
        RAISE NOTICE 'Column automatic_reconciliation already exists in suppliers table';
    END IF;
END $$;

COMMIT;

-- Commentaire explicatif :
-- Cette colonne permet de marquer certains fournisseurs comme ayant un rapprochement automatique.
-- Lorsqu'une livraison de ce fournisseur est validée, le rapprochement sera automatiquement marqué comme validé.
-- Utilisation : UPDATE suppliers SET automatic_reconciliation = true WHERE name = 'Nom du fournisseur';