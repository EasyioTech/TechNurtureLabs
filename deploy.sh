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

# Step 5: Build and start the App and Workers
if [ "$CLEAN_MODE" = true ]; then
  echo "Building images WITHOUT CACHE..."
  docker compose build --no-cache app event-worker
fi

echo "Starting Application & Workers..."
docker compose up -d --build app event-worker

# Step 6: Health Check
echo "Waiting for app to become healthy..."
COUNT=0
MAX_RETRIES=18
while [ $COUNT -lt $MAX_RETRIES ]; do
  HEALTH=$(docker inspect --format='{{.State.Health.Status}}' LMS_app 2>/dev/null)

    if [ "$HEALTH" == "healthy" ]; then
      echo "App is healthy. Starting Reverse Proxy (Caddy)..."
      docker compose up -d caddy
      echo "Deployment successful! System is fully online."
      exit 0
    fi

  echo "Still waiting ($COUNT/$MAX_RETRIES)... Current status: $HEALTH"
  sleep 10
  COUNT=$((COUNT + 1))
done

echo "Warning: Healthcheck timed out after $((MAX_RETRIES * 10))s."
echo "Check logs: docker compose logs app"
exit 1
