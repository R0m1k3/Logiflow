-- Migration script pour la table dashboard_messages
-- À exécuter quand la base de données sera accessible

-- 1. Vérifier si la table existe
SELECT 'Checking if dashboard_messages table exists...' as step;

DO $$ 
DECLARE
    table_exists boolean;
BEGIN 
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_messages'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Table dashboard_messages already exists';
    ELSE
        RAISE NOTICE 'Table dashboard_messages does not exist - will create it';
    END IF;
END $$;

-- 2. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS dashboard_messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    store_id INTEGER REFERENCES groups(id),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Ajouter la colonne type si elle manque (cas où la table existe sans cette colonne)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='dashboard_messages' 
        AND column_name='type'
    ) THEN
        ALTER TABLE dashboard_messages ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'info';
        RAISE NOTICE 'Added type column to dashboard_messages table';
    ELSE
        RAISE NOTICE 'Type column already exists in dashboard_messages table';
    END IF;
END $$;

-- 4. Supprimer la colonne updated_at si elle existe (pour correspondre au nouveau schéma)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='dashboard_messages' 
        AND column_name='updated_at'
    ) THEN
        ALTER TABLE dashboard_messages DROP COLUMN updated_at;
        RAISE NOTICE 'Removed updated_at column from dashboard_messages table';
    ELSE
        RAISE NOTICE 'No updated_at column found in dashboard_messages table';
    END IF;
END $$;

-- 5. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_dashboard_messages_store_id ON dashboard_messages(store_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_messages_created_at ON dashboard_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_messages_type ON dashboard_messages(type);

-- 6. Vérifier la structure finale de la table
SELECT 'Final table structure:' as step;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'dashboard_messages'
ORDER BY ordinal_position;

-- 7. Test d'insertion pour valider le schéma
SELECT 'Testing message creation...' as step;

-- Insérer un message de test
INSERT INTO dashboard_messages (title, content, type, created_by)
VALUES ('Test Migration', 'Message de test pour valider la migration', 'info', 'migration-test')
ON CONFLICT DO NOTHING;

-- Vérifier le message de test
SELECT 'Test message validation:' as step;
SELECT id, title, type, created_by, created_at 
FROM dashboard_messages 
WHERE created_by = 'migration-test'
LIMIT 1;

-- Nettoyer le message de test
DELETE FROM dashboard_messages WHERE created_by = 'migration-test';
SELECT 'Test message cleaned up' as step;

-- 8. Afficher le nombre de messages existants
SELECT 'Current message count:' as step;
SELECT COUNT(*) as total_messages FROM dashboard_messages;

SELECT 'Migration completed successfully!' as result;