import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const url = 'postgresql://postgres:admin@localhost:5432/technurturelabs';
const client = postgres(url, { max: 1 });
const db = drizzle(client);

async function main() {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration succeeded!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}
main();
