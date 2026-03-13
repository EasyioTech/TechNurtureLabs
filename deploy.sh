#!/bin/bash
# ============================================================
# EduQuest — Automated Deployment Update Script
# ============================================================

# Step 1: Pull the latest code (uncomment if using Git)
# git pull origin main

# Step 2: Stop existing containers and prune old builds to save space
echo "Shutting down existing containers..."
docker compose down

echo "Pruning unused Docker assets..."
docker system prune -f

# Step 3: Start Core Services (DB & Redis)
echo "Starting Database and Redis..."
docker compose up -d db redis

# Step 3.5: Run Setup (Migrations + Seeding + Admin)
# This MUST run before the app starts to avoid column missing errors
echo "Running database setup and migrations..."
docker compose --profile setup up migration --abort-on-container-exit

# Step 4: Build and start the App
echo "Building and starting the Application..."
docker compose up -d --build app

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
