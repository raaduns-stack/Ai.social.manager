import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require' });

async function main() {
  try {
    // Update all existing user accounts to have is_email_verified = true
    // This allows existing users created before email verification was added to log in without 403 errors.
    const result = await sql`UPDATE users SET is_email_verified = true WHERE is_email_verified = false`;
    console.log('Successfully set is_email_verified = true for existing users:', result.count);
  } catch (err) {
    console.error('Failed to update users:', err);
  } finally {
    await sql.end();
  }
}

main();
