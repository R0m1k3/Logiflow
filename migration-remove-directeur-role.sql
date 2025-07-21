-- Script de migration pour supprimer le rôle directeur en production
-- À exécuter sur la base de données de production

-- 1. Supprimer toutes les permissions assignées au rôle directeur
DELETE FROM role_permissions WHERE role_id = 4;

-- 2. Migrer les utilisateurs directeur vers le rôle admin
UPDATE users SET role = 'admin' WHERE role = 'directeur';

-- 3. Supprimer les assignations utilisateur-rôle pour le rôle directeur
DELETE FROM user_roles WHERE role_id = 4;

-- 4. Assigner le rôle admin aux anciens directeurs
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT u.id, 1, 'migration_directeur', CURRENT_TIMESTAMP
FROM users u 
WHERE u.role = 'admin' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = 1
);

-- 5. Supprimer le rôle directeur
DELETE FROM roles WHERE id = 4 AND name = 'directeur';

-- 6. Vérification finale
SELECT 'Migration completed - Remaining roles:' as status;
SELECT id, name, display_name FROM roles ORDER BY id;

SELECT 'Users with admin role:' as status;
SELECT username, role FROM users WHERE role = 'admin';