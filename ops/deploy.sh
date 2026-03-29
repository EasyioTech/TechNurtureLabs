#!/bin/bash
# ============================================================
# TECH NURTURE - Deployment Orchestrator
# ENSURE WE ARE IN PROJECT ROOT
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"ops" ]]; then
  cd "$SCRIPT_DIR/.."
fi
# ============================================================

# Step 1: Check for clean-slate mode
CLEAN_MODE=false
if [[ "$1" == "--clean" ]]; then
  CLEAN_MODE=true
  echo "⚠️ CLEAN MODE ENABLED: Volumes will be destroyed and images rebuilt without cache."
fi

# Step 1.5: Port Conflict Check (Common on new VPS)
echo "🔍 PRE-FLIGHT CHECK: Detecting port conflicts on 80/443..."
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
    CONFLICT=$(lsof -i :80 -t | xargs ps -o comm= -p 2>/dev/null || true)
    if [[ ! "$CONFLICT" =~ "docker" ]] && [[ ! "$CONFLICT" =~ "caddy" ]] && [ ! -z "$CONFLICT" ]; then
        echo -e "\033[0;31m❌ ERROR: Port 80 is occupied by '$CONFLICT' on the host.\033[0m"
        echo "💡 Run: systemctl stop $CONFLICT && systemctl disable $CONFLICT"
        exit 1
    fi
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
echo "Starting Database and Redis..."
docker compose up -d db redis

# Step 5: Build and start Everything
if [ "$CLEAN_MODE" = true ]; then
  echo "Building and starting ALL services WITHOUT CACHE..."
  docker compose up -d --build --no-cache
else
  echo "Building and starting ALL services..."
  docker compose up -d --build
fi

# Step 6: Health Reporting
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
  exit 0
fi
