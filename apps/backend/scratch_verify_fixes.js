require('dotenv/config');
const postgres = require('postgres');

async function test() {
  const sql = postgres(process.env.DATABASE_URL);

  console.log('--- Testing Verification ---');

  // 1. Fetch recent notifications
  const recentNotifs = await sql`
    SELECT id, user_id, type, title, message, created_at
    FROM notifications
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log('Recent notifications in DB:', recentNotifs);

  // 2. Fetch recent payments
  const recentPayments = await sql`
    SELECT id, user_id, status, gateway_reference, created_at
    FROM payments
    ORDER BY created_at DESC
    LIMIT 5
  `;
  console.log('Recent payments in DB:', recentPayments);

  await sql.end();
}

test().catch(console.error);
