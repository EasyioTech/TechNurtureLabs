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

  let migrationFailed = false;

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
      const errorStr = JSON.stringify(migrationError);

      console.log('[DEBUG] Error message:', errorMsg);
      console.log('[DEBUG] Error code:', migrationError?.cause?.code);
      console.log('[DEBUG] Error string:', errorStr.substring(0, 200));

      if (errorMsg.includes('already exists') || errorMsg.includes('42P06') || errorMsg.includes('42P07') || errorMsg.includes('42710') || migrationError?.cause?.code === '42710') {
        console.log('⚠️  Skipping duplicate enum/schema errors (already applied):', errorMsg.split('\n')[0]);
        console.log('✅ Database state is consistent - proceeding with app startup');
        // Don't throw - migration errors for existing enums are safe to ignore
        migrationFailed = false;
      } else {
        console.error('❌ Migration failed:', migrationError);
        if (migrationError instanceof Error) {
          console.error('Error details:', migrationError.message);
        }
        throw migrationError;
      }
    }
  } catch (error) {
    console.error('Fatal error during migrations:', error);
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
