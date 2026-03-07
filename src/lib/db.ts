import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// for query purposes
import { serverEnv } from '@/lib/env.server';

let dbUrl = serverEnv.DATABASE_URL;
// Force Next.js docker container to use internal hostname if the VPS .env accidentally uses localhost
if (process.env.NODE_ENV === 'production') {
    dbUrl = dbUrl.replace('localhost:5433', 'db:5432').replace('127.0.0.1:5433', 'db:5432');
}

const queryClient = postgres(dbUrl);
export const db = drizzle(queryClient, { schema });
