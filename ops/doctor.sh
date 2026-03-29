#!/bin/bash
# ============================================================
# TechNurture Labs — VPS Doctor & Health Check
# ENSURE WE ARE IN PROJECT ROOT
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"ops" ]]; then
  cd "$SCRIPT_DIR/.."
fi
# ============================================================

set -e

echo "🔍 Running TechNurture Labs Health Diagnosis..."

# COLOR CODES
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is installed.${NC}"

# 2. Port Conflicts
if lsof -i :80 -t >/dev/null; then
    CONFLICT_80=$(lsof -i :80 -t | xargs ps -o comm= -p 2>/dev/null || true)
    if [ ! -z "$CONFLICT_80" ] && [[ ! "$CONFLICT_80" =~ "docker" ]] && [[ ! "$CONFLICT_80" =~ "caddy" ]]; then
        echo -e "${YELLOW}⚠️ Port 80 is occupied by: $CONFLICT_80 (Host Service)${NC}"
    fi
fi

# 3. Environment
if [ ! -f .env ]; then
    echo -e "${RED}❌ Missing .env file.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ .env file found.${NC}"

# 4. Containers
CONTAINERS=("LMS_app" "LMS_postgres" "LMS_redis" "LMS_caddy" "LMS_event_worker")
for container in "${CONTAINERS[@]}"; do
    STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
    if [ "$STATUS" == "running" ]; then
        HEALTH=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-check{{end}}' "$container" 2>/dev/null || echo "none")
        if [ "$HEALTH" == "healthy" ] || [ "$HEALTH" == "no-check" ]; then
            echo -e "${GREEN}✅ $container is RUNNING (Health: $HEALTH)${NC}"
        else
            echo -e "${RED}❌ $container is UNHEALTHY! (Health: $HEALTH)${NC}"
        fi
    else
        echo -e "${RED}❌ $container is NOT RUNNING! ($STATUS)${NC}"
    fi
done

# 5. Services Check (Internal Caddy)
if [ "$(docker ps -q -f name=LMS_caddy)" ]; then
    echo "🔍 Testing Caddy internal response..."
    RESPONSE=$(docker exec LMS_caddy wget --spider -S --header="Host: technurturelms.in" http://localhost 2>&1 | grep "HTTP/" || true)
    if [ ! -z "$RESPONSE" ]; then
        echo -e "${GREEN}✅ Caddy internal response: $RESPONSE${NC}"
    else
        echo -e "${RED}❌ Caddy internal failure! Check logs.${NC}"
    fi
fi

echo "🎯 Diagnosis Complete!"
