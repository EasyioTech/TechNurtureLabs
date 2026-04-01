#!/bin/bash
# ============================================================================
# TechNurture Labs — VPS Fresh Deployment Script
# Run this on your VPS as root after pulling the latest code
# ============================================================================

set -e

echo "🚀 TechNurture Labs — Fresh VPS Deployment"
echo "============================================================================"

# Step 1: Navigate to project
cd ~/TechNurtureLabs || exit 1
echo "✅ Working directory: $(pwd)"

# Step 2: Pull latest code
echo ""
echo "📥 Pulling latest code from GitHub..."
git fetch origin
git pull origin main
echo "✅ Code pulled successfully"

# Step 3: Copy production env (if not exists)
echo ""
echo "🔐 Setting up environment variables..."
if [ ! -f .env ]; then
    echo "   Creating .env from .env.production..."
    cp .env.production .env
    echo "   ⚠️  IMPORTANT: Review .env for secrets. Update these values:"
    echo "      - JWT_SECRET (should be unique)"
    echo "      - APP_ENCRYPTION_KEY (should be unique)"
    echo "      - RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (if using payments)"
    echo "      - CLOUDFLARE credentials (if using R2 storage)"
else
    echo "   ✅ .env already exists, keeping existing values"
fi

# Step 4: Fix Redis kernel setting (REQUIRED)
echo ""
echo "🔧 Configuring Linux kernel for Redis..."
if grep -q "vm.overcommit_memory" /etc/sysctl.conf; then
    echo "   vm.overcommit_memory already set"
else
    echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf > /dev/null
    echo "   ✅ Added vm.overcommit_memory = 1"
fi
sudo sysctl vm.overcommit_memory=1 > /dev/null 2>&1 || true
echo "   ✅ Kernel configured"

# Step 5: Stop and clean Docker
echo ""
echo "🛑 Stopping Docker containers..."
docker compose down -v 2>/dev/null || true
sleep 2
echo "✅ Containers stopped and volumes cleaned"

# Step 6: Build image (fresh)
echo ""
echo "🔨 Building Docker image (this may take 2-3 minutes)..."
docker compose build --no-cache
echo "✅ Docker image built successfully"

# Step 7: Start containers
echo ""
echo "🚀 Starting containers..."
docker compose up -d
echo "✅ Containers started"

# Step 8: Wait for app to be healthy
echo ""
echo "⏳ Waiting for application to be healthy (max 2 minutes)..."
max_attempts=24
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker ps | grep -q "LMS_app.*healthy"; then
        echo "✅ Application is healthy!"
        break
    fi
    if docker ps | grep -q "LMS_app.*unhealthy"; then
        echo "❌ Application failed to start. Checking logs..."
        docker compose logs LMS_app | tail -50
        exit 1
    fi
    echo "   Attempt $attempt/$max_attempts..."
    sleep 5
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Application did not start within timeout"
    docker compose logs LMS_app | tail -50
    exit 1
fi

# Step 9: Verify all containers
echo ""
echo "📊 Container Status:"
docker compose ps
echo ""
echo "✅ All containers running!"

# Step 10: Show login credentials
echo ""
echo "============================================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "============================================================================"
echo ""
echo "📍 Application URL: https://technurturelms.in"
echo ""
echo "🔑 Admin Login Credentials:"
echo "   Email:    admin@technurture.com"
echo "   Password: AdminPassword123!"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Change admin password immediately after first login!"
echo "   2. Verify all 3 payment plans are seeded:"
echo "      - Starter LMS (₹9,999)"
echo "      - Standard Scholar (₹24,999) — marked as popular"
echo "      - Elite Institutional (₹49,999)"
echo "   3. Check platform settings are loaded"
echo "   4. Monitor logs for the next few minutes:"
echo ""
echo "      docker compose logs -f LMS_app"
echo ""

echo "🛑 To stop all containers: docker compose down"
echo "🔄 To restart: docker compose up -d"
echo ""
