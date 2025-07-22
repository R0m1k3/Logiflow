# Guide de Déploiement LogiFlow

## Options de Déploiement

### 1. Déploiement Replit (Recommandé)
Le plus simple est d'utiliser le bouton "Deploy" de Replit qui gérera automatiquement l'infrastructure.

### 2. Déploiement Docker avec réseau existant
Si vous avez déjà un réseau nginx configuré :
```bash
docker-compose up -d
```

### 3. Déploiement Docker autonome
Utilisez le fichier docker-compose2.yml qui crée son propre réseau :
```bash
docker-compose -f docker-compose2.yml up -d
```

### 4. Créer le réseau nginx manuellement
Si vous voulez utiliser le docker-compose.yml principal :
```bash
# Créer le réseau externe
docker network create nginx_default

# Puis déployer
docker-compose up -d
```

## Configuration Production
L'application est déjà configurée pour la production avec :
- ✅ 4 rôles fixes (Admin, Manager, Employé, Directeur)  
- ✅ Base de données PostgreSQL initialisée
- ✅ Authentification locale sécurisée
- ✅ Système de permissions complet
- ✅ Sauvegarde automatique quotidienne

## Variables d'Environnement
Les variables sont déjà configurées dans les fichiers docker-compose.