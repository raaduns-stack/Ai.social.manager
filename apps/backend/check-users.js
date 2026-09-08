require('dotenv/config');
const postgres = require('postgres');

async function check() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    const users = await sql`
      SELECT id, email, full_name, role, account_status, is_email_verified FROM users LIMIT 5
    `;
    console.log('Users in database:', users.length);
    users.forEach(u => console.log(' -', u.email, '| role:', u.role, '| status:', u.account_status, '| verified:', u.is_email_verified));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

check();
