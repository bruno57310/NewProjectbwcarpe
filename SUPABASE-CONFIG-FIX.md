# SUPABASE CONFIGURATION FIX - REQUIRED

## THE PROBLEM

Your password reset emails link to: `https://api.bwcarpe.com/auth/v1/verify?token=...&redirect_to=https://bwcarpe.com/auth/reset-password`

**This URL never reaches your app!** The browser stays on the Supabase API server, which doesn't serve your React app.

## THE ROOT CAUSE

Your Supabase instance doesn't have the correct Site URL configured. It's using `api.bwcarpe.com` (the API) instead of `bwcarpe.com` (your app).

## THE SOLUTION

You **MUST** update your Supabase configuration. There's no code workaround for this.

---

## OPTION 1: Supabase Dashboard (Hosted Supabase)

If you're using hosted Supabase:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration
2. Set **Site URL** to: `https://bwcarpe.com`
3. Add to **Redirect URLs**:
   ```
   https://bwcarpe.com/**
   https://bwcarpe.com/auth/reset-password
   https://bwcarpe.com/auth/confirm
   ```
4. Click **Save**
5. Wait 2-3 minutes for changes to propagate
6. Request a NEW password reset email
7. The new email link should look like: `https://bwcarpe.com/auth/reset-password#access_token=xxx&...`

---

## OPTION 2: Self-Hosted Supabase (Docker)

If you're self-hosting Supabase:

### Step 1: Find your configuration file

Location is usually one of:
- `docker/.env`
- `supabase/.env`
- `kong.yml` or `gotrue.env`

### Step 2: Update these settings

```bash
# Your frontend URL (where users access your app)
SITE_URL=https://bwcarpe.com

# Your API URL (Supabase server)
API_EXTERNAL_URL=https://api.bwcarpe.com

# Allow redirects to your app
ADDITIONAL_REDIRECT_URLS=https://bwcarpe.com/**

# GoTrue (Auth service) settings
GOTRUE_SITE_URL=https://bwcarpe.com
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=false

# CORS settings for your app domain
CORS_ALLOWED_ORIGINS=https://bwcarpe.com,https://api.bwcarpe.com
```

### Step 3: Restart Supabase

```bash
# Navigate to your Supabase directory
cd /path/to/your/supabase

# Stop services
docker-compose down

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f gotrue
```

### Step 4: Verify the configuration

```bash
# Test that GoTrue is using correct Site URL
curl -X POST https://api.bwcarpe.com/auth/v1/recover \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email": "test@example.com"}'

# Check the response - it should NOT contain errors about redirect URLs
```

---

## OPTION 3: Environment Variables (If using Netlify/Vercel with Supabase)

If your Supabase is managed via environment variables:

Add these to your hosting platform (Netlify/Vercel):

```
SUPABASE_SITE_URL=https://bwcarpe.com
SUPABASE_REDIRECT_URLS=https://bwcarpe.com/**
```

Then restart your deployment.

---

## VERIFICATION STEPS

After updating configuration:

### 1. Request a NEW password reset

```bash
# The old emails won't work - you need a NEW one with the updated config
```

### 2. Check the email link format

The link should be ONE of these formats:

✅ **GOOD** - Direct to your app with tokens:
```
https://bwcarpe.com/auth/reset-password#access_token=xxx&refresh_token=yyy&type=recovery
```

✅ **GOOD** - Direct to your app with token_hash:
```
https://bwcarpe.com/auth/reset-password?token_hash=xxx&type=recovery
```

❌ **BAD** - Goes to API server (current problem):
```
https://api.bwcarpe.com/auth/v1/verify?token=xxx&type=recovery&redirect_to=https://bwcarpe.com/auth/reset-password
```

### 3. Click the link

- It should open your app immediately
- You should see the password reset form
- No error messages

---

## QUICK DIAGNOSTIC

**Check what Supabase thinks its Site URL is:**

```bash
curl -I https://api.bwcarpe.com/auth/v1/settings \
  -H "apikey: YOUR_ANON_KEY"
```

Look for `x-site-url` header in the response.

---

## IF YOU CAN'T ACCESS SUPABASE CONFIGURATION

If you don't have access to Supabase configuration (e.g., it's managed by someone else):

### Contact your Supabase administrator and ask them to:

1. Set Site URL to: `https://bwcarpe.com`
2. Add redirect URL: `https://bwcarpe.com/**`
3. Restart the GoTrue service

### Provide them this information:

```
We need to update the Supabase authentication configuration:

SITE_URL=https://bwcarpe.com
ADDITIONAL_REDIRECT_URLS=https://bwcarpe.com/**

This is required for password reset emails to work correctly.
The emails are currently linking to the API server instead of the app.
```

---

## AFTER CONFIGURATION UPDATE

Once configured correctly:

1. Request a NEW password reset (old links won't work)
2. Check the email - link should go to `bwcarpe.com`, not `api.bwcarpe.com`
3. Click the link - should open your app with the reset form
4. The app code is already updated to handle the tokens properly

---

## COMMON MISTAKES

❌ **Don't** use `api.bwcarpe.com` as Site URL - that's your API, not your app
❌ **Don't** try to proxy `/auth/v1/verify` to your app - Supabase needs to handle this
❌ **Don't** reuse old password reset emails - they were generated with wrong config
✅ **Do** set Site URL to where users access your app: `bwcarpe.com`
✅ **Do** request new emails after config change
✅ **Do** wait a few minutes after config change for it to propagate

---

## NEED HELP?

If you're still stuck:

1. Run the debug page: `https://bwcarpe.com/auth/reset-password-debug`
2. Paste the email link and screenshot the output
3. Check `docker-compose logs gotrue` for any errors
4. Verify environment variables are loaded: `docker-compose exec gotrue env | grep SITE_URL`
