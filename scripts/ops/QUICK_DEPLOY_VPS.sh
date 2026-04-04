#!/bin/bash

###############################################################################
# QUICK DEPLOY SCRIPT - Deleted Courses Fix
# Run on VPS to deploy the latest fixes
###############################################################################

set -e  # Exit on any error

echo "🚀 Starting VPS Deployment..."
echo "=================================="

# SSH Details
VPS_HOST="root@187.127.132.137"
PROJECT_PATH="/root/technurture-labs"  # Update if different

# Step 1: SSH Check
echo "1️⃣  Checking VPS Connection..."
ssh $VPS_HOST "echo '✅ Connected to VPS'" || {
  echo "❌ Failed to connect to VPS"
  echo "💡 Make sure you have SSH key configured"
  exit 1
}

# Step 2: Pull Latest Changes
echo ""
echo "2️⃣  Pulling latest code..."
ssh $VPS_HOST "cd $PROJECT_PATH && git pull origin main" || {
  echo "❌ Git pull failed"
  exit 1
}

# Step 3: Stop App Container
echo ""
echo "3️⃣  Stopping app container..."
ssh $VPS_HOST "cd $PROJECT_PATH && docker-compose down app"

# Step 4: Clear Build Cache
echo ""
echo "4️⃣  Clearing Next.js cache..."
ssh $VPS_HOST "cd $PROJECT_PATH && docker exec LMS_app rm -rf .next || true"

# Step 5: Rebuild App
echo ""
echo "5️⃣  Rebuilding app container (this takes 2-3 minutes)..."
ssh $VPS_HOST "cd $PROJECT_PATH && docker-compose up -d app --build"

# Step 6: Wait for Build
echo ""
echo "⏳  Waiting for app to be ready..."
sleep 180  # 3 minutes

# Step 7: Clear Redis Cache
echo ""
echo "6️⃣  Clearing student dashboard caches..."
ssh $VPS_HOST "cd $PROJECT_PATH && docker exec LMS_redis redis-cli KEYS 'cache:student:*:dashboard' | xargs docker exec -i LMS_redis redis-cli DEL" || {
  echo "⚠️  Warning: Could not clear Redis caches (app might still work)"
}

# Step 8: Verify App is Running
echo ""
echo "7️⃣  Verifying app is running..."
ssh $VPS_HOST "cd $PROJECT_PATH && docker-compose logs app | grep 'Ready in' | tail -1" || {
  echo "⚠️  Warning: Could not verify app ready status"
}

# Step 9: Final Check
echo ""
echo "8️⃣  Final verification..."
ssh $VPS_HOST "cd $PROJECT_PATH && docker-compose ps | grep 'LMS_app.*Up'" && {
  echo ""
  echo "✅ ✅ ✅ DEPLOYMENT SUCCESSFUL! ✅ ✅ ✅"
  echo ""
  echo "📋 What to test:"
  echo "  1. Log in as student"
  echo "  2. See available courses in dashboard"
  echo "  3. Go to admin panel and DELETE a course"
  echo "  4. Refresh student dashboard (F5)"
  echo "  5. Course should be GONE"
  echo ""
  echo "🎉 All done! The deleted courses fix is now live."
} || {
  echo "❌ App container not running!"
  echo ""
  echo "📋 Debug steps:"
  echo "  ssh $VPS_HOST 'cd $PROJECT_PATH && docker-compose logs app | tail -50'"
}

