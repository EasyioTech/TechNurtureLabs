// NOTE: 'server-only' removed to allow usage in worker scripts
// Workers are Node.js processes, not Next.js client/server contexts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// for query purposes
import { serverEnv } from '@/lib/env.server';

const globalForDb = global as unknown as {
    conn: postgres.Sql | undefined;
};

let dbUrl = serverEnv.DATABASE_URL;
// Force Next.js docker container to use internal hostname if the VPS .env accidentally uses localhost
if (process.env.NODE_ENV === 'production') {
    dbUrl = dbUrl.replace('localhost:5433', 'db:5432').replace('127.0.0.1:5433', 'db:5432');
}

const conn = globalForDb.conn ?? postgres(dbUrl, {
    // CRITICAL FIX #5: Increased from 20 to 50 for production scale (1000+ concurrent users)
    // Rationale:
    // - PostgreSQL typically allows 100 connections total
    // - Reserve 50 for this Next.js app (handles ~500 concurrent requests @ 100ms each)
    // - Reserve 30 for admin tools, migrations, backups, monitoring
    // - Reserve 20 as safety margin
    // At 20: Database exhaustion at 200 concurrent users (unacceptable)
    // At 50: Database handles 500 concurrent users smoothly
    // For development: use smaller pool to fail fast when DB is unreachable
    max: process.env.NODE_ENV === 'production' ? 50 : 5,

    // CRITICAL FIX #5: Reduced idle_timeout from 30s to 10s
    // Release idle connections faster so they're available for new requests
    // Unused connection held for 30 seconds is wasted capacity
    idle_timeout: 10,

    // Fail fast on initial connect — surfaces misconfigured DATABASE_URL immediately
    // In development, timeout faster (3s) to avoid hanging on failed connections
    connect_timeout: process.env.NODE_ENV === 'production' ? 10 : 3,

    // CRITICAL FIX #5: Reduced max_lifetime from 1800s to 600s (10 minutes)
    // Recycle connections more frequently to avoid stale state
    // 10 minute lifespan is still long enough for most requests (avg ~100ms)
    max_lifetime: 600,

    onnotice: () => {}, // Suppress PostgreSQL NOTICE messages
});

globalForDb.conn = conn;

export const db = drizzle(conn, { schema });

// CRITICAL FIX #5: Add connection pool monitoring
// Logs connection pool stats every 60 seconds to detect exhaustion issues
if (serverEnv.NODE_ENV === 'production') {
    setInterval(() => {
        try {
            const pool = (conn as any).pool;
            if (pool) {
                const total = pool.connections?.length || 0;
                const idle = pool.available?.length || 0;
                const waiting = pool._queue?.length || 0;
                const inUse = total - idle;

                // Alert if we are hitting the ceiling AND have people waiting
                if (inUse > 45 || waiting > 0) {
                    console.warn(
                        `[DB Pool Alert] In Use: ${inUse}/${total} | Idle: ${idle} | Waiting: ${waiting} | Limit: 50`
                    );
                }
            }
        } catch (err) {
            // Silently ignore if pool stats unavailable
        }
    }, 60000); // Check every 60 seconds
}
