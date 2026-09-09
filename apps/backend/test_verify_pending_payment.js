require('dotenv/config');
const postgres = require('postgres');

async function test() {
  const sql = postgres(process.env.DATABASE_URL);

  // Check payment status before
  const before = await sql`SELECT id, user_id, status, gateway_reference FROM payments WHERE gateway_reference = 'SPILOT-1788447549543-MJFJDQ'`;
  console.log('Payment before:', before[0]);

  // Check notifications count before
  const notifsBefore = await sql`SELECT count(*) FROM notifications WHERE user_id = ${before[0].user_id}`;
  console.log('Notifications count before:', notifsBefore[0].count);

  await sql.end();
}

test().catch(console.error);
