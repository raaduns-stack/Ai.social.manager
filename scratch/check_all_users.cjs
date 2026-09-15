const fs = require('fs');
const env = fs.readFileSync('apps/backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const sql = require('postgres')(match[1].replace(/['"]/g, ''));

async function checkUsers() {
  try {
    const users = await sql`SELECT id, email, full_name, role, account_status, created_at FROM users ORDER BY created_at ASC`;
    console.log('All Users:', JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

checkUsers();
