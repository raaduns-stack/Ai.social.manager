require('dotenv/config');
const postgres = require('postgres');

async function test() {
  const sql = postgres(process.env.DATABASE_URL);

  const users = await sql`SELECT id, email, role, account_status FROM users WHERE role = 'user' LIMIT 5`;
  console.log('Test users:', users);

  if (users.length === 0) {
    console.log('No user accounts found');
    await sql.end();
    return;
  }

  const userId = users[0].id;
  console.log('Testing with userId:', userId);

  // Check content_calendar table
  try {
    const calendarPosts = await sql`SELECT * FROM content_calendar WHERE user_id = ${userId}`;
    console.log('Calendar posts count:', calendarPosts.length);
  } catch (err) {
    console.error('Error querying content_calendar:', err);
  }

  // Check social_accounts table
  try {
    const socialAccounts = await sql`SELECT * FROM social_accounts WHERE user_id = ${userId}`;
    console.log('Social accounts count:', socialAccounts.length);
  } catch (err) {
    console.error('Error querying social_accounts:', err);
  }

  // Check subscriptions for user
  try {
    const subs = await sql`SELECT * FROM subscriptions WHERE user_id = ${userId}`;
    console.log('Subscriptions count:', subs.length);
  } catch (err) {
    console.error('Error querying subscriptions:', err);
  }

  // Check KYC status for user
  try {
    const kyc = await sql`SELECT * FROM kyc WHERE user_id = ${userId}`;
    console.log('KYC record count:', kyc.length, kyc[0]?.status);
  } catch (err) {
    console.error('Error querying kyc:', err);
  }

  await sql.end();
}

test().catch(console.error);
