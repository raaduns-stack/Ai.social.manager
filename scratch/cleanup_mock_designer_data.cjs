const fs = require('fs');
const env = fs.readFileSync('apps/backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const sql = require('postgres')(match[1].replace(/['"]/g, ''));

async function cleanupMockDesigner() {
  try {
    const testUser = await sql`SELECT id, email, full_name FROM users WHERE email = 'designer_test@raasocial.io' OR full_name = 'Test Designer'`;
    console.log('Found mock test designer:', testUser);

    if (testUser.length > 0) {
      const testId = testUser[0].id;
      
      // Delete any submission activities or files first if needed
      await sql`DELETE FROM submission_activities WHERE user_id = ${testId} OR submission_id IN (SELECT id FROM submissions WHERE designer_id = ${testId})`;
      await sql`DELETE FROM submission_files WHERE submission_id IN (SELECT id FROM submissions WHERE designer_id = ${testId})`;
      await sql`DELETE FROM image_to_code WHERE designer_id = ${testId}`;
      await sql`DELETE FROM submissions WHERE designer_id = ${testId}`;
      await sql`DELETE FROM designer_payments WHERE designer_id = ${testId}`;
      await sql`DELETE FROM designer_payment_methods WHERE designer_id = ${testId}`;
      await sql`DELETE FROM designer_notifications WHERE designer_id = ${testId}`;
      await sql`DELETE FROM tasks WHERE assigned_to = ${testId}`;
      await sql`DELETE FROM users WHERE id = ${testId}`;

      console.log(`Successfully purged Test Designer (${testId}) and all linked mock records.`);
    }

    // Verify state of designers, submissions, and payments
    const designers = await sql`SELECT id, full_name, email, role FROM users WHERE role = 'designer'`;
    console.log('Remaining designers in DB:', JSON.stringify(designers, null, 2));

    const submissions = await sql`SELECT count(*)::int FROM submissions`;
    console.log('Remaining submissions count in DB:', submissions[0].count);

    const payments = await sql`SELECT count(*)::int FROM designer_payments`;
    console.log('Remaining payments count in DB:', payments[0].count);

    const i2c = await sql`SELECT count(*)::int FROM image_to_code`;
    console.log('Remaining image_to_code count in DB:', i2c[0].count);
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await sql.end();
  }
}

cleanupMockDesigner();
