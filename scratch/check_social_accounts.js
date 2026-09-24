const postgres = require('postgres');
require('dotenv').config({ path: './apps/backend/.env' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function run() {
  try {
    const rows = await sql`SELECT platform, account_handle, status, connected_at FROM social_accounts LIMIT 20`;
    console.log('social_accounts count:', rows.length);
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
