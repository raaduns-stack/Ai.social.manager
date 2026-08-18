const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'apps/backend/.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not defined in apps/backend/.env');
  process.exit(1);
}

const sql = postgres(dbUrl);

async function run() {
  try {
    console.log('--- Seeding ScheduledPost ---');
    
    const calendarPostId = '11111111-1111-1111-1111-111111111111';
    const variationId = '22222222-2222-2222-2222-222222222222';
    const socialAccountId = '33333333-3333-3333-3333-333333333333';
    
    const platform = 'instagram';
    const content = 'Demo scheduled post for pipeline testing.';
    const mediaUrl = null;
    
    // 60 seconds in the past
    const scheduledAt = new Date(Date.now() - 60000).toISOString();
    const status = 'SCHEDULED';
    const idempotencyKey = null;

    const result = await sql.unsafe(`
      INSERT INTO scheduled_posts (
        calendar_post_id,
        variation_id,
        social_account_id,
        platform,
        content,
        media_url,
        scheduled_at,
        status,
        idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING scheduled_post_id
    `, [
      calendarPostId,
      variationId,
      socialAccountId,
      platform,
      content,
      mediaUrl,
      scheduledAt,
      status,
      idempotencyKey
    ]);

    if (result.length > 0) {
      console.log('✅ Inserted ScheduledPost successfully!');
      console.log('Inserted Row ID:', result[0].scheduled_post_id);
    } else {
      console.error('❌ Failed to insert row.');
    }
  } catch (err) {
    console.error('Error seeding scheduled post:', err);
  } finally {
    await sql.end();
  }
}

run();
