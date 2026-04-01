import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import path from 'path';

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Connecting to database...');
  console.log('Database URL:', databaseUrl.replace(/:[^@]*@/, ':***@')); // Log without password

  // Pass the connection string directly to postgres-js
  // postgres-js will parse the URL correctly
  const client = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 10,
    max_lifetime: 60,
  });

  try {
    const db = drizzle(client);

    console.log('Testing database connection...');
    const result = await client`SELECT 1`;
    console.log('✅ Database connection successful');

    console.log('Running migrations from drizzle folder...');
    const migrationsFolder = path.join(process.cwd(), 'drizzle');

    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  } finally {
    try {
      await client.end({ timeout: 5 });
      console.log('Database connection closed');
    } catch (e) {
      console.error('Error closing connection:', e);
    }
  }
}

runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
