# Déploiement Production LogiFlow (Avec Nginx)

## Configuration réseau externe

L'application utilise le réseau nginx_default externe pour s'intégrer avec nginx.

## Commandes de déploiement

### Option 1 : Déploiement principal (recommandé)
```bash
# Créer le réseau nginx si nécessaire
docker network create nginx_default

# Arrêter l'ancienne version si elle existe
docker-compose down

# Construire et démarrer
docker-compose up -d --build

# Vérifier le statut
docker-compose ps
docker-compose logs -f logiflow-app
```

### Option 2 : Déploiement alternatif (port 3001)
```bash
# Si le port 3000 est occupé
docker-compose -f docker-compose2.yml up -d --build
# Accessible sur http://localhost:3001
```

## Vérification du déploiement

```bash
# Vérifier que l'application répond
curl -I http://localhost:3000/api/health

# Ou pour docker-compose2.yml
curl -I http://localhost:3001/api/health

# Vérifier les logs en temps réel
docker-compose logs -f logiflow-app
```

## Résolution d'erreurs courantes

### Erreur 502 persistante
```bash
# 1. Vérifier les conteneurs
docker-compose ps

# 2. Vérifier les logs d'erreur
docker-compose logs logiflow-app

# 3. Reconstruire complètement
docker-compose down -v
docker-compose up -d --build

# 4. Test direct dans le conteneur
docker exec -it logiflow-app wget -qO- http://localhost:3000/api/health
```

### Port déjà utilisé
```bash
# Vérifier quel processus utilise le port
lsof -i :3000

# Ou utiliser le déploiement alternatif sur le port 3001
docker-compose -f docker-compose2.yml up -d --build
```

## Accès à l'application

- **URL principale** : http://localhost:3000
- **URL alternative** : http://localhost:3001 (docker-compose2.yml)
- **API Health Check** : http://localhost:3000/api/health

## Résolution de l'erreur réseau

**Erreur : network nginx_default not found**
```bash
# Créer le réseau externe requis
docker network create nginx_default

# Puis redéployer
docker-compose down && docker-compose up -d --build
```

## Notes importantes

- ✅ Configuration réseau nginx_default externe
- ✅ Migrations automatiques désactivées
- ✅ Base de données PostgreSQL incluse
- ✅ Health checks configurés
- ✅ Authentification locale en production