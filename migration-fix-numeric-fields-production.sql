-- Migration pour corriger les problèmes de validation numérique en production
-- Date: 21 Juillet 2025
-- Objectif: Nettoyer les champs numériques avec valeurs vides pour éviter erreurs PostgreSQL

-- 1. Nettoyer les champs bl_amount vides dans la table deliveries
UPDATE deliveries 
SET bl_amount = NULL 
WHERE bl_amount::text = '' OR bl_amount::text = '0';

-- 2. Nettoyer les champs invoice_amount vides dans la table deliveries
UPDATE deliveries 
SET invoice_amount = NULL 
WHERE invoice_amount::text = '' OR invoice_amount::text = '0';

-- 3. Vérifier la structure des colonnes numériques pour s'assurer qu'elles acceptent NULL
-- (Les colonnes sont déjà configurées pour accepter NULL, pas d'action nécessaire)

-- 4. Ajouter une contrainte pour éviter les valeurs négatives dans bl_amount
ALTER TABLE deliveries 
DROP CONSTRAINT IF EXISTS deliveries_bl_amount_check;

ALTER TABLE deliveries 
ADD CONSTRAINT deliveries_bl_amount_check 
CHECK (bl_amount IS NULL OR bl_amount >= 0);

-- 5. Ajouter une contrainte pour éviter les valeurs négatives dans invoice_amount
ALTER TABLE deliveries 
DROP CONSTRAINT IF EXISTS deliveries_invoice_amount_check;

ALTER TABLE deliveries 
ADD CONSTRAINT deliveries_invoice_amount_check 
CHECK (invoice_amount IS NULL OR invoice_amount >= 0);

-- 6. Logs de vérification
SELECT 
  'deliveries' as table_name,
  COUNT(*) as total_records,
  COUNT(bl_amount) as bl_amount_not_null,
  COUNT(invoice_amount) as invoice_amount_not_null
FROM deliveries;

-- 7. Afficher les enregistrements nettoyés
SELECT id, bl_amount, invoice_amount, notes 
FROM deliveries 
WHERE (bl_amount IS NULL AND notes LIKE '%BL%') 
   OR (invoice_amount IS NULL AND notes LIKE '%facture%')
LIMIT 5;

COMMIT;