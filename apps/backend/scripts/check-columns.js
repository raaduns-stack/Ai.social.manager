const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  try {
    const spCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'scheduled_posts'`;
    console.log('scheduled_posts columns:', spCols.map(r => r.column_name));
    
    const ccCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'content_calendar'`;
    console.log('content_calendar columns:', ccCols.map(r => r.column_name));
    
    const taskCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks'`;
    console.log('tasks columns:', taskCols.map(r => r.column_name));
    
    const subCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'submissions'`;
    console.log('submissions columns:', subCols.map(r => r.column_name));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sql.end();
  }
}

check();
