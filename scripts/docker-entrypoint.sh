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

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
max_attempts=10
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
echo "✅ Redis is ready"

# Run database migrations
echo "🔄 Running database migrations..."
if npm run db:push 2>/dev/null; then
    echo "✅ Database migrations completed successfully"
else
    echo "⚠️  Database migrations skipped (migrations may already be applied)"
fi

# Start the application
echo "🎯 Starting application server..."
exec node server.js
