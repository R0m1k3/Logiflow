# Commandes pour résoudre l'erreur de déploiement

# 1. Créer le réseau nginx s'il n'existe pas
docker network create nginx_default 2>/dev/null || echo 'Réseau nginx_default existe déjà'

# 2. Arrêter les conteneurs en conflit si nécessaire
docker stop logiflow-postgres logiflow-app 2>/dev/null || echo 'Aucun conteneur à arrêter'

# 3. Vérifier les ports utilisés
echo 'Ports PostgreSQL utilisés:'
lsof -i :5432 2>/dev/null || echo 'Port 5432 libre'
lsof -i :5434 2>/dev/null || echo 'Port 5434 libre'

# 4. Déployer avec la nouvelle configuration
echo 'Prêt pour: docker-compose up -d'

