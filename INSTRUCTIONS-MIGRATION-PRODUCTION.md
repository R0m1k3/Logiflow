# Instructions pour supprimer le rôle directeur en production

## Problème
Le rôle directeur est encore visible en production car la base de données de production réelle n'a pas été mise à jour.

## Solution
Exécuter le script `migration-remove-directeur-role.sql` sur la base de données de production.

## Étapes à suivre

### 1. Se connecter à la base de données de production
```bash
# Avec psql ou votre outil d'administration de base de données
psql -h [HOST_PRODUCTION] -U [USER] -d [DATABASE]
```

### 2. Exécuter le script de migration
```bash
# Copier le contenu du fichier migration-remove-directeur-role.sql
# Et l'exécuter dans la base de production
\i migration-remove-directeur-role.sql
```

### 3. Vérifications après migration
Le script affichera automatiquement :
- Les rôles restants (devrait être : admin, manager, employee)
- Les utilisateurs avec le rôle admin

## Résultat attendu
- Rôle directeur supprimé complètement
- Anciens utilisateurs directeur migrés vers admin
- Interface production sans rôle directeur dans la gestion des rôles

## Alternative si pas d'accès direct
Si vous n'avez pas accès direct à la base de données, contactez votre administrateur système pour exécuter ce script de migration.