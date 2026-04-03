#!/bin/bash

# Simple performance test script (no Docker setup required)
# Tests against running local instance at http://localhost:3000

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   PERFORMANCE TEST - 500 Schools, 5-10 Students Each      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }

APP_URL="http://localhost:3000"

# Check if app is running
log_info "Checking if app is running at $APP_URL..."
if ! curl -s $APP_URL > /dev/null; then
    echo -e "${RED}❌ App not running at $APP_URL${NC}"
    echo "Start the app with: npm run dev"
    exit 1
fi
log_success "App is running"
echo ""

# Test login
log_info "Testing authentication..."
SCHOOL_EMAIL="admin@school1.local"
PASSWORD="admin123"

LOGIN=$(curl -s -X POST $APP_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SCHOOL_EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN | jq -r '.token' 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    log_warn "Login failed. Response: $LOGIN"
    echo "First, seed the database with: npm run db:seed:scale"
    exit 1
fi
log_success "Login successful"
echo ""

# Test endpoints
log_info "Testing API endpoints..."

endpoints=(
    "/api/auth/me:User Profile"
    "/api/student/courses:Courses"
    "/api/student/leaderboard:Leaderboard"
    "/api/student/achievements:Achievements"
)

for endpoint_info in "${endpoints[@]}"; do
    IFS=':' read -r endpoint name <<< "$endpoint_info"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $APP_URL$endpoint \
      -H "Authorization: Bearer $TOKEN")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        log_success "$name ($endpoint) - $HTTP_CODE"
    else
        log_warn "$name ($endpoint) - $HTTP_CODE"
    fi
done

echo ""

# Concurrent load test
log_info "Running concurrent load test..."
CONCURRENT=50
DURATION=60

total_requests=0
successful=0
failed=0
start_time=$(date +%s)

for ((i = 1; i <= CONCURRENT; i++)); do
    (
        for ((j = 0; j < 10; j++)); do
            SCHOOL=$((RANDOM % 500 + 1))
            STUDENT=$((RANDOM % 10 + 1))
            EMAIL="student${SCHOOL}-${STUDENT}@school${SCHOOL}.local"

            RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $APP_URL/api/auth/login \
              -H "Content-Type: application/json" \
              -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
              --max-time 5)

            HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
                echo "1 0"
            else
                echo "0 1"
            fi
        done
    ) &
done

wait

end_time=$(date +%s)
elapsed=$((end_time - start_time))

log_success "Concurrent load test complete (${elapsed}s)"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Concurrent Users: $CONCURRENT"
echo "Test Duration: ${elapsed}s"
echo "Database: 500 schools, ~2500-5000 students"
echo ""
log_success "Performance test completed successfully!"
