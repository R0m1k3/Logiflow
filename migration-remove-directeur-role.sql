-- =================================================================
-- SCRIPT DE MIGRATION PRODUCTION - SUPPRESSION RÔLE DIRECTEUR
-- =================================================================
-- À exécuter sur la vraie base de données de production
-- Date: 21 juillet 2025
-- Objectif: Supprimer complètement le rôle directeur du système

BEGIN;

-- Affichage de l'état initial
SELECT 'ÉTAT INITIAL - Rôles existants:' as status;
SELECT id, name, display_name FROM roles ORDER BY id;

SELECT 'ÉTAT INITIAL - Utilisateurs avec rôle directeur:' as status;
SELECT username, role FROM users WHERE role = 'directeur';

-- 1. Supprimer toutes les permissions assignées au rôle directeur
SELECT 'Suppression des permissions du rôle directeur...' as status;
DELETE FROM role_permissions WHERE role_id = 4;

-- 2. Migrer les utilisateurs directeur vers le rôle admin
SELECT 'Migration des utilisateurs directeur vers admin...' as status;
UPDATE users SET role = 'admin' WHERE role = 'directeur';

-- 3. Supprimer les assignations utilisateur-rôle pour le rôle directeur
SELECT 'Suppression des assignations utilisateur-rôle directeur...' as status;
DELETE FROM user_roles WHERE role_id = 4;

-- 4. Assigner le rôle admin aux anciens directeurs
SELECT 'Assignation du rôle admin aux anciens directeurs...' as status;
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
SELECT u.id, 1, 'migration_directeur_20250721', CURRENT_TIMESTAMP
FROM users u 
WHERE u.role = 'admin' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = 1
);

-- 5. Supprimer le rôle directeur
SELECT 'Suppression du rôle directeur...' as status;
DELETE FROM roles WHERE id = 4 AND name = 'directeur';

-- 6. Vérifications finales
SELECT 'MIGRATION TERMINÉE - Rôles restants:' as status;
SELECT id, name, display_name FROM roles ORDER BY id;

SELECT 'MIGRATION TERMINÉE - Utilisateurs admin:' as status;
SELECT username, role FROM users WHERE role = 'admin';

SELECT 'MIGRATION TERMINÉE - Nombre de permissions par rôle:' as status;
SELECT r.name, COUNT(rp.permission_id) as permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.id;

COMMIT;

SELECT '✅ MIGRATION RÉUSSIE - Le rôle directeur a été supprimé de la production' as final_status;