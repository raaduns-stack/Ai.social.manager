require('dotenv/config');
const postgres = require('postgres');

async function check() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    const columns = await sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    console.log('Columns in users table:');
    columns.forEach(c => {
      const type = c.udt_name ? `${c.data_type}(${c.udt_name})` : c.data_type;
      console.log(` - ${c.column_name}: ${type}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

check();
