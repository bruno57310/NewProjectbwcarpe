# Configuration Supabase Self-Hosted - Corriger les Emails Signup et Password Reset

## 🔍 Problème

Les emails de confirmation et de reset pointent vers `api.bwcarpe.com` au lieu de `bwcarpe.com`.

En **self-hosted**, il n'y a pas de table `auth.email_templates`. Les templates sont configurés via **variables d'environnement** dans le service GoTrue (auth).

## 1. Modifications CORS (Kong) - ✅ FAIT

Le fichier `kong.yml` a été mis à jour pour inclure l'URL Netlify dans toutes les sections CORS :
- `https://fascinating-lily-bda1a3.netlify.app` ajouté à toutes les origines

## 2. Variables d'environnement à configurer sur le serveur

### Localisation du fichier de configuration

Dans votre installation Supabase self-hosted, vous devez modifier les variables d'environnement du service **auth** (GoTrue).

Si vous utilisez **Docker Compose**, ces variables se trouvent généralement dans :
- `.env` à la racine de votre installation Supabase
- Ou directement dans le `docker-compose.yml` sous le service `auth`

### Variables à ajouter/modifier

```bash
# =====================================================
# URLS DE BASE (OBLIGATOIRE)
# =====================================================

# Site URL = URL de votre FRONTEND (pas l'API !)
GOTRUE_SITE_URL=https://bwcarpe.com
# OU (selon version)
SITE_URL=https://bwcarpe.com

# URL de l'API Supabase
API_EXTERNAL_URL=https://api.bwcarpe.com

# URLs de redirection autorisées (séparées par des virgules)
GOTRUE_URI_ALLOW_LIST=https://bwcarpe.com/**,https://bwcarpe.com/auth/callback,https://bwcarpe.com/reset-password
# OU (selon version)
ADDITIONAL_REDIRECT_URLS=https://bwcarpe.com/**,https://bwcarpe.com/auth/callback,https://bwcarpe.com/reset-password

# =====================================================
# EMAIL SIGNUP / CONFIRMATION (IMPORTANT !)
# =====================================================

# URL de redirection pour la confirmation d'inscription
GOTRUE_MAILER_URLPATHS_CONFIRMATION=https://bwcarpe.com/auth/callback
# OU (selon version)
MAILER_URLPATHS_CONFIRMATION=https://bwcarpe.com/auth/callback

# Sujet de l'email de confirmation
GOTRUE_MAILER_SUBJECTS_CONFIRMATION="Confirmez votre email - BW Carpe"

# =====================================================
# EMAIL PASSWORD RESET
# =====================================================

# URL de redirection pour le reset de mot de passe
GOTRUE_MAILER_URLPATHS_RECOVERY=https://bwcarpe.com/reset-password
# OU (selon version)
MAILER_URLPATHS_RECOVERY=https://bwcarpe.com/reset-password

# Sujet de l'email de reset
GOTRUE_MAILER_SUBJECTS_RECOVERY="Réinitialisez votre mot de passe - BW Carpe"

# =====================================================
# AUTRES EMAILS (OPTIONNEL)
# =====================================================

# Invitation
GOTRUE_MAILER_URLPATHS_INVITE=https://bwcarpe.com/auth/callback
MAILER_URLPATHS_INVITE=https://bwcarpe.com/auth/callback

# Changement d'email
GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE=https://bwcarpe.com/auth/callback
MAILER_URLPATHS_EMAIL_CHANGE=https://bwcarpe.com/auth/callback

# Magic Link (si utilisé)
GOTRUE_MAILER_URLPATHS_MAGIC_LINK=https://bwcarpe.com/auth/callback
```

**IMPORTANT** : GoTrue accepte 2 formats de variables selon la version :
- Format moderne : `GOTRUE_*` (ex: `GOTRUE_SITE_URL`)
- Format legacy : Sans préfixe (ex: `SITE_URL`)

**Utilisez les deux pour être sûr !**

## 3. Étapes d'application

### Étape 1 : Modifier les variables d'environnement

**Option A : Via fichier .env**
```bash
# Sur votre serveur, éditez le fichier .env
nano /path/to/supabase/.env

# Ajoutez ou modifiez les variables ci-dessus
```

**Option B : Via docker-compose.yml**
```yaml
services:
  auth:
    image: supabase/gotrue:latest
    environment:
      # URLs de base
      GOTRUE_SITE_URL: "https://bwcarpe.com"
      SITE_URL: "https://bwcarpe.com"
      API_EXTERNAL_URL: "https://api.bwcarpe.com"

      # URLs autorisées
      GOTRUE_URI_ALLOW_LIST: "https://bwcarpe.com/**"
      ADDITIONAL_REDIRECT_URLS: "https://bwcarpe.com/**"

      # Email signup/confirmation
      GOTRUE_MAILER_URLPATHS_CONFIRMATION: "https://bwcarpe.com/auth/callback"
      MAILER_URLPATHS_CONFIRMATION: "https://bwcarpe.com/auth/callback"
      GOTRUE_MAILER_SUBJECTS_CONFIRMATION: "Confirmez votre email - BW Carpe"

      # Email password reset
      GOTRUE_MAILER_URLPATHS_RECOVERY: "https://bwcarpe.com/reset-password"
      MAILER_URLPATHS_RECOVERY: "https://bwcarpe.com/reset-password"
      GOTRUE_MAILER_SUBJECTS_RECOVERY: "Réinitialisez votre mot de passe"

      # Autres
      GOTRUE_MAILER_URLPATHS_INVITE: "https://bwcarpe.com/auth/callback"
      GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: "https://bwcarpe.com/auth/callback"
```

