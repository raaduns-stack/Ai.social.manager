const postgres = require('postgres');
require('dotenv').config({ path: './apps/backend/.env' });

// Fallback to local path if run from within apps/backend
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: './.env' });
}

(async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('Error: DATABASE_URL not found in environment variables.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = postgres(dbUrl, { ssl: 'require' });

  try {
    console.log('1. Checking & creating custom enum types...');
    
    // Check/create variation_approval_status
    const enumCheck = await sql`
      select 1 from pg_type where typname = 'variation_approval_status'
    `;
    if (enumCheck.length === 0) {
      console.log('Creating variation_approval_status enum...');
      await sql`
        CREATE TYPE variation_approval_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED')
      `;
    }

    console.log('2. Syncing plans table columns...');
    await sql`
      ALTER TABLE plans 
      ADD COLUMN IF NOT EXISTS max_social_accounts integer NOT NULL DEFAULT 0
    `;
    await sql`
      ALTER TABLE plans 
      ADD COLUMN IF NOT EXISTS description varchar(500)
    `;
    await sql`
      ALTER TABLE plans 
      ADD COLUMN IF NOT EXISTS monthly_post_limit integer NOT NULL DEFAULT 0
    `;

    console.log('3. Syncing content_suggestions table columns...');
    await sql`
      ALTER TABLE content_suggestions 
      ADD COLUMN IF NOT EXISTS approval_status variation_approval_status NOT NULL DEFAULT 'PENDING_APPROVAL'
    `;
    await sql`
      ALTER TABLE content_suggestions 
      ADD COLUMN IF NOT EXISTS revision_notes text
    `;

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();
