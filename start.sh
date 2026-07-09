#!/bin/sh
set -e

echo "========================================="
echo "  DoxaRealm CMS — Starting Production"
echo "========================================="

echo ""
echo "[1/2] Applying Database Schema Migrations..."
npx drizzle-kit push
echo "[1/2] Database schema synced successfully."

echo ""
echo "[2/2] Starting Next.js Production Server..."
exec npm run start