### Étape 2 : Mettre à jour le fichier kong.yml

```bash
# Copiez le nouveau kong.yml sur votre serveur
scp kong.yml votre-serveur:/path/to/supabase/docker/volumes/api/kong.yml
```

### Étape 3 : Redémarrer les services

```bash
# Sur votre serveur Supabase
cd /path/to/supabase

# Redémarrer le service auth
docker-compose restart auth

# Redémarrer Kong pour appliquer la nouvelle configuration CORS
docker-compose restart kong

# Vérifier les logs
docker-compose logs -f auth
docker-compose logs -f kong
```

## 4. Vérification

### Test 1 : Vérifier les variables d'environnement
```bash
# Vérifier que les variables sont bien prises en compte
docker-compose exec auth env | grep -E "GOTRUE_SITE_URL|SITE_URL|MAILER_URLPATHS"

# Vous devriez voir :
# GOTRUE_SITE_URL=https://bwcarpe.com
# GOTRUE_MAILER_URLPATHS_CONFIRMATION=https://bwcarpe.com/auth/callback
# GOTRUE_MAILER_URLPATHS_RECOVERY=https://bwcarpe.com/reset-password
```

### Test 2 : Tester le SIGNUP
1. Créer un nouveau compte sur `https://bwcarpe.com/auth`
2. Vérifier l'email reçu
3. **Le lien doit pointer vers** : `https://bwcarpe.com/auth/callback?token=pkce_xxx&type=signup`
4. **PAS vers** : `https://api.bwcarpe.com/auth/callback` ❌
5. Cliquer sur le lien → devrait confirmer l'email et connecter l'utilisateur

### Test 3 : Tester le PASSWORD RESET
1. Demander une réinitialisation de mot de passe
2. Vérifier l'email reçu
3. **Le lien doit pointer vers** : `https://bwcarpe.com/reset-password?code=xxx`
4. Cliquer sur le lien → devrait afficher le formulaire de nouveau mot de passe

### Test 3 : Vérifier les logs
```bash
# Logs du service auth
docker-compose logs -f auth | grep -i "recovery\|redirect"

# Logs de Kong pour CORS
docker-compose logs -f kong | grep -i "cors\|options"
```

## 5. Dépannage

### Problème : Les variables ne sont pas prises en compte
**Solution** : Redémarrer complètement le stack
```bash
docker-compose down
docker-compose up -d
```

### Problème : Erreur CORS persistante
**Solution** : Vérifier que Kong a bien rechargé la configuration
```bash
# Forcer le rechargement de la configuration Kong
docker-compose restart kong

# Ou recréer le conteneur
docker-compose up -d --force-recreate kong
```

### Problème : Le lien d'email ne fonctionne pas
**Solution** : Vérifier les templates d'email dans la base de données
```sql
-- Se connecter à la base Supabase
SELECT * FROM auth.config;

-- Vérifier les URLs configurées
SELECT
  name,
  value
FROM auth.config
WHERE name IN ('SITE_URL', 'ADDITIONAL_REDIRECT_URLS', 'MAILER_URLPATHS_RECOVERY');
```

## 6. Structure attendue dans les emails

### Email de confirmation (Signup)

Avant la correction ❌ :
```
https://api.bwcarpe.com/auth/callback?token=pkce_xxx&type=signup
```

Après la correction ✅ :
```
https://bwcarpe.com/auth/callback?token=pkce_xxx&type=signup
```

### Email de reset password

Avant la correction ❌ :
```
https://api.bwcarpe.com/auth/callback?token=xxx&type=recovery
```

Après la correction ✅ :
```
https://bwcarpe.com/reset-password?code=xxx
```

## 7. Checklist finale

- [ ] Variables `GOTRUE_SITE_URL` et `SITE_URL` = `https://bwcarpe.com`
- [ ] Variable `GOTRUE_MAILER_URLPATHS_CONFIRMATION` = `https://bwcarpe.com/auth/callback`
- [ ] Variable `GOTRUE_MAILER_URLPATHS_RECOVERY` = `https://bwcarpe.com/reset-password`
- [ ] Service `auth` redémarré : `docker-compose restart auth`
- [ ] Variables vérifiées : `docker-compose exec auth env | grep GOTRUE`
- [ ] Test d'inscription effectué → Email reçu
- [ ] Email de signup pointe vers `bwcarpe.com/auth/callback` ✅
- [ ] Clic sur le lien fonctionne → Utilisateur connecté
- [ ] Test de reset password effectué → Email reçu
- [ ] Email de reset pointe vers `bwcarpe.com/reset-password` ✅
- [ ] Formulaire de réinitialisation accessible

## Support

Si vous rencontrez des problèmes, vérifiez :
1. Les logs du service auth : `docker-compose logs auth`
2. Les logs de Kong : `docker-compose logs kong`
3. La console réseau du navigateur pour les erreurs CORS
4. Les variables d'environnement : `docker-compose exec auth env`
