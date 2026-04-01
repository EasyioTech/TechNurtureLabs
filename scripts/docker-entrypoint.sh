#!/bin/bash
# Docker entrypoint script for TechNurture LMS
# Runs database migrations before starting the application

set -e

echo "🚀 TechNurture LMS - Starting application..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=1
while ! pg_isready -h ${DB_HOST:-db} -p ${DB_PORT:-5432} -U ${POSTGRES_USER:-postgres} > /dev/null 2>&1; do
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Database failed to start within timeout"
        exit 1
    fi
    echo "   Attempt $attempt/$max_attempts..."
    attempt=$((attempt + 1))
    sleep 2
done
echo "✅ Database is ready"

# Wait for Redis to be ready (with extra warmup time for slow systems)
echo "⏳ Waiting for Redis to be ready..."
max_attempts=20
attempt=1
while ! redis-cli -h ${REDIS_HOST:-redis} -p ${REDIS_PORT:-6379} ping > /dev/null 2>&1; do
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Redis failed to start within timeout"
        exit 1
    fi
    echo "   Attempt $attempt/$max_attempts..."
    attempt=$((attempt + 1))
    sleep 1
done
# Extra wait to ensure Redis connections are fully established
sleep 2
echo "✅ Redis is ready"

if [ $# -eq 0 ]; then
    # Run database migrations using SQL files directly via psql
    echo "🔄 Running database migrations..."

    if [ -d "./drizzle" ] && [ -f "./scripts/run-migrations.ts" ]; then
        echo "Found migration script, running migrations natively via Drizzle..."
        if npx tsx scripts/run-migrations.ts; then
            echo "✅ Database migrations completed successfully"
        else
            echo "❌ Failed to run migrations via Drizzle"
            exit 1
        fi
    else
        echo "⚠️ No migration script found, skipping migrations"
    fi

    echo "🌱 Seeding default database data..."
    if npm run db:seed; then
        echo "✅ Database seeding completed successfully"
    else
        echo "⚠️ Database seeding failed! Check logs."
    fi

    # Start the application
    echo "🎯 Starting application server..."
    exec node server.js
else
    # Start the worker process
    echo "🎯 Starting worker process: $@"
    exec "$@"
fi
