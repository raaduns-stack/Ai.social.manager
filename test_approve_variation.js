const postgres = require('postgres');
require('dotenv').config({ path: './apps/backend/.env' });

async function testApprove() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

  const variationId = 'd4c69abf-b959-4079-9945-b5b239684183';
  const postId = '1fd38003-9830-4032-ae0d-6afda2881e5d';

  console.log(`Checking DB for variationId=${variationId} and postId=${postId}...`);
  const variation = await sql`SELECT id, post_id, approval_status, title, content FROM content_suggestions WHERE id = ${variationId}`;
  const post = await sql`SELECT id, user_id, title, approval_status, status, scheduled_at FROM content_calendar WHERE id = ${postId}`;

  console.log('Variation record:', variation[0] || 'NOT FOUND');
  console.log('Post record:', post[0] || 'NOT FOUND');

  if (variation[0] && post[0]) {
    console.log('\n--- Connected Social Accounts for User ---');
    const accounts = await sql`SELECT id, user_id, platform, account_handle, status FROM social_accounts WHERE user_id = ${post[0].user_id}`;
    console.log(accounts);

    console.log('\n--- Existing Scheduled Posts for Variation ---');
    const scheduled = await sql`SELECT * FROM scheduled_posts WHERE variation_id = ${variationId}`;
    console.log(scheduled);
  }

  await sql.end();
}

testApprove().catch(err => console.error(err));
