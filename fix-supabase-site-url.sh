#!/bin/bash

###############################################################################
# SUPABASE PASSWORD RESET FIX SCRIPT
#
# This script fixes the password reset email links by updating the Site URL
# in your Supabase configuration.
#
# USAGE: Run this script on your Supabase server where docker-compose.yml exists
#   bash fix-supabase-site-url.sh
###############################################################################

echo ""
echo "======================================================================="
echo "        SUPABASE PASSWORD RESET CONFIGURATION FIX"
echo "======================================================================="
echo ""
echo "PROBLEM:"
echo "  Password reset emails link to: https://api.bwcarpe.com/auth/v1/verify"
echo "  This goes to the API server, not your app!"
echo ""
echo "SOLUTION:"
echo "  Update SITE_URL to: https://bwcarpe.com"
echo "  This makes links go directly to your app."
echo ""
echo "======================================================================="
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ ERROR: docker-compose.yml not found in current directory"
    echo ""
    echo "Please run this script from your Supabase installation directory:"
    echo "  cd /path/to/your/supabase"
    echo "  bash fix-supabase-site-url.sh"
    echo ""
    exit 1
fi

echo "✓ Found docker-compose.yml in current directory"
echo ""

# Find the .env file (could be in root or docker/ subdirectory)
ENV_FILE=""
if [ -f ".env" ]; then
    ENV_FILE=".env"
    echo "✓ Found .env file in current directory"
elif [ -f "docker/.env" ]; then
    ENV_FILE="docker/.env"
    echo "✓ Found .env file in docker/ subdirectory"
else
    echo "❌ ERROR: Cannot find .env file"
    echo ""
    echo "Looked in:"
    echo "  - ./.env"
    echo "  - ./docker/.env"
    echo ""
    echo "Please ensure the .env file exists."
    exit 1
fi

echo ""
echo "Current configuration:"
echo "----------------------------------------------------------------------"
grep -E "^(SITE_URL|ADDITIONAL_REDIRECT_URLS|GOTRUE_SITE_URL)=" "$ENV_FILE" 2>/dev/null || echo "  (No SITE_URL settings found)"
echo "----------------------------------------------------------------------"
echo ""

# Create backup
BACKUP_FILE="$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
echo "✓ Created backup: $BACKUP_FILE"
echo ""

# Update configuration
echo "Updating configuration..."
echo ""

# Create temporary file with updated settings
TMP_FILE=$(mktemp)

# Copy all lines except the ones we're updating
grep -v "^SITE_URL=" "$ENV_FILE" | \
grep -v "^ADDITIONAL_REDIRECT_URLS=" | \
grep -v "^GOTRUE_SITE_URL=" > "$TMP_FILE"

# Add the correct settings
echo "SITE_URL=https://bwcarpe.com" >> "$TMP_FILE"
echo "ADDITIONAL_REDIRECT_URLS=https://bwcarpe.com/**" >> "$TMP_FILE"
echo "GOTRUE_SITE_URL=https://bwcarpe.com" >> "$TMP_FILE"

# Replace original file
mv "$TMP_FILE" "$ENV_FILE"

echo "✓ Configuration updated!"
echo ""
echo "New configuration:"
echo "----------------------------------------------------------------------"
grep -E "^(SITE_URL|ADDITIONAL_REDIRECT_URLS|GOTRUE_SITE_URL)=" "$ENV_FILE"
echo "----------------------------------------------------------------------"
echo ""

# Prompt for restart
echo "======================================================================="
echo "                    RESTART REQUIRED"
echo "======================================================================="
echo ""
echo "Supabase must be restarted for the changes to take effect."
echo ""
read -p "Do you want to restart Supabase now? (y/n) " -n 1 -r
echo ""
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping Supabase services..."
    docker-compose down

    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to stop services"
        exit 1
    fi

    echo ""
    echo "Starting Supabase services with new configuration..."
    docker-compose up -d

    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to start services"
        exit 1
    fi

    echo ""
    echo "✓ Supabase restarted successfully!"
    echo ""
    echo "Waiting 10 seconds for services to initialize..."
    sleep 10

    echo ""
    echo "Checking service status..."
    docker-compose ps

else
    echo "⚠️  Restart skipped. You must restart manually for changes to take effect:"
    echo ""
    echo "  docker-compose down"
    echo "  docker-compose up -d"
    echo ""
fi

echo ""
echo "======================================================================="
echo "                        NEXT STEPS"
echo "======================================================================="
echo ""
echo "1. Go to: https://bwcarpe.com/auth"
echo ""
echo "2. Request a NEW password reset"
echo "   (Old emails will NOT work - they were generated with the old config)"
echo ""
echo "3. Check your email - the link should now be:"
echo "   https://bwcarpe.com/auth/reset-password#access_token=..."
echo ""
echo "4. Click the link - it should open your app with the reset form"
echo ""
echo "If it still doesn't work:"
echo "  - Check logs: docker-compose logs gotrue | grep -i site"
echo "  - Verify env: docker-compose exec gotrue env | grep SITE_URL"
echo "  - Ensure you requested a NEW reset (old ones won't work)"
echo ""
echo "======================================================================="
echo ""
