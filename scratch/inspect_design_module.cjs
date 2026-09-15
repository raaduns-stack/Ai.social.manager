const fs = require('fs');
const env = fs.readFileSync('apps/backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const sql = require('postgres')(match[1].replace(/['"]/g, ''));

async function inspectAll() {
  try {
    const designers = await sql`SELECT id, full_name, email, role FROM users WHERE role = 'designer'`;
    console.log('Designers in DB:', JSON.stringify(designers, null, 2));

    const submissions = await sql`SELECT id, title, designer_id, status, created_at FROM submissions`;
    console.log('Submissions in DB:', JSON.stringify(submissions, null, 2));

    const i2c = await sql`SELECT id, submission_id, designer_id, status FROM image_to_code`;
    console.log('ImageToCode in DB:', JSON.stringify(i2c, null, 2));

    const tasks = await sql`SELECT id, title, assigned_to, status FROM tasks`;
    console.log('Tasks in DB:', JSON.stringify(tasks, null, 2));

    const methods = await sql`SELECT id, designer_id, bank_name, account_number, account_name FROM designer_payment_methods`;
    console.log('DesignerPaymentMethods in DB:', JSON.stringify(methods, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

inspectAll();
