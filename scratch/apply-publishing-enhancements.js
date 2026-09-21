const path = require('path');
const dotenv = require(path.resolve(__dirname, '../apps/backend/node_modules/dotenv'));
dotenv.config({ path: path.resolve(__dirname, '../apps/backend/.env') });

const postgres = require(path.resolve(__dirname, '../apps/backend/node_modules/postgres'));

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function migrate() {
  try {
    console.log('1. Adding FAILED to post_status enum...');
    await sql`ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'FAILED'`;
    console.log('✅ post_status enum successfully updated with FAILED');

    console.log('2. Adding retry_count to scheduled_posts...');
    await sql`ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0`;
    console.log('✅ scheduled_posts retry_count column successfully ensured');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await sql.end();
  }
}

migrate();
