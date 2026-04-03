#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   TECHNURTURE LMS - DOCKER PERFORMANCE TEST SUITE         ║"
echo "║  500 Schools | 5-10 Students Per School | Real Load Test  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.test.yml"
APP_CONTAINER="LMS_app_test"
DB_CONTAINER="LMS_postgres_test"
REDIS_CONTAINER="LMS_redis_test"
TEST_DURATION=300  # 5 minutes
VUS=500            # Virtual users

# Step 1: Cleanup
log_info "Step 1/7: Cleaning up previous test environment..."
docker-compose -f $DOCKER_COMPOSE_FILE down -v 2>/dev/null || true
sleep 2
log_success "Cleaned up"
echo ""

# Step 2: Build Docker image
log_info "Step 2/7: Building Docker image..."
if [ ! "$(docker images -q technurturelabs-app:latest 2>/dev/null)" ]; then
    log_warn "Image not found locally, building..."
    docker build -t technurturelabs-app:latest .
else
    log_success "Using existing image: technurturelabs-app:latest"
fi
echo ""

# Step 3: Start infrastructure
log_info "Step 3/7: Starting Docker infrastructure (PostgreSQL, Redis, App)..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d
sleep 5

log_info "Waiting for services to be healthy..."
RETRIES=0
MAX_RETRIES=60
while [ $RETRIES -lt $MAX_RETRIES ]; do
    if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "healthy"; then
        log_success "Services are healthy"
        break
    fi
    RETRIES=$((RETRIES + 1))
    sleep 2
done

if [ $RETRIES -eq $MAX_RETRIES ]; then
    log_error "Services failed to start within timeout"
    docker-compose -f $DOCKER_COMPOSE_FILE logs
    exit 1
fi
echo ""

# Step 4: Seed database
log_info "Step 4/7: Seeding database with 500 schools (5-10 students each)..."
docker-compose -f $DOCKER_COMPOSE_FILE exec -T app npx tsx scripts/seed-500-schools.ts
sleep 5
log_success "Database seeded"
echo ""

# Step 5: Verify connectivity
log_info "Step 5/7: Verifying application connectivity..."
RETRIES=0
while [ $RETRIES -lt 30 ]; do
    if curl -s http://localhost:3000/ > /dev/null; then
        log_success "App is responsive at http://localhost:3000"
        break
    fi
    RETRIES=$((RETRIES + 1))
    sleep 2
done

if [ $RETRIES -eq 30 ]; then
    log_error "App failed to respond within timeout"
    docker-compose -f $DOCKER_COMPOSE_FILE logs app
    exit 1
fi
echo ""

# Step 6: Test login
log_info "Step 6/7: Testing user authentication..."
SCHOOL_EMAIL="admin@school1.local"
PASSWORD="admin123"

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SCHOOL_EMAIL\",\"password\":\"$PASSWORD\"}")

if echo $LOGIN_RESPONSE | grep -q "token"; then
    log_success "Authentication working - login successful"
else
    log_warn "Auth response: $LOGIN_RESPONSE"
fi
echo ""

# Step 7: Run load test
log_info "Step 7/7: Running performance load test..."
log_info "Parameters: $VUS concurrent users, ${TEST_DURATION}s duration"
echo ""

# Create load test script
cat > /tmp/load_test.js << 'LOAD_TEST_EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 200 },   // Ramp up to 200 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '1m', target: 500 },   // Stay at 500 users
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test scenarios
export default function () {
  const schoolId = `${Math.floor(__VU % 500) + 1}`;
  const studentId = `${Math.floor(Math.random() * 10) + 1}`;
  const email = `student${schoolId}-${studentId}@school${schoolId}.local`;
  const password = 'admin123';

  // 1. Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const token = loginRes.json('token');
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token returned': (r) => r.json('token') !== undefined,
  });

  sleep(1);

  // 2. Get user profile
  const profileRes = http.get(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(profileRes, {
    'profile loaded': (r) => r.status === 200,
    'xp returned': (r) => r.json('cumulative_xp') !== undefined,
  });

  sleep(1);

  // 3. Get courses
  const coursesRes = http.get(`${BASE_URL}/api/student/courses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(coursesRes, {
    'courses loaded': (r) => r.status === 200,
  });

  sleep(2);

  // 4. Get leaderboard
  const leaderboardRes = http.get(`${BASE_URL}/api/student/leaderboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(leaderboardRes, {
    'leaderboard loaded': (r) => r.status === 200,
  });

  sleep(1);
}
LOAD_TEST_EOF

# Run k6 load test if available
if command -v k6 &> /dev/null; then
    k6 run -e BASE_URL=http://localhost:3000 --duration ${TEST_DURATION}s /tmp/load_test.js
    log_success "Load test completed"
else
    log_warn "k6 not installed, skipping load test"
    log_info "Install k6 with: brew install k6 (macOS) or apt-get install k6 (Linux)"
fi
echo ""

# Step 8: Generate metrics report
log_info "Collecting performance metrics from Docker containers..."
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           PERFORMANCE TEST RESULTS                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Database metrics
log_info "Database Performance:"
docker-compose -f $DOCKER_COMPOSE_FILE exec -T db psql -U postgres -d technurturelabs_test << 'SQL_EOF' 2>/dev/null || true
SELECT
  schemaname,
  COUNT(*) as table_count,
  SUM(pg_total_relation_size(schemaname||'.'||tablename)) / 1024 / 1024 as size_mb
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname;
SQL_EOF

echo ""

# Redis metrics
log_info "Redis Performance:"
docker-compose -f $DOCKER_COMPOSE_FILE exec -T redis redis-cli INFO stats 2>/dev/null || true

echo ""

# Container stats
log_info "Container Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" $DB_CONTAINER $REDIS_CONTAINER $APP_CONTAINER 2>/dev/null || true

echo ""

# Cleanup option
log_info "Test environment is still running. To cleanup, run:"
log_info "docker-compose -f $DOCKER_COMPOSE_FILE down -v"
echo ""

log_success "Performance test completed successfully!"
