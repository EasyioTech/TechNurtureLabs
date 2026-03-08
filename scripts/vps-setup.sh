#!/bin/sh

# LMS VPS Initialization Script
# This runs INSIDE the docker container to handle DB setup on restricted VPS environments.

echo "--------------------------------------------------"
echo "🚀 Starting Production DB Initialization"
echo "--------------------------------------------------"

# 1. Apply Audit Fixes & Migration 0005
echo "\n📦 Step 1: Applying Database Schema & Audit Fixes..."
npx tsx scripts/apply-migrations.ts

# 1.5 Emergency Column Fix (Favicon etc)
echo "\n🩺 Step 1.5: Verifying Critical Columns..."
npx tsx scripts/fix-platform-settings.ts

# 2. Seed Core Data (Classes, Plans, Achievements)
echo "\n🌱 Step 2: Seeding Core Platforms Data..."
npm run db:seed

# 3. Ensure Super Admin Exists
echo "\n👤 Step 3: Ensuring Super Admin Account..."
npx tsx scripts/create-admin.ts

echo "\n--------------------------------------------------"
echo "✅ VPS Setup Complete!"
echo "--------------------------------------------------"
