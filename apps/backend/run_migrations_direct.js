const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set in apps/backend/.env');
  process.exit(1);
}

console.log('Connecting to database...');
const sql = postgres(dbUrl, { max: 1 });
const db = drizzle(sql);

async function main() {
  console.log('Running Drizzle migrations programmatically...');
  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, 'src/database/migrations')
    });
    console.log('Migrations applied successfully!');
  } catch (err) {
    console.error('Error applying migrations:', err);
  } finally {
    await sql.end();
  }
}

main();
