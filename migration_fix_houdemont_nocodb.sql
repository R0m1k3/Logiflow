-- 🔧 MIGRATION: Configuration NocoDB pour Houdemont
-- Date: 2025-07-30
-- Objectif: Corriger la configuration NocoDB manquante pour le magasin Houdemont

-- Mettre à jour le groupe Houdemont avec la configuration NocoDB
UPDATE groups SET 
  nocodb_config_id = 1, 
  nocodb_table_id = 'my7zunxprumahmm', 
  invoice_column_name = 'RefFacture'
WHERE name = 'Houdemont' AND nocodb_config_id IS NULL;

-- Vérification des configurations NocoDB
SELECT 
  g.id, 
  g.name, 
  g.nocodb_config_id, 
  g.nocodb_table_id, 
  g.invoice_column_name,
  n.base_url,
  n.project_id
FROM groups g 
LEFT JOIN nocodb_config n ON g.nocodb_config_id = n.id 
WHERE g.name IN ('Frouard', 'Houdemont');

-- Nettoyer le cache pour la facture F5162713
DELETE FROM invoice_verification_cache WHERE invoice_reference = 'F5162713';

-- Nettoyer tout le cache pour forcer une nouvelle vérification
DELETE FROM invoice_verification_cache;