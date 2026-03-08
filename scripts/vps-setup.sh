#!/bin/sh
# ============================================================================
# TechNurture LMS — VPS Setup Script
# Runs inside the migration or app container (where psql is available via db).
# Requires: DATABASE_URL environment variable
# ============================================================================

echo "=================================================="
echo " TechNurture LMS — Production DB Setup"
echo "=================================================="

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

echo ""
echo "Applying canonical schema (idempotent)..."
psql "$DATABASE_URL" -f /app/database/schema.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "=================================================="
  echo " Setup Complete!"
  echo " Super Admin: admin@technurture.com"
  echo " Password:    AdminPassword123!"
  echo " CHANGE THIS PASSWORD AFTER FIRST LOGIN."
  echo "=================================================="
else
  echo "ERROR: Schema application failed. Check logs."
  exit 1
fi
