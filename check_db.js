const postgres = require('postgres');
require('dotenv').config({ path: './apps/backend/.env' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function check() {
  try {
    const results = await sql`SELECT id, original_name, description, status FROM uploads ORDER BY created_at DESC LIMIT 10`;
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

check();
