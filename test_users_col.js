const fs = require('fs');
const env = fs.readFileSync('apps/backend/.env', 'utf8');
const dbUrl = env.match(/DATABASE_URL=(.*)/)[1].trim();
const postgres = require('postgres');
const sql = postgres(dbUrl, { ssl: 'require' });

async function run() {
  try {
    const migrations = await sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY id`;
    console.log('Applied migrations:', migrations.map(m => m.hash + ' - ' + new Date(Number(m.created_at)).toISOString()));
  } catch (err) {
    console.error('Error querying drizzle migrations:', err.message);
    const tables = await sql`SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%drizzle%'`;
    console.log('Tables matching drizzle:', tables);
  } finally {
    await sql.end();
  }
}

run();
