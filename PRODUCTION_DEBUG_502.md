# Guide de débogage pour erreur 502 en production

## Problème identifié
L'application LogiFlow démarre correctement en production (selon les logs), mais retourne une erreur 502 Bad Gateway lors de l'accès externe.

## Étapes de débogage à effectuer

### 1. Vérifier que l'application est accessible dans le conteneur
```bash
# Se connecter au conteneur
docker exec -it logiflow-app wget -qO- http://localhost:3000/api/health

# Si ça ne marche pas, vérifier les logs détaillés
docker logs logiflow-app --tail 100 -f
```

### 2. Vérifier la configuration réseau
```bash
# Vérifier que le conteneur écoute sur le bon port
docker exec -it logiflow-app netstat -tlnp | grep 3000

# Vérifier la connectivité réseau
docker network ls
docker network inspect nginx_default
```

### 3. Tester l'accès direct au conteneur
```bash
# Test depuis l'hôte Docker
curl -I http://localhost:3000/api/health

# Si vous utilisez nginx comme proxy
curl -I http://localhost:3000/
```

### 4. Problèmes potentiels identifiés

#### A. Problème de réseau nginx_default
Le docker-compose.yml utilise un réseau externe `nginx_default` qui pourrait ne pas exister :

```bash
# Créer le réseau s'il n'existe pas
docker network create nginx_default

# Puis redémarrer
docker-compose down && docker-compose up -d
```

#### B. Alternative : Utiliser docker-compose2.yml
Ce fichier crée son propre réseau isolé :

```bash
# Arrêter la version actuelle
docker-compose down

# Utiliser la version autonome
docker-compose -f docker-compose2.yml up -d

# L'application sera accessible sur le port 3001
curl -I http://localhost:3001/api/health
```

#### C. Problème de configuration nginx
Si vous utilisez nginx comme reverse proxy, vérifiez la configuration :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://logiflow-app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. Solutions rapides

#### Solution 1 : Redéployer avec le réseau autonome
```bash
docker-compose down
docker-compose -f docker-compose2.yml up -d
# Accès sur http://localhost:3001
```

#### Solution 2 : Créer le réseau manquant
```bash
docker network create nginx_default
docker-compose down && docker-compose up -d
# Accès sur http://localhost:3000
```

### 6. Vérifications finales
```bash
# Vérifier que l'application est en cours d'exécution
docker ps | grep logiflow

# Vérifier les health checks
docker inspect logiflow-app | grep -A 10 Health

# Tester l'API directement
curl -v http://localhost:3000/api/health
curl -v http://localhost:3001/api/health  # Si vous utilisez docker-compose2.yml
```

## Notes importantes
- L'application démarre correctement selon les logs (port 3000, base de données connectée)
- Le problème est probablement lié à la configuration réseau ou nginx
- Les migrations automatiques ont été désactivées comme prévu
- L'authentication fonctionne en mode production

## Commande de test rapide
```bash
# Test pour identifier rapidement le problème
if docker exec -it logiflow-app wget -qO- http://localhost:3000/api/health; then
  echo "✅ Application accessible dans le conteneur"
  echo "❌ Problème de configuration nginx/réseau"
else
  echo "❌ Application ne répond pas dans le conteneur"
  echo "Vérifier les logs: docker logs logiflow-app"
fi
```