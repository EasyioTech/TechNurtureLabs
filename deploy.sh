#!/bin/bash
# ============================================================
# EduQuest — Automated Deployment Update Script
# ============================================================

# Step 1: Pull the latest code (uncomment if using Git)
# git pull origin main

# Step 2: Stop existing containers and prune old builds to save space
echo "Shutting down existing containers..."
docker-compose down

echo "Pruning unused Docker assets..."
docker system prune -f

# Step 3: Build and start new containers
echo "Starting build and containers (this will take time)..."
docker-compose up -d --build

# Step 3.5: Apply Database Migrations
echo "Applying Drizzle schema migrations..."
docker-compose exec -T app npm run db:push

# Step 4: Health Check (Wait for the app to respond)
echo "Waiting for app healthcheck to pass..."
COUNT=0
MAX_RETRIES=10
while [ $COUNT -lt $MAX_RETRIES ]; do
  HEALTH=$(docker inspect --format='{{.State.Health.Status}}' LMS_app 2>/dev/null)
  
  if [ "$HEALTH" == "healthy" ]; then
    echo "Deployment successful! App is healthy."
    exit 0
  fi
  
  echo "Still waiting ($COUNT/$MAX_RETRIES)... Current Status: $HEALTH"
  sleep 5
  let COUNT=COUNT+1
done

echo "Warning: Healthcheck timed out. Review logs with 'docker-compose logs app'."
exit 1
