require('./apps/backend/node_modules/dotenv').config({ path: './apps/backend/.env' });
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    console.log('--- BEFORE PATCH ---');
    const before = await sql`SELECT id, role, module, access_level FROM role_permissions WHERE role = 'support_staff' AND module = 'analytics'`;
    console.log('Before:', JSON.stringify(before, null, 2));

    console.log('\n--- SIMULATING PATCH ---');
    // If the row exists, we update it.
    if (before.length > 0) {
      await sql`UPDATE role_permissions SET access_level = 'full' WHERE id = ${before[0].id}`;
    } else {
      await sql`INSERT INTO role_permissions (role, module, access_level) VALUES ('support_staff', 'analytics', 'full')`;
    }

    console.log('\n--- AFTER PATCH ---');
    const after = await sql`SELECT id, role, module, access_level FROM role_permissions WHERE role = 'support_staff' AND module = 'analytics'`;
    console.log('After:', JSON.stringify(after, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
