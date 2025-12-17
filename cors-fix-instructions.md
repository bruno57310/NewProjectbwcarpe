# 🔧 Instructions pour corriger CORS

## Problème identifié
L'erreur "Failed to fetch" indique un problème CORS entre votre frontend et votre instance Supabase self-hosted.

**Frontend URL:** `https://localhost:5173` (ou votre URL actuelle)
**Backend URL:** Votre instance Supabase self-hosted

## Solutions selon votre configuration

### Si vous utilisez Kong (configuration Supabase standard)

1. **Modifiez votre docker-compose.yml** pour ajouter les variables CORS à Kong :

```yaml
services:
  kong:
    environment:
      - KONG_PLUGINS=request-id,kong-offline-plugins,basic-auth,key-auth,cors
      - KONG_CORS_ORIGINS=https://localhost:5173,http://localhost:5173,https://127.0.0.1:5173,http://127.0.0.1:5173,*
      - KONG_CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH
      - KONG_CORS_HEADERS=Origin,X-Requested-With,Content-Type,Accept,Authorization,apikey,x-client-info
      - KONG_CORS_CREDENTIALS=true
      - KONG_CORS_MAX_AGE=86400
```

2. **Redémarrez vos services** :
```bash
docker-compose down
docker-compose up -d
```

### Si vous utilisez Traefik

1. **Ajoutez ces labels à votre service** dans docker-compose.yml :

```yaml
labels:
  - "traefik.http.middlewares.cors.headers.accesscontrolalloworiginlist=https://localhost:5173,http://localhost:5173,*"
  - "traefik.http.middlewares.cors.headers.accesscontrolallowmethods=GET,POST,PUT,DELETE,OPTIONS,PATCH"
  - "traefik.http.middlewares.cors.headers.accesscontrolallowheaders=Origin,X-Requested-With,Content-Type,Accept,Authorization,apikey,x-client-info"
  - "traefik.http.middlewares.cors.headers.accesscontrolmaxage=86400"
  - "traefik.http.routers.supabase.middlewares=cors"
```

### Alternative: Configuration directe dans docker-compose.yml

Si vous utilisez une configuration personnalisée, ajoutez ces variables d'environnement :

```yaml
services:
  your-supabase-service:
    environment:
      - CORS_ALLOWED_ORIGINS=https://localhost:5173,http://localhost:5173,*
      - CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH
      - CORS_ALLOWED_HEADERS=Origin,X-Requested-With,Content-Type,Accept,Authorization,apikey,x-client-info
      - CORS_ALLOW_CREDENTIALS=true
      - CORS_MAX_AGE=86400
```

**Important:** Remplacez `your-supabase-service` par le nom réel de votre service.

## Vérification

1. **Testez la connectivité** avec le bouton "Test Login (Debug)"
2. **Vérifiez les logs** dans la console du navigateur
3. **Confirmez que votre instance Supabase** répond sur l'URL configurée

## URLs à vérifier

- Frontend: https://localhost:5173 (ou votre URL actuelle)
- Supabase: https://api.bwcarpe.com (selon votre .env)

## Si le problème persiste

1. Vérifiez que votre instance Supabase est accessible
2. Testez avec curl :
```bash
curl -i -X OPTIONS \
  -H "Origin: https://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,apikey,content-type" \
  https://api.bwcarpe.com/auth/v1/token
```

3. Vérifiez les logs de votre instance Supabase :
```bash
docker-compose logs -f kong  # Pour Kong
docker-compose logs -f traefik  # Pour Traefik
```

4. Testez avec un navigateur différent ou en mode incognito

5. Vérifiez que votre certificat SSL est valide (si vous utilisez HTTPS)

6. Contactez votre administrateur système si le problème persiste
