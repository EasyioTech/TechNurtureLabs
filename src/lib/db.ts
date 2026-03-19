// import 'server-only';
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
    // Pool size: 20 connections handles concurrent Next.js requests without DB overload.
    // Hostinger VPS typically allows 100 pg connections; 20 is a safe ceiling for a single app.
    max: 20,
    // Release idle connections after 30s so DB isn't holding unused slots under low traffic
    idle_timeout: 30,
    // Fail fast on initial connect — surfaces misconfigured DATABASE_URL immediately
    connect_timeout: 10,
    // Recycle connections every 30 minutes to avoid stale state after long idle periods
    max_lifetime: 1800,
    onnotice: () => {}, // Suppress PostgreSQL NOTICE messages
});

globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
