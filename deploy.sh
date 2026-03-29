#!/bin/bash
# ============================================================
# TechNurture Labs — Deployment Script
# ============================================================
# Fresh deployment:
#   PostgreSQL auto-runs database/schema.sql and database/seed.sql
#   on first start (docker-entrypoint-initdb.d). No manual migration
#   step needed. Schema + seed are applied atomically on first init.
#
# Incremental schema updates (existing deployment):
#   Run: npm run db:migrate  (applies pending drizzle migrations)
# ============================================================

# Step 1: Check for clean-slate mode
CLEAN_MODE=false
if [[ "$1" == "--clean" ]]; then
  CLEAN_MODE=true
  echo "⚠️ CLEAN MODE ENABLED: Volumes will be destroyed and images rebuilt without cache."
fi

# Step 2: Pull the latest code
echo "Pulling latest code..."
git pull origin main

# Step 3: Shutdown
if [ "$CLEAN_MODE" = true ]; then
  echo "Shutting down existing containers and REMOVING VOLUMES..."
  docker compose down -v
else
  echo "Shutting down existing containers..."
  docker compose down
fi

echo "Pruning unused Docker assets..."
docker system prune -f

# Step 4: Start Core Services (DB & Redis)
# On first start with an empty volume, PostgreSQL will automatically
# apply 01_schema.sql then 02_seed.sql before marking itself healthy.
echo "Starting Database and Redis..."
docker compose up -d db redis

# Step 5: Build and start Everything
# We let Docker Compose handle the healthy-dependencies (caddy waits for app, app waits for db/redis)
if [ "$CLEAN_MODE" = true ]; then
  echo "Building and starting ALL services WITHOUT CACHE..."
  docker compose up -d --build --no-cache
else
  echo "Building and starting ALL services..."
  docker compose up -d --build
fi

# Step 6: Health Reporting (Informational)
echo "Waiting 60s for application health verification..."
COUNT=0
MAX_RETRIES=20
SUCCESS=false

while [ $COUNT -lt $MAX_RETRIES ]; do
  HEALTH=$(docker inspect --format='{{.State.Health.Status}}' LMS_app 2>/dev/null)

  if [ "$HEALTH" == "healthy" ]; then
    echo "✅ App is healthy. System is fully operational."
    SUCCESS=true
    break
  fi

  echo "⏳ Status: ${HEALTH:-unknown} ($COUNT/$MAX_RETRIES)..."
  sleep 10
  COUNT=$((COUNT + 1))
done

if [ "$SUCCESS" = true ]; then
  echo "🚀 Deployment successful!"
  exit 0
else
  echo "⚠️ Warning: App is not reported as healthy yet, but services are running."
  echo "Check logs: docker compose logs app"
  exit 0 # We exit 0 because Caddy is already started by Docker Compose regardless of this loop
fi
