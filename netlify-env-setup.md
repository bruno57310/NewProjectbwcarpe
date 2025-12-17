# Configure Netlify Environment Variables for Self-hosted Supabase

## Problem
Your production app on Netlify is not connecting to your self-hosted Supabase database because the environment variables are not configured in Netlify.

## Solution

### 1. Go to Netlify Dashboard
1. Log in to [Netlify](https://app.netlify.com)
2. Find your deployed site (bwcarpe.com)
3. Click on "Site settings"
4. Go to "Environment variables" in the left sidebar

### 2. Add Your Self-hosted Supabase Environment Variables

Add these environment variables with the EXACT same values from your local `.env` file:

```
VITE_SUPABASE_URL=https://api.bwcarpe.com
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjIwNjg3NzEzNzgsImlhdCI6MTc1MzIzODU3OCwiaXNzIjoic3VwYWJhc2UiLCJyb2xlIjoiYW5vbiJ9.OrdueEchupFeYux3ruESsvH7WMfjoU-Ivma2mTfHTyo
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjIwNjg3NzE0ODYsImlhdCI6MTc1MzIzODY4NiwiaXNzIjoic3VwYWJhc2UiLCJyb2xlIjoic2VydmljZV9yb2xlIn0.ap9Kze4zcgBJBCzb0OyzvNUOyh2-L7q0Sp0EjMWnVyw
VITE_HTTP_BASIC_USER=supabase
VITE_HTTP_BASIC_PASSWORD=Psxcopy_1967
```

### 3. Add Other Environment Variables (if needed)
Also add any other environment variables your app needs:

```
RESEND_API_KEY=re_4C2YBpnB_HzkAqc2SBWJvuX4i76YPTo56
VITE_LOOPS_API_KEY=your_loops_api_key_here
VITE_PAYPAL_CLIENT_ID=Ac65bm4xO26j-_gQ-Eo9xpDCqY7Rk6xXcT433stsCDQObpevp-doKDMiFTvQIUoVduqHtJaAIf07l-St
JWT_SECRET=mysecretkey
N8N_USER=myuser
N8N_PASSWORD=mypassword
N8N_URL=https://n8n.srv815941.hstgr.cloud/webhook/my-secure-webhook
```

### 4. Redeploy Your Site
After adding the environment variables:
1. Go to "Deploys" tab in Netlify
2. Click "Trigger deploy" → "Deploy site"
3. Wait for the deployment to complete

### 5. Verify the Connection
Once redeployed, your production site should connect to your self-hosted Supabase database at `https://api.bwcarpe.com`.

## Important Notes

- **Environment variables are case-sensitive** - make sure they match exactly
- **VITE_ prefix is required** for Vite to include them in the build
- **Redeploy is required** after adding environment variables
- **Check CORS configuration** on your self-hosted Supabase if you still have issues

## Troubleshooting

If you still have issues after setting environment variables:

1. **Check the browser console** on your production site for any CORS errors
2. **Verify your self-hosted Supabase CORS configuration** allows requests from `https://bwcarpe.com`
3. **Test the connection** by opening browser dev tools and checking the Network tab for failed requests

Your self-hosted Supabase needs to allow CORS requests from your production domain (`https://bwcarpe.com`) in addition to localhost.
