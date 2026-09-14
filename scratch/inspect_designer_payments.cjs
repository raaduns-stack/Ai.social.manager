const fs = require('fs');
const env = fs.readFileSync('apps/backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const sql = require('postgres')(match[1].replace(/['"]/g, ''));

async function inspect() {
  try {
    const records = await sql`
      SELECT id, designer_id, amount, status, period, reference, payout_type, fee, net_amount, related_work, notes, bank_name, account_number, account_name, created_at 
      FROM designer_payments
      ORDER BY created_at DESC
    `;
    console.log(`Found ${records.length} designer payment records:`);
    console.log(JSON.stringify(records, null, 2));
  } catch (err) {
    console.error('Error querying designer payments:', err);
  } finally {
    await sql.end();
  }
}

inspect();
