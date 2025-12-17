# MANUAL FIX FOR PASSWORD RESET ISSUE

## The Problem

Your password reset email links go to:
```
https://api.bwcarpe.com/auth/v1/verify?token=...&redirect_to=https://bwcarpe.com/
```

This URL opens the Supabase API server, not your app. Your browser never reaches your React app.

## The Solution

Change Supabase's Site URL from `api.bwcarpe.com` to `bwcarpe.com`

---

## OPTION 1: Use the Automated Script

1. **Copy the script to your Supabase server:**
   ```bash
   scp fix-supabase-site-url.sh user@your-server:/path/to/supabase/
   ```

2. **SSH to your server:**
   ```bash
   ssh user@your-server
   ```

3. **Navigate to Supabase directory:**
   ```bash
   cd /path/to/supabase
   ```

4. **Run the script:**
   ```bash
   bash fix-supabase-site-url.sh
   ```

5. **Follow the prompts**

---

## OPTION 2: Manual Configuration

### Step 1: SSH to Your Supabase Server

```bash
ssh your-user@your-supabase-server
```

### Step 2: Find Your Supabase Directory

Usually one of these:
- `/home/user/supabase`
- `/opt/supabase`
- `/root/supabase`
- `/var/www/supabase`

```bash
cd /path/to/your/supabase
```

### Step 3: Check for docker-compose.yml

```bash
ls -la docker-compose.yml
```

If not found, you're in the wrong directory. Find it:
```bash
find / -name "docker-compose.yml" -path "*/supabase/*" 2>/dev/null
```

### Step 4: Find the .env File

The .env file could be in:
- Same directory as docker-compose.yml: `./.env`
- Docker subdirectory: `./docker/.env`

Check which one exists:
```bash
ls -la .env
ls -la docker/.env
```

### Step 5: Backup the .env File

```bash
# If .env is in root:
cp .env .env.backup.$(date +%Y%m%d)

# OR if .env is in docker/ subdirectory:
cp docker/.env docker/.env.backup.$(date +%Y%m%d)
```

### Step 6: Edit the .env File

```bash
# If .env is in root:
nano .env

# OR if .env is in docker/ subdirectory:
nano docker/.env
```

### Step 7: Add or Update These Lines

Find and update (or add if they don't exist):

```bash
SITE_URL=https://bwcarpe.com
ADDITIONAL_REDIRECT_URLS=https://bwcarpe.com/**
GOTRUE_SITE_URL=https://bwcarpe.com
```

**Tips:**
- Press `Ctrl+W` in nano to search for "SITE_URL"
- If the line exists, update it
- If it doesn't exist, add it at the end of the file
- Make sure there are NO spaces around the `=` sign
- Save: `Ctrl+O`, then Enter
- Exit: `Ctrl+X`

### Step 8: Verify Your Changes

```bash
grep "SITE_URL" .env
# OR
grep "SITE_URL" docker/.env
```

You should see:
```
SITE_URL=https://bwcarpe.com
ADDITIONAL_REDIRECT_URLS=https://bwcarpe.com/**
GOTRUE_SITE_URL=https://bwcarpe.com
```

### Step 9: Restart Supabase

```bash
docker-compose down
```

Wait for all services to stop, then:

```bash
docker-compose up -d
```

### Step 10: Check Services Are Running

```bash
docker-compose ps
```

All services should show "Up" status.

### Step 11: Check Logs (Optional)

```bash
docker-compose logs gotrue | grep -i site
```

You should see: `GOTRUE_SITE_URL=https://bwcarpe.com`

---

## Testing the Fix

### 1. Request a NEW Password Reset

- Go to: https://bwcarpe.com/auth
- Click "Forgot Password?"
- Enter your email
- Click "Send Reset Link"

**IMPORTANT:** You MUST request a NEW reset. Old emails were generated with the old configuration and won't work.

### 2. Check the Email

Open the password reset email. The link should be ONE of these formats:

✅ **CORRECT:**
```
https://bwcarpe.com/auth/reset-password#access_token=xxx&refresh_token=yyy&type=recovery
```

✅ **ALSO CORRECT:**
```
https://bwcarpe.com/auth/reset-password?token_hash=xxx&type=recovery
```

❌ **WRONG (your current issue):**
```
https://api.bwcarpe.com/auth/v1/verify?token=xxx&redirect_to=https://bwcarpe.com/
```

### 3. Click the Link

- The link should open your app at `bwcarpe.com`
- You should see the "Reset Password" form
- Enter your new password
- Click "Reset Password"
- You should see a success message

---

## Troubleshooting

### Issue: Link still goes to api.bwcarpe.com

**Check 1: Did you restart Supabase?**
```bash
docker-compose ps
```
All services should be recently started.

**Check 2: Is the config loaded?**
```bash
docker-compose exec gotrue env | grep SITE_URL
```
Should show: `SITE_URL=https://bwcarpe.com`

**Check 3: Did you request a NEW reset?**
Old reset emails use the old configuration. You must request a new one.

### Issue: Services won't start

**Check logs:**
```bash
docker-compose logs --tail=50
```

**Common issue: Syntax error in .env**
Make sure:
- No spaces around `=`
- No quotes around the URL (unless already there)
- Each setting on its own line

### Issue: "Redirect URL not allowed"

Add more redirect URLs:
```bash
ADDITIONAL_REDIRECT_URLS=https://bwcarpe.com/**,https://bwcarpe.com/auth/reset-password,https://bwcarpe.com/auth/confirm
```

Then restart:
```bash
docker-compose down && docker-compose up -d
```

---

## Need More Help?

### Provide This Information:

1. **Current SITE_URL:**
   ```bash
   grep SITE_URL .env
   ```

2. **Docker services status:**
   ```bash
   docker-compose ps
   ```

3. **GoTrue logs:**
   ```bash
   docker-compose logs gotrue | tail -50
   ```

4. **Environment variables:**
   ```bash
   docker-compose exec gotrue env | grep -E "(SITE|REDIRECT)"
   ```

5. **The actual email link you receive** (sanitize the token)

---

## Quick Reference

| Configuration | Current (Wrong) | Should Be (Correct) |
|--------------|-----------------|---------------------|
| SITE_URL | `https://api.bwcarpe.com` | `https://bwcarpe.com` |
| Email Link | `https://api.bwcarpe.com/auth/v1/verify?...` | `https://bwcarpe.com/auth/reset-password#...` |
| Browser Opens | Supabase API server (error page) | Your React app (reset form) |

---

## Files in This Project

- `fix-supabase-site-url.sh` - Automated fix script
- `MANUAL-FIX-STEPS.md` - This file (manual instructions)
- `SUPABASE-CONFIG-FIX.md` - Detailed technical explanation
- `PASSWORD-RESET-TROUBLESHOOTING.md` - Troubleshooting guide
