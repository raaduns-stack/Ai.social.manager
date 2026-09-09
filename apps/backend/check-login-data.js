require('dotenv/config');
const postgres = require('postgres');

async function check() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    const perms = await sql`
      SELECT * FROM role_permissions WHERE role = 'super_admin' LIMIT 5
    `;
    console.log('Role permissions for super_admin:', perms.length);
    perms.forEach(p => console.log(' -', p.module, ':', p.access_level));

    const subs = await sql`
      SELECT * FROM subscriptions WHERE user_id = (SELECT id FROM users WHERE email = 'sushibmanger2023@gmail.com') LIMIT 5
    `;
    console.log('\nSubscriptions for admin:', subs.length);
    subs.forEach(s => console.log(' -', s.status, '| plan_id:', s.plan_id));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

check();
