#!/bin/sh
set -e

echo "Applying Database Migrations..."
npx drizzle-kit push

echo "Starting Production Church Management Server..."
npm run start
