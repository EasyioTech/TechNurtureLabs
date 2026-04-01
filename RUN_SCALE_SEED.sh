#!/bin/bash
# ============================================================================
# Scale Seed Runner with Monitoring
# ============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    🚀 SCALE SEED RUNNER — 100 SCHOOLS                        ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

cd ~/TechNurtureLabs || exit 1

# Pre-flight checks
echo "📋 Pre-Flight Checks..."
echo "   ✅ Working directory: $(pwd)"

# Check if database is healthy
echo "   ⏳ Checking database health..."
if ! docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
    echo "   ❌ Database is not ready"
    exit 1
fi
echo "   ✅ Database is healthy"

# Check if Redis is healthy
echo "   ⏳ Checking Redis health..."
if ! docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "   ❌ Redis is not ready"
    exit 1
fi
echo "   ✅ Redis is healthy"

# Verify no schools exist yet
echo "   ⏳ Verifying clean state..."
SCHOOL_COUNT=$(docker compose exec -T db psql -U postgres -d technurturelabs -t -c "SELECT COUNT(*) FROM schools;")
if [ "$SCHOOL_COUNT" != " 0" ]; then
    echo "   ⚠️  WARNING: $SCHOOL_COUNT schools already exist!"
    echo "   To clean first, run: docker compose exec -T db psql -U postgres -d technurturelabs -c \"DELETE FROM schools;\""
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi
echo "   ✅ Database is clean"

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                       🌱 RUNNING SCALE SEED                                  ║"
echo "║                    (This may take 30-60 seconds)                             ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Run the scale seed
START_TIME=$(date +%s)

if npx tsx scripts/seed-scale.ts; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                      ✅ SCALE SEED COMPLETED!                               ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "⏱️  Duration: ${DURATION}s"
    echo ""

    # Verify results
    echo "📊 Verifying seeded data..."
    docker compose exec -T db psql -U postgres -d technurturelabs << EOF
SELECT
  'Schools' as entity, COUNT(*) as count FROM schools
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'School Admins', COUNT(*) FROM school_admins
UNION ALL
SELECT 'Academic Sessions', COUNT(*) FROM academic_sessions
UNION ALL
SELECT 'Student Academic Records', COUNT(*) FROM student_academic_records
UNION ALL
SELECT 'School-Class Mappings', COUNT(*) FROM school_class_mapping
UNION ALL
SELECT 'Subscriptions', COUNT(*) FROM school_subscriptions
ORDER BY entity;
EOF

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                         🔑 LOGIN CREDENTIALS                                 ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🏢 Super Admin:"
    echo "   Email:    admin@technurture.com"
    echo "   Password: AdminPassword123!"
    echo ""
    echo "👨‍💼 School Admins (Examples):"
    echo "   Email:    admin@school1.com"
    echo "   Password: Admin123!"
    echo "   (admin@school2.com, admin@school3.com, ..., admin@school100.com)"
    echo ""
    echo "👨‍🎓 Students (Examples):"
    echo "   Email:    student1@school1.com"
    echo "   Password: 123456"
    echo "   (All student[1-10]@school[1-100].com accounts use password: 123456)"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                        🚀 NEXT STEPS                                         ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "1. Open: https://technurturelms.in"
    echo "2. Login as admin@technurture.com"
    echo "3. Verify 100 schools are visible in admin dashboard"
    echo "4. Create courses and lessons"
    echo "5. Enroll students in courses"
    echo "6. Monitor worker logs:"
    echo "   docker compose logs -f event-worker"
    echo ""

else
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo ""
    echo "❌ SCALE SEED FAILED!"
    echo "⏱️  Duration before failure: ${DURATION}s"
    echo ""
    echo "📋 Check the error above for details."
    echo ""
    echo "💡 Common issues:"
    echo "   1. Database connection failed → Check Docker containers are running"
    echo "   2. Unique constraint violation → Database not clean, run cleanup first"
    echo "   3. Foreign key error → Schema mismatch (should not happen)"
    echo ""
    exit 1
fi
