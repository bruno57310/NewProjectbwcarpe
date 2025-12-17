# SOLUTION FINALE CORS - Supabase Self-Hosted

## Diagnostic

**cURL fonctionne** ✅ mais **navigateur échoue** ❌

Erreur : `Cannot parse Access-Control-Allow-Headers response header field in preflight response`

## Cause

Les en-têtes CORS de GoTrue sont mal configurés dans `docker-compose.yml`

## Solution Automatique

```bash
# Copier le script sur le serveur
scp fix-cors-auto.sh root@bwcarpe.com:/root/

# Se connecter au serveur
ssh root@bwcarpe.com

# Rendre le script exécutable
chmod +x /root/fix-cors-auto.sh

# Exécuter
./fix-cors-auto.sh
```

## Solution Manuelle (si le script échoue)

### 1. Modifier docker-compose.yml

```bash
nano /root/supabase-1.24.09/docker/docker-compose.yml
```

Dans la section `auth:` > `environment:`, ajouter ces deux lignes après `GOTRUE_SITE_URL:` :

```yaml
      GOTRUE_CORS_ALLOWED_ORIGINS: "*"
      GOTRUE_CORS_ALLOWED_HEADERS: "authorization,content-type,apikey,x-client-info"
```

### 2. Remplacer kong.yml

```bash
# Backup
cp /root/supabase-1.24.09/docker/volumes/api/kong.yml /root/kong.yml.backup

# Copier la version sans CORS
cp /root/supabase-1.24.09/docker/volumes/api/kong-final.yml /root/supabase-1.24.09/docker/volumes/api/kong.yml
```

### 3. Redémarrer les services

```bash
cd /root/supabase-1.24.09/docker
docker-compose restart auth kong
```

### 4. Vérifier

Attendre 10 secondes puis :

```bash
# Test preflight
curl -i -X OPTIONS https://api.bwcarpe.com/auth/v1/token?grant_type=password \
  -H "Origin: https://bwcarpe.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,apikey,authorization"
```

Vous devriez voir :

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE
Access-Control-Allow-Headers: authorization,content-type,apikey,x-client-info
```

## Test Final

Ouvrir https://bwcarpe.com/auth dans le navigateur et essayer de se connecter.

## En cas d'échec

1. Vérifier les logs :
```bash
cd /root/supabase-1.24.09/docker
docker-compose logs auth | tail -50
docker-compose logs kong | tail -50
```

2. Vérifier la configuration :
```bash
grep -A 5 "GOTRUE_CORS" /root/supabase-1.24.09/docker/docker-compose.yml
```

## Différence entre cURL et Navigateur

- **cURL** : Envoie directement la requête POST (pas de preflight)
- **Navigateur** : Envoie d'abord OPTIONS (preflight) puis POST

Le problème était que la réponse au preflight OPTIONS avait des en-têtes mal formatés.

## Format Correct des Headers

```yaml
# ❌ INCORRECT (avec guillemets dans la valeur)
GOTRUE_CORS_ALLOWED_HEADERS: "\"authorization\",\"content-type\""

# ✅ CORRECT (virgules simples sans guillemets internes)
GOTRUE_CORS_ALLOWED_HEADERS: "authorization,content-type,apikey,x-client-info"
```
