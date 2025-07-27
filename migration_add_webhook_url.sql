-- Migration SQL pour ajouter la colonne webhook_url aux bases de données de production existantes
-- Date: 2025-07-27
-- Description: Ajoute la colonne webhook_url à la table groups si elle n'existe pas déjà

-- Vérification et ajout de la colonne webhook_url
DO $$
BEGIN
    -- Vérifier si la colonne webhook_url existe déjà
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'groups' 
        AND column_name = 'webhook_url'
    ) THEN
        -- Ajouter la colonne webhook_url si elle n'existe pas
        ALTER TABLE groups ADD COLUMN webhook_url TEXT DEFAULT '';
        
        -- Mettre à jour le groupe Frouard avec l'URL webhook par défaut si il existe
        UPDATE groups 
        SET webhook_url = 'https://workflow.ffnancy.fr/webhook-test/acf9cbf7-040a-4cf5-a43d-80210420d30a'
        WHERE name = 'Frouard' AND (webhook_url = '' OR webhook_url IS NULL);
        
        RAISE NOTICE 'Colonne webhook_url ajoutée avec succès à la table groups';
        RAISE NOTICE 'URL webhook configurée pour le groupe Frouard';
    ELSE
        RAISE NOTICE 'Colonne webhook_url existe déjà dans la table groups';
    END IF;
END
$$;

-- Vérification finale - afficher le statut des groupes avec leurs URLs webhook
SELECT 
    id,
    name,
    CASE 
        WHEN webhook_url = '' OR webhook_url IS NULL THEN 'Non configuré'
        ELSE 'Configuré'
    END as webhook_status,
    webhook_url
FROM groups 
ORDER BY name;