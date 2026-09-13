const fs = require('fs');
const env = fs.readFileSync('apps/backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const sql = require('postgres')(match[1].replace(/['"]/g, ''));

async function test() {
  try {
    const designers = await sql`SELECT id, full_name, email FROM users WHERE role = 'designer'`;
    console.log('Designers:', designers.length);
    const ids = designers.map(d => d.id);

    console.log('1. Testing submissions query...');
    const subs = await sql`SELECT id, designer_id, status FROM submissions WHERE designer_id IN ${sql(ids)}`;
    console.log('submissions success:', subs.length);

    console.log('2. Testing submission_files query...');
    if (subs.length > 0) {
      const subIds = subs.map(s => s.id);
      const files = await sql`SELECT submission_id, count(*)::int FROM submission_files WHERE submission_id IN ${sql(subIds)} GROUP BY submission_id`;
      console.log('files success:', files.length);
    }

    console.log('3. Testing image_to_code query...');
    const i2c = await sql`SELECT id, designer_id, status FROM image_to_code WHERE designer_id IN ${sql(ids)}`;
    console.log('i2c success:', i2c.length);

    console.log('4. Testing designer_payments query...');
    const pays = await sql`SELECT id, designer_id, amount, status, fee, net_amount FROM designer_payments WHERE designer_id IN ${sql(ids)}`;
    console.log('pays success:', pays.length);

    console.log('5. Testing designer_payment_methods query...');
    const methods = await sql`SELECT * FROM designer_payment_methods WHERE designer_id IN ${sql(ids)}`;
    console.log('methods success:', methods.length);
  } catch (e) {
    console.error('ERROR OCCURRED:', e);
  } finally {
    await sql.end();
  }
}
test();
