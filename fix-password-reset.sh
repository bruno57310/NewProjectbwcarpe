#!/bin/bash

echo "=================================================="
echo "🔧 FIX PASSWORD RESET CONFIGURATION"
echo "=================================================="
echo ""

# Configuration
FRONTEND_URL="https://bwcarpe.com"
API_URL="https://api.bwcarpe.com"

echo "📋 Configuration:"
echo "  Frontend: $FRONTEND_URL"
echo "  API: $API_URL"
echo ""

# Fonction pour trouver le fichier .env
find_env_file() {
    if [ -f ".env" ]; then
        echo ".env"
    elif [ -f "docker/.env" ]; then
        echo "docker/.env"
    elif [ -f "../.env" ]; then
        echo "../.env"
    else
        echo ""
    fi
}

# Fonction pour trouver docker-compose.yml
find_docker_compose() {
    if [ -f "docker-compose.yml" ]; then
        echo "docker-compose.yml"
    elif [ -f "docker/docker-compose.yml" ]; then
        echo "docker/docker-compose.yml"
    elif [ -f "../docker-compose.yml" ]; then
        echo "../docker-compose.yml"
    else
        echo ""
    fi
}

# Trouver les fichiers
ENV_FILE=$(find_env_file)
DOCKER_COMPOSE=$(find_docker_compose)

if [ -z "$ENV_FILE" ]; then
    echo "❌ Fichier .env introuvable !"
    echo ""
    echo "Veuillez exécuter ce script depuis le répertoire contenant votre fichier .env"
    exit 1
fi

echo "✅ Fichier .env trouvé: $ENV_FILE"

if [ -n "$DOCKER_COMPOSE" ]; then
    echo "✅ Docker Compose trouvé: $DOCKER_COMPOSE"
else
    echo "⚠️  Docker Compose non trouvé (optionnel)"
fi

echo ""
echo "=================================================="
echo "🔍 ÉTAPE 1: Vérification configuration actuelle"
echo "=================================================="
echo ""

echo "Variables actuelles dans $ENV_FILE:"
grep -E "^(SITE_URL|API_EXTERNAL_URL|ADDITIONAL_REDIRECT_URLS)" "$ENV_FILE" 2>/dev/null || echo "  (Aucune configuration trouvée)"
echo ""

echo "=================================================="
echo "🔧 ÉTAPE 2: Mise à jour du fichier .env"
echo "=================================================="
echo ""

# Créer une copie de sauvegarde
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Sauvegarde créée: ${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Créer un fichier temporaire
TMP_FILE=$(mktemp)

# Copier tout sauf les lignes qu'on va modifier
grep -v -E "^(SITE_URL|API_EXTERNAL_URL|ADDITIONAL_REDIRECT_URLS)=" "$ENV_FILE" > "$TMP_FILE"

# Ajouter les nouvelles variables
cat >> "$TMP_FILE" << EOF

# ============================================
# Configuration URLs (modifié par fix-password-reset.sh)
# ============================================
SITE_URL=$FRONTEND_URL
API_EXTERNAL_URL=$API_URL
ADDITIONAL_REDIRECT_URLS=$FRONTEND_URL/auth/reset-password,$FRONTEND_URL/auth/confirm,$FRONTEND_URL/*

EOF

# Remplacer l'ancien fichier
mv "$TMP_FILE" "$ENV_FILE"

echo "✅ Fichier $ENV_FILE mis à jour"
echo ""

echo "Nouvelles valeurs:"
grep -E "^(SITE_URL|API_EXTERNAL_URL|ADDITIONAL_REDIRECT_URLS)=" "$ENV_FILE"
echo ""

echo "=================================================="
echo "🔧 ÉTAPE 3: Mise à jour docker-compose.yml"
echo "=================================================="
echo ""

if [ -n "$DOCKER_COMPOSE" ]; then
    # Créer une copie de sauvegarde
    cp "$DOCKER_COMPOSE" "${DOCKER_COMPOSE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Sauvegarde créée: ${DOCKER_COMPOSE}.backup.$(date +%Y%m%d_%H%M%S)"

    # Vérifier si les variables GoTrue existent
    if grep -q "GOTRUE_SITE_URL" "$DOCKER_COMPOSE"; then
        echo "✅ Configuration GoTrue trouvée dans docker-compose.yml"
    else
        echo "⚠️  Configuration GoTrue non trouvée - elle doit être ajoutée manuellement"
        echo ""
        echo "Ajoutez ces lignes dans la section 'auth:' > 'environment:':"
        echo ""
        echo "      GOTRUE_SITE_URL: \${SITE_URL}"
        echo "      GOTRUE_URI_ALLOW_LIST: \${ADDITIONAL_REDIRECT_URLS}"
        echo "      GOTRUE_EXTERNAL_EMAIL_ENABLED: \"true\""
        echo "      GOTRUE_MAILER_AUTOCONFIRM: \"false\""
    fi
else
    echo "⚠️  Docker Compose non trouvé - configuration manuelle requise"
fi

echo ""
echo "=================================================="
echo "🐳 ÉTAPE 4: Redémarrage des services"
echo "=================================================="
echo ""

if [ -n "$DOCKER_COMPOSE" ]; then
    COMPOSE_DIR=$(dirname "$DOCKER_COMPOSE")

    echo "Voulez-vous redémarrer les services Docker maintenant? (y/n)"
    read -r RESTART

    if [ "$RESTART" = "y" ] || [ "$RESTART" = "Y" ]; then
        echo "Redémarrage des services..."
        cd "$COMPOSE_DIR" || exit
        docker-compose down
        docker-compose up -d
        echo "✅ Services redémarrés"

        echo ""
        echo "Attente de 5 secondes pour que les services démarrent..."
        sleep 5

        echo ""
        echo "Vérification des variables d'environnement dans le conteneur GoTrue:"
        docker-compose exec -T auth env | grep -E "(GOTRUE_SITE_URL|GOTRUE_URI_ALLOW_LIST)" || echo "⚠️  Impossible de vérifier (conteneur 'auth' introuvable)"
    else
        echo "⚠️  N'oubliez pas de redémarrer les services:"
        echo "   cd $COMPOSE_DIR"
        echo "   docker-compose down && docker-compose up -d"
    fi
else
    echo "⚠️  Veuillez redémarrer manuellement vos services Docker"
fi

echo ""
echo "=================================================="
echo "✅ CONFIGURATION TERMINÉE"
echo "=================================================="
echo ""
echo "📝 Prochaines étapes:"
echo ""
echo "1. Si vous n'avez pas redémarré Docker, faites-le maintenant"
echo "2. Demandez un nouveau lien de reset password"
echo "3. Le lien devrait maintenant fonctionner correctement"
echo ""
echo "🔍 Pour déboguer, vérifiez:"
echo "   - Les logs: docker-compose logs auth"
echo "   - Les variables: docker-compose exec auth env | grep GOTRUE"
echo ""
echo "=================================================="
