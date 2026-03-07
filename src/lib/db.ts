import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// for query purposes
import { serverEnv } from '@/lib/env.server';
const queryClient = postgres(serverEnv.DATABASE_URL);
export const db = drizzle(queryClient, { schema });
