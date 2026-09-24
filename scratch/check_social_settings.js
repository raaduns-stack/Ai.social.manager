const postgres = require('postgres');
require('dotenv').config({ path: './apps/backend/.env' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function run() {
  try {
    const rows = await sql`SELECT platform, is_enabled, client_id, redirect_uri FROM social_api_settings`;
    console.log('social_api_settings count:', rows.length);
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
