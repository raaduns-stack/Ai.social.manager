require('dotenv/config');
const postgres = require('postgres');
async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  const rows = await sql`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'notification_type'`;
  console.log('Enum labels:', rows.map(r => r.enumlabel));
  await sql.end();
}
run().catch(console.error);
