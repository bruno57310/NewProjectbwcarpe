#!/bin/bash

echo "🔧 CORRECTION AUTOMATIQUE CORS SUPABASE"
echo "========================================"
echo ""

# Variables
KONG_CONFIG="/root/supabase-1.24.09/docker/volumes/api/kong.yml"
DOCKER_COMPOSE="/root/supabase-1.24.09/docker/docker-compose.yml"
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)

# 1. Backup Kong
echo "1️⃣ Backup du kong.yml..."
cp "$KONG_CONFIG" "/root/kong.yml.backup-$BACKUP_DATE"
echo "   ✅ Backup : /root/kong.yml.backup-$BACKUP_DATE"
echo ""

# 2. Backup docker-compose
echo "2️⃣ Backup du docker-compose.yml..."
cp "$DOCKER_COMPOSE" "/root/docker-compose.yml.backup-$BACKUP_DATE"
echo "   ✅ Backup : /root/docker-compose.yml.backup-$BACKUP_DATE"
echo ""

# 3. Supprimer les plugins CORS de Kong
echo "3️⃣ Suppression des plugins CORS de Kong..."
cp /root/supabase-1.24.09/docker/volumes/api/kong-final.yml "$KONG_CONFIG" 2>/dev/null || {
    echo "   ⚠️  kong-final.yml introuvable, création manuelle..."
    cat > "$KONG_CONFIG" << 'KONGEOF'
_format_version: '2.1'
_transform: true

###
### Consumers / Users
###
consumers:
  - username: DASHBOARD
  - username: anon
    keyauth_credentials:
      - key: ${SUPABASE_ANON_KEY}
  - username: service_role
    keyauth_credentials:
      - key: ${SUPABASE_SERVICE_KEY}

###
### Access Control List
###
acls:
  - consumer: anon
    group: anon
  - consumer: service_role
    group: admin

###
### Dashboard credentials
###
basicauth_credentials:
  - consumer: DASHBOARD
    username: $DASHBOARD_USERNAME
    password: $DASHBOARD_PASSWORD

###
### API Routes (SANS plugins CORS)
###
services:
  - name: auth-v1
    _comment: 'GoTrue: /auth/v1/* -> http://auth:9999/*'
    url: http://auth:9999/
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - /auth/v1
          - /auth/v1/
    plugins:
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: rest-v1
    _comment: 'PostgREST: /rest/v1/* -> http://rest:3000/*'
    url: http://rest:3000/
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - /rest/v1/
    plugins:
      - name: key-auth
        config:
          hide_credentials: true
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: graphql-v1
    _comment: 'PostgREST: /graphql/v1/* -> http://rest:3000/rpc/graphql'
    url: http://rest:3000/rpc/graphql
    routes:
      - name: graphql-v1-all
        strip_path: true
        paths:
          - /graphql/v1
    plugins:
      - name: key-auth
        config:
          hide_credentials: true
      - name: request-transformer
        config:
          add:
            headers:
              - Content-Profile:graphql_public
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: realtime-v1-ws
    _comment: 'Realtime: /realtime/v1/* -> ws://realtime:4000/socket/*'
    url: http://realtime-dev.supabase-realtime:4000/socket
    protocol: ws
    routes:
      - name: realtime-v1-ws
        strip_path: true
        paths:
          - /realtime/v1/
    plugins:
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: realtime-v1-rest
    _comment: 'Realtime: /realtime/v1/* -> ws://realtime:4000/socket/*'
    url: http://realtime-dev.supabase-realtime:4000/api
    protocol: http
    routes:
      - name: realtime-v1-rest
        strip_path: true
        paths:
          - /realtime/v1/api
    plugins:
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin
            - anon

  - name: storage-v1
    _comment: 'Storage: /storage/v1/* -> http://storage:5000/*'
    url: http://storage:5000/
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - /storage/v1/

  - name: functions-v1
    _comment: 'Edge Functions: /functions/v1/* -> http://functions:9000/*'
    url: http://functions:9000/
    routes:
      - name: functions-v1-all
        strip_path: true
        paths:
          - /functions/v1/

  - name: analytics-v1
    _comment: 'Analytics: /analytics/v1/* -> http://logflare:4000/*'
    url: http://analytics:4000/
    routes:
      - name: analytics-v1-all
        strip_path: true
        paths:
          - /analytics/v1/

  - name: meta
    _comment: 'pg-meta: /pg/* -> http://pg-meta:8080/*'
    url: http://meta:8080/
    routes:
      - name: meta-all
        strip_path: true
        paths:
          - /pg/
    plugins:
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin

  - name: dashboard
    _comment: 'Studio: /* -> http://studio:3000/*'
    url: http://studio:3000/
    routes:
      - name: dashboard-all
        strip_path: true
        paths:
          - /
    plugins:
      - name: basic-auth
        config:
          hide_credentials: true
KONGEOF
}
echo "   ✅ Kong sans CORS"
echo ""

# 4. Corriger docker-compose.yml pour GoTrue CORS
echo "4️⃣ Configuration CORS dans docker-compose.yml..."

# Supprimer les anciennes variables CORS si elles existent
sed -i '/GOTRUE_CORS_ALLOWED_ORIGINS/d' "$DOCKER_COMPOSE"
sed -i '/GOTRUE_CORS_ALLOWED_HEADERS/d' "$DOCKER_COMPOSE"

# Trouver la ligne de GOTRUE_SITE_URL et ajouter les variables CORS juste après
sed -i '/GOTRUE_SITE_URL:/a\      GOTRUE_CORS_ALLOWED_ORIGINS: "*"\n      GOTRUE_CORS_ALLOWED_HEADERS: "authorization,content-type,apikey,x-client-info"' "$DOCKER_COMPOSE"

echo "   ✅ Variables CORS ajoutées"
echo ""

# 5. Vérifier la configuration
echo "5️⃣ Vérification de la configuration..."
if grep -q "GOTRUE_CORS_ALLOWED_ORIGINS" "$DOCKER_COMPOSE"; then
    echo "   ✅ GOTRUE_CORS_ALLOWED_ORIGINS: configuré"
    grep "GOTRUE_CORS_ALLOWED_ORIGINS" "$DOCKER_COMPOSE" | head -1
fi
if grep -q "GOTRUE_CORS_ALLOWED_HEADERS" "$DOCKER_COMPOSE"; then
    echo "   ✅ GOTRUE_CORS_ALLOWED_HEADERS: configuré"
    grep "GOTRUE_CORS_ALLOWED_HEADERS" "$DOCKER_COMPOSE" | head -1
fi
echo ""

# 6. Redémarrer les services
echo "6️⃣ Redémarrage des services..."
cd /root/supabase-1.24.09/docker
docker-compose down auth kong
sleep 2
docker-compose up -d auth kong
echo "   ✅ Services redémarrés"
echo ""

# 7. Attendre que les services soient prêts
echo "7️⃣ Attente du démarrage des services (10s)..."
sleep 10
echo ""

# 8. Test CORS preflight
echo "8️⃣ Test CORS preflight..."
curl -i -X OPTIONS https://api.bwcarpe.com/auth/v1/token?grant_type=password \
  -H "Origin: https://bwcarpe.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,apikey,authorization" 2>&1 | grep -E "HTTP|Access-Control"

echo ""
echo "✅ CORRECTION TERMINÉE !"
echo ""
echo "📋 Résumé des changements :"
echo "   - Kong : plugins CORS supprimés"
echo "   - GoTrue : variables CORS ajoutées"
echo "   - Services : redémarrés"
echo ""
echo "🧪 Teste maintenant dans le navigateur : https://bwcarpe.com/auth"
