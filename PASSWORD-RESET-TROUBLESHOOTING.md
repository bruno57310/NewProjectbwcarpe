# Password Reset Troubleshooting Guide

## Current Issue

The password reset link from email shows error: "Invalid or expired reset link. Please request a new password reset."

The URL format received: `https://api.bwcarpe.com/auth/v1/verify?token=6777def0c142b188f08a66d6b72ac80b0795046634544d8851162312&type=recovery&redirect_to=https://bwcarpe.com/auth/reset-password`

## Problem Analysis

The issue is that Supabase is using its **own verification endpoint** (`/auth/v1/verify`) before redirecting to your app. This is happening because:

1. Your Supabase instance is hosted at `api.bwcarpe.com`
2. Your app is hosted at `bwcarpe.com` (different domain)
3. Supabase needs to verify the token on its own server first, then redirect with session tokens

## Step 1: Use Debug Page

1. When you receive the password reset email, **DO NOT** click the link directly
2. Instead, change the URL to: `https://bwcarpe.com/auth/reset-password-debug`
3. Paste the FULL email link into your browser
4. Take a screenshot of all the debug information shown
5. This will tell us exactly what parameters Supabase is sending

## Step 2: Check Supabase Configuration

You need to configure your Supabase instance to properly handle redirects:

### In Supabase Dashboard (or Config):

1. **Site URL**: Should be `https://bwcarpe.com`
2. **Redirect URLs**: Add these to the allowed list:
   - `https://bwcarpe.com/**`
   - `https://bwcarpe.com/auth/reset-password`
   - `https://bwcarpe.com/auth/confirm`

### For Self-Hosted Supabase:

Check your configuration file (usually `docker/.env` or Kong/GoTrue config):

```bash
# Site URL (your frontend)
SITE_URL=https://bwcarpe.com

# API URL (your Supabase API)
API_EXTERNAL_URL=https://api.bwcarpe.com

# Redirect URLs (comma-separated)
ADDITIONAL_REDIRECT_URLS=https://bwcarpe.com/**,https://bwcarpe.com/auth/reset-password,https://bwcarpe.com/auth/confirm

# Disable email confirmation if SMTP is not configured
GOTRUE_MAILER_AUTOCONFIRM=true

# Enable secure email change
GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION=false
```

## Step 3: Test the Flow

After updating configuration:

1. **Restart Supabase services** (if self-hosted)
2. Request a new password reset
3. Check the email link format - it should either:
   - Redirect directly to your app with hash parameters: `https://bwcarpe.com/auth/reset-password#access_token=xxx&refresh_token=xxx&type=recovery`
   - OR redirect to your app after verification with the tokens in the hash

## Step 4: Alternative Solution (If Config Can't Be Changed)

If you cannot modify Supabase configuration, you can handle the redirect on the backend:

### Option A: Add a server-side redirect handler

Create a Netlify edge function or server endpoint at `/auth/v1/verify` that:
1. Receives the token from Supabase
2. Exchanges it for session tokens via Supabase API
3. Redirects to your app with tokens in the URL hash

### Option B: Use the verify endpoint directly

Modify the reset password request to not use `redirectTo`, and instead:
1. Send the reset email without redirect
2. User clicks the Supabase link directly
3. Supabase verifies and redirects to your configured Site URL
4. Your app extracts tokens from URL hash

## Current Code Changes

The code has been updated to:

1. ✅ Handle `token` parameter (from email links)
2. ✅ Handle `token_hash` parameter (from redirects)
3. ✅ Handle `access_token` + `refresh_token` in hash (from SPA redirects)
4. ✅ Better error messages showing what's missing
5. ✅ Increased timeout to 5 seconds to read error messages
6. ✅ Added detailed console logging
7. ✅ Added debug page at `/auth/reset-password-debug`

## Expected URL Formats

After proper configuration, you should see ONE of these:

### Format 1: Direct Supabase Redirect (Preferred)
```
https://bwcarpe.com/auth/reset-password#access_token=xxx&refresh_token=yyy&type=recovery
```

### Format 2: After Server Verification
```
https://bwcarpe.com/auth/reset-password?token_hash=xxx&type=recovery
```

### Format 3: Current (Problematic)
```
https://api.bwcarpe.com/auth/v1/verify?token=xxx&type=recovery&redirect_to=https://bwcarpe.com/auth/reset-password
```
*This doesn't work because the browser never reaches your app - it stays on the Supabase verify endpoint*

## Quick Fix Commands

For self-hosted Supabase, add these to your `.env` and restart:

```bash
# Navigate to your Supabase directory
cd /path/to/supabase

# Add to docker/.env
echo "SITE_URL=https://bwcarpe.com" >> docker/.env
echo "ADDITIONAL_REDIRECT_URLS=https://bwcarpe.com/**" >> docker/.env

# Restart services
docker-compose down
docker-compose up -d
```

## Testing Commands

Test the reset flow:

```bash
# Check browser console logs when visiting reset link
# You should see:
# - Full URL
# - Hash and Search parameters
# - Token verification attempts
# - Success or error messages
```

## Next Steps

1. Use the debug page to see what parameters you're actually receiving
2. Check/update your Supabase configuration
3. Request a new password reset after updating config
4. If still having issues, share the debug page output
