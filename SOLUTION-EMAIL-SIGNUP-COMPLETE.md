# Solution Complète - Corriger les Liens d'Email Signup

## 🔍 Problème

Les emails de confirmation pointent vers `https://api.bwcarpe.com/auth/callback` au lieu de `https://bwcarpe.com/auth/callback`.

**Erreur reçue :** `{"code":400,"error_code":"bad_oauth_callback","msg":"OAuth state parameter missing"}`

## ✅ Solutions (par ordre de priorité)

---

## Solution 1 : Modifier les Templates d'Email (RECOMMANDÉ)

### Étape 1 : Se connecter à la base de données Supabase

```bash
# Via psql
psql "postgresql://postgres:[VOTRE_PASSWORD]@api.bwcarpe.com:5432/postgres"
```

Ou via l'interface web Supabase Studio : `https://api.bwcarpe.com` → SQL Editor

### Étape 2 : Exécuter le script SQL

```sql
-- Voir les templates actuels
SELECT id, name, subject FROM auth.email_templates;

-- Corriger le template de SIGNUP/CONFIRMATION
UPDATE auth.email_templates
SET
  subject = 'Confirm Your Email',
  body = '<h2>Bienvenue sur BW Carpe !</h2>
<p>Merci de vous être inscrit. Veuillez confirmer votre adresse email :</p>
<p><a href="https://bwcarpe.com/auth/callback?token={{ .Token }}&type=signup">Confirmer mon email</a></p>
<p>Ce lien expire dans 24 heures.</p>'
WHERE name IN ('confirmation', 'confirm', 'signup');

-- Vérifier
SELECT name, subject,
  CASE
    WHEN body LIKE '%bwcarpe.com%' AND body NOT LIKE '%api.bwcarpe.com%' THEN '✅ OK'
    ELSE '❌ Problème'
  END as status
FROM auth.email_templates;
```

### Étape 3 : Tester

1. Créer un nouveau compte sur https://bwcarpe.com/auth
2. Vérifier l'email reçu
3. Le lien doit maintenant pointer vers `https://bwcarpe.com/auth/callback`

✅ **Si ça marche, c'est terminé !**

---

## Solution 2 : Créer une Redirection Côté API (Alternative)

Si vous ne pouvez pas modifier les templates, créez une redirection automatique sur le serveur API.

### Option A : Via Kong Gateway

Modifiez votre fichier `kong.yml` pour ajouter une redirection :

```yaml
services:
  - name: auth-redirect
    url: http://localhost:9999  # Service fictif
    routes:
      - name: auth-callback-redirect
        paths:
          - /auth/callback
        methods:
          - GET
        plugins:
          - name: request-termination
            config:
              status_code: 302
              content_type: text/html
              body: |
                <html>
                  <head>
                    <meta http-equiv="refresh" content="0; url=https://bwcarpe.com/auth/callback?{{ .QueryString }}">
                  </head>
                  <body>Redirecting...</body>
                </html>
```

### Option B : Via Nginx (si vous utilisez Nginx devant Supabase)

```nginx
server {
    server_name api.bwcarpe.com;

    location /auth/callback {
        # Capturer les query params
        return 302 https://bwcarpe.com/auth/callback$is_args$args;
    }

    # Reste de la configuration...
}
```

### Option C : Via Traefik (si vous utilisez Traefik)

```yaml
http:
  middlewares:
    auth-callback-redirect:
      redirectRegex:
        regex: "^https://api.bwcarpe.com/auth/callback(.*)"
        replacement: "https://bwcarpe.com/auth/callback${1}"
        permanent: false

  routers:
    auth-callback:
      rule: "Host(`api.bwcarpe.com`) && Path(`/auth/callback`)"
      middlewares:
        - auth-callback-redirect
```

---

## Solution 3 : Créer une Edge Function Supabase

Créez une edge function qui gère la redirection :

```typescript
// supabase/functions/auth-redirect/index.ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Extraire tous les paramètres
  const url = new URL(req.url);
  const params = url.searchParams;

  // Construire l'URL de redirection
  const redirectUrl = new URL("https://bwcarpe.com/auth/callback");
  params.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });

  console.log('🔄 Redirecting to:', redirectUrl.toString());

  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      "Location": redirectUrl.toString(),
    },
  });
});
```

Puis modifiez le template d'email pour pointer vers cette fonction :

```sql
UPDATE auth.email_templates
SET body = '<p><a href="https://api.bwcarpe.com/functions/v1/auth-redirect?token={{ .Token }}&type=signup">Confirmer</a></p>'
WHERE name IN ('confirmation', 'confirm', 'signup');
```

---

## 🧪 Vérification Post-Installation

### Test 1 : Créer un compte

```bash
curl -X POST 'https://api.bwcarpe.com/auth/v1/signup' \
  -H "apikey: VOTRE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test 2 : Vérifier l'email

L'email doit contenir un lien vers :
- ✅ `https://bwcarpe.com/auth/callback?token=...`
- ❌ PAS `https://api.bwcarpe.com/auth/callback?token=...`

### Test 3 : Cliquer sur le lien

Le navigateur doit :
1. Ouvrir `https://bwcarpe.com/auth/callback`
2. Afficher "Vérification en cours..."
3. Rediriger vers la page d'accueil une fois connecté

---

## 🎯 Récapitulatif

| Solution | Difficulté | Recommandé | Permanent |
|----------|-----------|------------|-----------|
| Modifier templates SQL | Facile | ✅ OUI | ✅ OUI |
| Redirection Kong/Nginx | Moyen | ⚠️ Si SQL impossible | ✅ OUI |
| Edge Function | Moyen | ⚠️ Workaround | ⚠️ Non optimal |

---

## 📝 Fichiers Créés

- `fix-all-email-templates.sql` - Script SQL complet pour corriger tous les templates
- `SOLUTION-EMAIL-SIGNUP-COMPLETE.md` - Ce document

---

## ❓ Besoin d'Aide ?

Si aucune solution ne fonctionne, vérifiez :

1. **Logs Supabase Auth** : `docker logs <container-auth>`
2. **Version Supabase** : Certaines versions utilisent `auth.config` au lieu de `auth.email_templates`
3. **Permissions** : Assurez-vous que le user postgres a les droits sur `auth.email_templates`

```sql
-- Vérifier les permissions
\dp auth.email_templates

-- Si nécessaire, donner les permissions
GRANT ALL ON auth.email_templates TO postgres;
```
