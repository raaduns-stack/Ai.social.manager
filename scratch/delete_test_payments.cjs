const fs = require('fs');
const env = fs.readFileSync('apps/backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const sql = require('postgres')(match[1].replace(/['"]/g, ''));

async function deleteTestPayments() {
  try {
    const before = await sql`SELECT count(*)::int FROM designer_payments`;
    console.log(`Current records count in designer_payments: ${before[0].count}`);

    const deleted = await sql`
      DELETE FROM designer_payments
      RETURNING id, reference, amount, period
    `;
    console.log(`Successfully deleted ${deleted.length} records:`);
    console.log(JSON.stringify(deleted, null, 2));

    const after = await sql`SELECT count(*)::int FROM designer_payments`;
    console.log(`New records count in designer_payments: ${after[0].count}`);
  } catch (err) {
    console.error('Error deleting test designer payments:', err);
  } finally {
    await sql.end();
  }
}

deleteTestPayments();
