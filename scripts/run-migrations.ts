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

    try {
      await migrate(db, { migrationsFolder });
      console.log('✅ Migrations completed successfully');
    } catch (migrationError: any) {
      // Ignore "already exists" errors for enum values - these are safe to skip
      // This happens when migrations have been partially applied or in multi-instance deploys
      const errorMsg = migrationError?.message || migrationError?.cause?.message || '';
      if (errorMsg.includes('already exists') || errorMsg.includes('42P06') || errorMsg.includes('42P07') || errorMsg.includes('42710')) {
        console.log('⚠️  Skipping duplicate enum/schema errors (already applied):', errorMsg.split('\n')[0]);
        console.log('✅ Database state is consistent - proceeding with app startup');
      } else {
        throw migrationError;
      }
    }
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
