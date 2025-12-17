# 🎯 SOLUTION FINALE : DÉSACTIVER CORS DE KONG

## Le problème
Kong ajoute automatiquement le header `x-Supabase-api-version` qui casse le parsing CORS du navigateur.

## La solution
Laisser GoTrue gérer CORS nativement au lieu de Kong.

---

## 📋 ÉTAPES À SUIVRE :

### 1️⃣ Remplace kong.yml

```bash
ssh root@api.bwcarpe.com

# Backup
cp /root/supabase-1.24.09/docker/volumes/api/kong.yml /root/kong.yml.backup-$(date +%Y%m%d-%H%M%S)

# Remplace le fichier
nano /root/supabase-1.24.09/docker/volumes/api/kong.yml
```

**Copie ce contenu (SANS plugins CORS) :**

```yaml
_format_version: '2.1'
_transform: true

consumers:
  - username: DASHBOARD
  - username: anon
    keyauth_credentials:
      - key: ${SUPABASE_ANON_KEY}
  - username: service_role
    keyauth_credentials:
      - key: ${SUPABASE_SERVICE_KEY}

acls:
  - consumer: anon
    group: anon
  - consumer: service_role
    group: admin

basicauth_credentials:
  - consumer: DASHBOARD
    username: $DASHBOARD_USERNAME
    password: $DASHBOARD_PASSWORD

services:
  - name: auth-v1
    url: http://auth:9999/
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - /auth/v1
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
    url: http://storage:5000/
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - /storage/v1/

  - name: functions-v1
    url: http://functions:9000/
    routes:
      - name: functions-v1-all
        strip_path: true
        paths:
          - /functions/v1/

  - name: analytics-v1
    url: http://analytics:4000/
    routes:
      - name: analytics-v1-all
        strip_path: true
        paths:
          - /analytics/v1/

  - name: meta
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
```

**Sauvegarde : Ctrl+O, Enter, Ctrl+X**

---

### 2️⃣ Configure GoTrue pour gérer CORS

```bash
# Édite le docker-compose.yml
cd /root/supabase-1.24.09/docker
nano docker-compose.yml
```

**Dans la section `auth:` (service GoTrue), ajoute ces variables d'environnement :**

```yaml
auth:
  container_name: supabase-auth
  image: supabase/gotrue:v2.143.0
  environment:
    # ... autres variables existantes ...
    
    # ⬇️ AJOUTE CES LIGNES :
    GOTRUE_CORS_ALLOWED_ORIGINS: "*"
    GOTRUE_CORS_ALLOWED_HEADERS: "authorization,content-type,apikey,x-client-info"
```

**Sauvegarde : Ctrl+O, Enter, Ctrl+X**

---

### 3️⃣ Redémarre les services

```bash
cd /root/supabase-1.24.09/docker
docker-compose restart auth
docker-compose restart kong
```

---

### 4️⃣ Teste CORS

```bash
curl -I -X OPTIONS https://api.bwcarpe.com/auth/v1/recover \
  -H "Origin: https://bwcarpe.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

**Tu devrais voir :**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: authorization, content-type, apikey, x-client-info
```

**SANS** le header corrompu `x-Supabase-api-version` ! ✅

---

## 🎯 Pourquoi ça va marcher ?

1. **Kong ne touche plus aux headers CORS** → pas de pollution
2. **GoTrue gère CORS nativement** → headers propres et valides
3. **Le navigateur peut parser les headers** → plus d'erreur CORS

---

## 🆘 Si ça ne marche toujours pas

Vérifie les logs :
```bash
docker logs supabase-auth --tail 100
docker logs supabase-kong --tail 100
```
