-- Migration pour supprimer définitivement le rôle directeur de la base de données production
-- Exécuter avec prudence en base de données

BEGIN;

-- 1. Migrer les utilisateurs qui ont le rôle directeur vers admin
UPDATE users 
SET role = 'admin' 
WHERE role = 'directeur';

-- 2. Supprimer toutes les assignations du rôle directeur dans user_roles
DELETE FROM user_roles 
WHERE role_id = 4; -- ID du rôle directeur

-- 3. Supprimer toutes les permissions du rôle directeur
DELETE FROM role_permissions 
WHERE role_id = 4; -- ID du rôle directeur

-- 4. Supprimer l'utilisateur "Directeur" créé automatiquement
DELETE FROM users 
WHERE username = 'Directeur' OR username = 'directeur';

-- 5. Supprimer le rôle directeur lui-même
DELETE FROM roles 
WHERE id = 4 AND name = 'directeur';

-- 6. Optionnel: Supprimer aussi le rôle "Dir" (ID 5) qui semble être un doublon
DELETE FROM role_permissions WHERE role_id = 5;
DELETE FROM user_roles WHERE role_id = 5;
DELETE FROM roles WHERE id = 5 AND name = 'Dir';

COMMIT;

-- Vérification: lister les rôles restants
SELECT id, name, display_name, description FROM roles ORDER BY id;