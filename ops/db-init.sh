#!/bin/bash
# ============================================================
# TechNurture LMS — DB Initializer
# ENSURE WE ARE IN PROJECT ROOT
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"ops" ]]; then
  cd "$SCRIPT_DIR/.."
fi
# ============================================================

set -e

# Load .env for DATABASE_URL
if [ -f .env ]; then
  # Sourcing .env
  set -a
  source .env
  set +a
else
  echo "❌ Error: .env file missing in project root."
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set in .env."
  exit 1
fi

echo "Applying schema to Postgres container..."
docker exec -i LMS_postgres psql "$DATABASE_URL" < ./database/schema.sql

echo "✅ Database schema applied successfully."
