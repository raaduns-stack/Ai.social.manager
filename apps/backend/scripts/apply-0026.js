const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  try {
    const migrationSql = fs.readFileSync(path.resolve(__dirname, '../src/database/migrations/0026_scheduled_publishing_designer_integration.sql'), 'utf8');
    console.log('Applying 0026 migration...');
    await sql.unsafe(migrationSql);
    console.log('✅ 0026 migration applied successfully!');

    // Check columns
    const spCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'scheduled_posts'`;
    console.log('scheduled_posts columns:', spCols.map(r => r.column_name));
    
    const ccCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'content_calendar'`;
    console.log('content_calendar columns:', ccCols.map(r => r.column_name));
    
    const taskCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks'`;
    console.log('tasks columns:', taskCols.map(r => r.column_name));
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await sql.end();
  }
}

migrate();
