#!/bin/bash
# ============================================================
# TechNurture Labs — VPS Doctor & Health Check
# ============================================================
# This script diagnoses and fixes common deployment issues.
# Run: cd TechNurtureLabs && bash scripts/vps-doctor.sh
# ============================================================

set -e

echo "🔍 Running TechNurture Labs Health Diagnosis..."

# COLOR CODES
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed.${NC}"
    echo "💡 Install Docker: curl -fsSL https://get.docker.com | sh"
    exit 1
fi
echo -e "${GREEN}✅ Docker is installed.${NC}"

# 2. Check if Port 80/443 are free on the host (not by us)
echo "🔍 Checking port conflicts..."
CONFLICT_80=$(lsof -i :80 -t | xargs ps -o comm= -p 2>/dev/null || true)
if [ ! -z "$CONFLICT_80" ] && [[ ! "$CONFLICT_80" =~ "docker" ]] && [[ ! "$CONFLICT_80" =~ "caddy" ]]; then
    echo -e "${YELLOW}⚠️ Port 80 is occupied by: $CONFLICT_80 (outside Docker)${NC}"
    if [[ "$CONFLICT_80" == "nginx" ]]; then
        echo "💡 Found host-level Nginx. Stop it: systemctl stop nginx && systemctl disable nginx"
    fi
fi

# 3. Check for .env file
if [ ! -f .env ]; then
    echo -e "${RED}❌ Missing .env file in root directory.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ .env file found.${NC}"

# 4. Check Container Health
echo "🔍 Checking container status..."
CONTAINERS=("LMS_app" "LMS_postgres" "LMS_redis" "LMS_caddy" "LMS_event_worker")
for container in "${CONTAINERS[@]}"; do
    STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
    if [ "$STATUS" == "running" ]; then
        HEALTH=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-check{{end}}' "$container" 2>/dev/null || echo "none")
        if [ "$HEALTH" == "healthy" ] || [ "$HEALTH" == "none" ] || [ "$HEALTH" == "no-check" ]; then
            echo -e "${GREEN}✅ $container is RUNNING (Health: $HEALTH)${NC}"
        else
            echo -e "${RED}❌ $container is UNHEALTHY! Status: $HEALTH${NC}"
            echo "   💡 Check logs: docker logs $container --tail 50"
        fi
    else
        echo -e "${RED}❌ $container is NOT RUNNING! Status: $STATUS${NC}"
        echo "   💡 Check logs: docker logs $container --tail 50"
        echo "   💡 To start: bash deploy.sh"
    fi
done

# 5. Check Redis connectivity (common failure point)
if [ "$(docker ps -q -f name=LMS_redis)" ]; then
    echo "🔍 Testing Redis connectivity from host..."
    if docker exec LMS_redis redis-cli ping | grep -q 'PONG'; then
        echo -e "${GREEN}✅ Redis is responsive.${NC}"
    else
        echo -e "${RED}❌ Redis is not responding to ping!${NC}"
    fi
fi

# 6. Database Check
if [ "$(docker ps -q -f name=LMS_postgres)" ]; then
    echo "🔍 Testing Database connectivity..."
    if docker exec LMS_postgres pg_isready -U postgres > /dev/null; then
        echo -e "${GREEN}✅ Database is accepting connections.${NC}"
    else
        echo -e "${RED}❌ Database is not ready!${NC}"
    fi
fi

# 7. Check Caddy reachability
if [ "$(docker ps -q -f name=LMS_caddy)" ]; then
    echo "🔍 Testing Reverse Proxy (Caddy) internal response..."
    # Try localhost with Host header
    RESPONSE=$(docker exec LMS_caddy wget --spider -S --header="Host: technurturelms.in" http://localhost 2>&1 | grep "HTTP/" || true)
    if [ ! -z "$RESPONSE" ]; then
        echo -e "${GREEN}✅ Caddy is responding internally: $RESPONSE${NC}"
    else
        echo -e "${YELLOW}⚠️ Caddy is not responding to internal localhost request.${NC}"
    fi
fi

echo "=================================================="
echo "🎯 Diagnosis Complete!"
echo "If issues persist, please check: tail -f docker compose logs"
