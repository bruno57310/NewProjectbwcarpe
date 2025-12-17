# Fix Email Signup URL Configuration

## Problème

Les emails de confirmation d'inscription pointent vers `https://api.bwcarpe.com/auth/callback` au lieu de `https://bwcarpe.com/auth/callback`.

Erreur reçue : `{"code":400,"error_code":"bad_oauth_callback","msg":"OAuth state parameter missing"}`

## Solution

### 1. Modifier la configuration Supabase (Self-Hosted)

Dans votre instance Supabase self-hosted, modifiez les variables d'environnement suivantes :

#### Option A : Fichier docker-compose.yml ou .env de Supabase

```yaml
# Dans le service Kong ou API
environment:
  # Site URL = URL de votre APPLICATION FRONTEND
  SITE_URL: "https://bwcarpe.com"

  # Redirect URLs autorisés (séparés par des virgules)
  ADDITIONAL_REDIRECT_URLS: "https://bwcarpe.com/auth/callback,https://bwcarpe.com/reset-password"

  # Pour les emails
  API_EXTERNAL_URL: "https://api.bwcarpe.com"
```

#### Option B : Via l'interface Supabase (si accessible)

1. Allez dans **Authentication** > **URL Configuration**
2. **Site URL** : `https://bwcarpe.com`
3. **Redirect URLs** : Ajoutez :
   - `https://bwcarpe.com/auth/callback`
   - `https://bwcarpe.com/reset-password`
   - `https://bwcarpe.com/**` (pour autoriser tous les chemins)

### 2. Vérifier les templates d'email

Les templates d'email dans Supabase utilisent la variable `{{ .SiteURL }}` ou `{{ .ConfirmationURL }}`.

Assurez-vous que vos templates ressemblent à :

#### Email de confirmation (Signup)
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

#### Email de reset password
```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

**IMPORTANT** : La variable `{{ .ConfirmationURL }}` est automatiquement générée par Supabase en utilisant le `SITE_URL` configuré.

### 3. Redémarrer les services

Après modification de la configuration :

```bash
# Si vous utilisez Docker Compose
docker-compose restart kong
docker-compose restart auth

# Ou redémarrer tous les services
docker-compose down
docker-compose up -d
```

### 4. Tester

1. **Créer un nouveau compte** sur https://bwcarpe.com/auth
2. **Vérifier l'email** reçu
3. Le lien doit maintenant pointer vers `https://bwcarpe.com/auth/callback?token=pkce_...&type=signup`

## Vérification des URLs

Les URLs correctes sont :

| Type | URL correcte | ❌ URL incorrecte actuelle |
|------|-------------|---------------------------|
| Site URL | `https://bwcarpe.com` | `https://api.bwcarpe.com` |
| Email Signup | `https://bwcarpe.com/auth/callback?token=...&type=signup` | `https://api.bwcarpe.com/auth/callback?token=...&type=signup` |
| Password Reset | `https://bwcarpe.com/reset-password?code=...` | ✅ Déjà corrigé |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend Application                           │
│  https://bwcarpe.com                           │
│  - Gère l'UI et l'interaction utilisateur      │
│  - Reçoit les callbacks d'authentification     │
└──────────────────┬──────────────────────────────┘
                   │
                   │ API Calls
                   │
┌──────────────────▼──────────────────────────────┐
│  Supabase Backend API                           │
│  https://api.bwcarpe.com                       │
│  - Authentification                             │
│  - Base de données                              │
│  - Génère les emails avec SITE_URL             │
└─────────────────────────────────────────────────┘
```

## Points clés

- **SITE_URL** = URL de votre frontend (`https://bwcarpe.com`)
- **API_EXTERNAL_URL** = URL de votre API Supabase (`https://api.bwcarpe.com`)
- Les emails doivent rediriger vers le **frontend**, pas l'API
- Le frontend appelle ensuite l'API pour vérifier les tokens
