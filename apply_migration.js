const postgres = require('postgres');
require('dotenv').config({ path: './apps/backend/.env' });

async function applyMigration() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  console.log('Applying unique constraint migration to scheduled_posts.calendar_post_id...');
  try {
    await sql`ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_calendar_post_id_unique" UNIQUE("calendar_post_id")`;
    console.log('Migration successfully applied!');
  } catch (err) {
    if (err.code === '42710' || err.message.includes('already exists')) {
      console.log('Constraint scheduled_posts_calendar_post_id_unique already exists.');
    } else {
      console.error('Migration error:', err);
    }
  }
  await sql.end();
}

applyMigration();
