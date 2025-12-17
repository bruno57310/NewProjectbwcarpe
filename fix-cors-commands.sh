#!/bin/bash

# SUPABASE CONFIGURATION FIX SCRIPT
# Run this on your Supabase server

echo "================================================"
echo "SUPABASE PASSWORD RESET FIX"
echo "================================================"
echo ""
echo "Your password reset links currently go to:"
echo "  https://api.bwcarpe.com/auth/v1/verify"
echo ""
echo "They should go to:"
echo "  https://bwcarpe.com/auth/reset-password"
echo ""

# Find Supabase directory
if [ -f "docker-compose.yml" ]; then
    echo "✓ Found Supabase in current directory"
elif [ -f "../docker-compose.yml" ]; then
    cd ..
    echo "✓ Found Supabase in parent directory"
else
    echo "❌ Cannot find docker-compose.yml"
    echo ""
    echo "Please navigate to your Supabase directory first:"
    echo "  cd /path/to/supabase"
    echo "  bash fix-cors-commands.sh"
    exit 1
fi

# Find env file
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE="docker/.env"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Cannot find .env file"
    exit 1
fi

echo "✓ Found env file: $ENV_FILE"
echo ""

# Backup
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✓ Backup created"
echo ""

# Update SITE_URL
echo "Updating configuration..."

# Remove old SITE_URL lines
grep -v "^SITE_URL=" "$ENV_FILE" > "$ENV_FILE.tmp"
grep -v "^ADDITIONAL_REDIRECT_URLS=" "$ENV_FILE.tmp" > "$ENV_FILE.tmp2"
grep -v "^GOTRUE_SITE_URL=" "$ENV_FILE.tmp2" > "$ENV_FILE.tmp3"

# Add new ones
echo "SITE_URL=https://bwcarpe.com" >> "$ENV_FILE.tmp3"
echo "ADDITIONAL_REDIRECT_URLS=https://bwcarpe.com/**" >> "$ENV_FILE.tmp3"
echo "GOTRUE_SITE_URL=https://bwcarpe.com" >> "$ENV_FILE.tmp3"

mv "$ENV_FILE.tmp3" "$ENV_FILE"
rm -f "$ENV_FILE.tmp" "$ENV_FILE.tmp2"

echo "✓ Configuration updated"
echo ""
echo "New settings:"
grep "SITE_URL" "$ENV_FILE"
echo ""
echo "Restart Supabase now: docker-compose down && docker-compose up -d"
