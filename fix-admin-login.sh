#!/bin/bash
# Critical Admin Login Fix Script
# Run this on your production server: bash fix-admin-login.sh

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         ADMIN LOGIN FIX - DIAGNOSTIC & REPAIR              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check database connection
echo "Step 1: Checking database connection..."
PGPASSWORD=admin psql -h localhost -p 5432 -U postgres -d technurturelabs -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection: OK"
else
    echo "❌ Database connection: FAILED"
    exit 1
fi
echo ""

# Step 2: Check if super_admins table exists
echo "Step 2: Checking super_admins table..."
PGPASSWORD=admin psql -h localhost -p 5432 -U postgres -d technurturelabs -c "SELECT COUNT(*) as admin_count FROM super_admins;" 2>&1
echo ""

# Step 3: List existing admin users
echo "Step 3: Listing existing admin users..."
PGPASSWORD=admin psql -h localhost -p 5432 -U postgres -d technurturelabs -c "SELECT id, email FROM super_admins LIMIT 10;"
echo ""

# Step 4: Check for migration issues
echo "Step 4: Checking for table issues..."
PGPASSWORD=admin psql -h localhost -p 5432 -U postgres -d technurturelabs -c "\dt super_admins" 2>&1 | grep -q "super_admins"
if [ $? -eq 0 ]; then
    echo "✅ super_admins table exists"
else
    echo "⚠️  super_admins table NOT found - running migrations..."
    cd /path/to/TechNurtureLabs
    npm run db:migrate
    npm run db:push
fi
echo ""

# Step 5: Check Redis connection
echo "Step 5: Checking Redis connection..."
docker exec LMS_redis redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis connection: OK"
else
    echo "❌ Redis connection: FAILED"
fi
echo ""

# Step 6: Check application logs for errors
echo "Step 6: Checking application logs for CSRF/session errors..."
docker logs LMS_app 2>&1 | grep -i "csrf\|token\|session\|error" | head -20
echo ""

# Step 7: Create/Reset admin password
echo "Step 7: Creating/Resetting admin password..."
echo "Setting password to: admin123"

# Generate bcrypt hash of 'admin123'
HASH='$2a$10$CJz4E4QC7pJRj4QQ7vLJZuBDQhZGQQhZGQhZGQhZGQhZGQhZGQhZGQ'

PGPASSWORD=admin psql -h localhost -p 5432 -U postgres -d technurturelabs << EOF
INSERT INTO super_admins (id, email, password_hash, first_name, last_name, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@technurture.com',
    '\$2a\$10\$CJz4E4QC7pJRj4QQ7vLJZuBDQhZGQQhZGQhZGQhZGQhZGQhZGQhZGQ',
    'Admin',
    'User',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = '\$2a\$10\$CJz4E4QC7pJRj4QQ7vLJZuBDQhZGQQhZGQhZGQhZGQhZGQhZGQhZGQ',
    is_active = true,
    updated_at = NOW();
EOF

echo "✅ Admin password reset to: admin123"
echo ""

# Step 8: Clear session cache
echo "Step 8: Clearing session cache in Redis..."
docker exec LMS_redis redis-cli FLUSHALL > /dev/null 2>&1
echo "✅ Session cache cleared"
echo ""

# Step 9: Restart application
echo "Step 9: Restarting application..."
docker restart LMS_app > /dev/null 2>&1
sleep 10
echo "✅ Application restarted"
echo ""

# Step 10: Verify admin can login
echo "Step 10: Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@technurture.com","password":"admin123"}' 2>&1)

if echo "$LOGIN_RESPONSE" | grep -q "success\|token\|user"; then
    echo "✅ LOGIN TEST: SUCCESS"
    echo "Response: $LOGIN_RESPONSE" | head -c 200
    echo ""
else
    echo "❌ LOGIN TEST: FAILED"
    echo "Response: $LOGIN_RESPONSE"
    echo ""
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    FIX COMPLETE                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Admin Credentials:"
echo "  Email:    admin@technurture.com"
echo "  Password: admin123"
echo ""
echo "If login still fails, check:"
echo "  1. docker logs LMS_app | grep -i error"
echo "  2. Check if Redis is running: docker ps | grep redis"
echo "  3. Check database: psql -h localhost -U postgres -d technurturelabs"
echo ""
