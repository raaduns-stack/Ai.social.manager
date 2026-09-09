const fs = require('fs');
const postgres = require('../../node_modules/postgres');

const env = fs.readFileSync('.env', 'utf8');
const lines = env.split('\n');
let dbUrl = '';
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.startsWith('DATABASE_URL=')) {
    dbUrl = trimmed.replace('DATABASE_URL=', '').trim();
  }
}

console.log('Connecting to DATABASE_URL:', dbUrl.replace(/:[^:@]+@/, ':***@'));

async function run() {
  const sql = postgres(dbUrl, { ssl: 'require' });

  const variationId = 'd4c69abf-b959-4079-9945-b5b239684183';
  const postId = '1fd38003-9830-4032-ae0d-6afda2881e5d';

  console.log('\n--- VARIATION ---');
  const variation = await sql`SELECT id, post_id, approval_status, title, content FROM content_suggestions WHERE id = ${variationId}`;
  console.log(variation[0] || 'NOT FOUND');

  console.log('\n--- CALENDAR POST ---');
  const post = await sql`SELECT id, user_id, title, platform, approval_status, status, scheduled_at FROM content_calendar WHERE id = ${postId}`;
  console.log(post[0] || 'NOT FOUND');

  if (post[0]) {
    console.log('\n--- CONNECTED SOCIAL ACCOUNTS ---');
    const accounts = await sql`SELECT id, user_id, platform, account_handle, status FROM social_accounts WHERE user_id = ${post[0].user_id}`;
    console.log(accounts);

    console.log('\n--- EXISTING SCHEDULED POSTS FOR VARIATION ---');
    const scheduled = await sql`SELECT * FROM scheduled_posts WHERE variation_id = ${variationId}`;
    console.log(scheduled);
  }

  await sql.end();
}

run().catch(err => console.error(err));
