import * as dotenv from 'dotenv';
import { existsSync } from 'fs';

// Only load .env files in development (when explicitly in development mode AND file exists)
// In Docker/production, NODE_ENV=production so dotenv is never loaded
const env = process.env.NODE_ENV as string | undefined;
const isDevelopment = env !== 'production' && env !== 'docker';

if (isDevelopment && existsSync('.env')) {
    dotenv.config();
}

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
}

export default {
    out: './drizzle',
    schema: './src/db/schema.ts',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
};
