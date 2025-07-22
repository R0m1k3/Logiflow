-- MIGRATION FINALE: Système de Rôles Fixes pour Production
-- Date: 22 Juillet 2025
-- Description: Implémentation des 4 rôles fixes sans possibilité de modification

-- 1. S'assurer que ff292 a le bon rôle
UPDATE users SET role = 'employee' WHERE username = 'ff292';

-- 2. Vérifier que les 4 rôles existent avec les bonnes permissions
-- (Les rôles et permissions sont déjà créés par initDatabase.production.ts)

-- 3. Supprimer tous les anciens utilisateurs de test sauf admin et ff292
DELETE FROM user_groups WHERE user_id NOT IN ('1', 'ff292_employee', 'admin', 'admin_local');
DELETE FROM users WHERE username NOT IN ('admin', 'ff292') AND role != 'admin';

-- 4. Créer utilisateurs de test pour démonstration (optionnel)
INSERT INTO users (id, username, email, password, first_name, last_name, role, created_at, updated_at) VALUES
('manager_demo', 'manager', 'manager@logiflow.fr', '9d7f730c220bf145994e569443b854fc3b8100b21bdac4db7b614a88e976f6b89e8fa74d4d11c41a7b9b21b3c45c31dfed63b01a41b46e9e00e27550e49e21af.c50a7e8d4e5d7f4b2f2fd5d4c7b6c7e4', 'Jean', 'Manager', 'manager', NOW(), NOW()),
('directeur_demo', 'directeur', 'directeur@logiflow.fr', '9d7f730c220bf145994e569443b854fc3b8100b21bdac4db7b614a88e976f6b89e8fa74d4d11c41a7b9b21b3c45c31dfed63b01a41b46e9e00e27550e49e21af.c50a7e8d4e5d7f4b2f2fd5d4c7b6c7e4', 'Pierre', 'Directeur', 'directeur', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

-- 5. Assigner les magasins aux utilisateurs
INSERT INTO user_groups (user_id, group_id, assigned_by, assigned_at) VALUES
('ff292_employee', (SELECT id FROM groups WHERE name = 'Frouard' LIMIT 1), 'admin', NOW()),
('manager_demo', (SELECT id FROM groups WHERE name = 'Frouard' LIMIT 1), 'admin', NOW()),
('directeur_demo', (SELECT id FROM groups WHERE name = 'Frouard' LIMIT 1), 'admin', NOW()),
('directeur_demo', (SELECT id FROM groups WHERE name = 'Houdemont' LIMIT 1), 'admin', NOW())
ON CONFLICT (user_id, group_id) DO NOTHING;

-- 6. Vérification finale des rôles et permissions
SELECT 
    'SYSTÈME DE RÔLES FIXES PRÊT POUR PRODUCTION' as status,
    COUNT(*) as roles_count
FROM roles 
WHERE name IN ('admin', 'employee', 'manager', 'directeur');

-- 7. Résumé des permissions par rôle
SELECT 
    r.display_name as "Rôle",
    COUNT(rp.permission_id) as "Permissions",
    CASE r.name
        WHEN 'admin' THEN 'Accès total (54 permissions)'
        WHEN 'employee' THEN 'Calendrier, commandes (lecture), livraisons (lecture), commandes clients (CRU), DLC (CRUV), tâches (lecture/validation)'
        WHEN 'manager' THEN 'Tout sauf rapprochements et gestion/administration'
        WHEN 'directeur' THEN 'Tout sauf gestion/administration'
        ELSE 'Rôle non défini'
    END as "Description"
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name IN ('admin', 'employee', 'manager', 'directeur')
GROUP BY r.id, r.name, r.display_name
ORDER BY 
    CASE r.name
        WHEN 'admin' THEN 1
        WHEN 'directeur' THEN 2
        WHEN 'manager' THEN 3
        WHEN 'employee' THEN 4
    END;