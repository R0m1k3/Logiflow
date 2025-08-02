# Déploiement Production LogiFlow (Sans Nginx)

## Configuration mise à jour

L'application a été configurée pour un déploiement direct sans nginx.

## Commandes de déploiement

### Option 1 : Déploiement principal (recommandé)
```bash
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

## Notes importantes

- ✅ Configuration réseau simplifiée (pas de nginx)
- ✅ Migrations automatiques désactivées
- ✅ Base de données PostgreSQL incluse
- ✅ Health checks configurés
- ✅ Authentification locale en production