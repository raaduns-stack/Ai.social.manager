const fs = require('fs');
const postgres = require('postgres');

// Parse apps/backend/.env
const envFile = fs.readFileSync('./apps/backend/.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const dbUrl = envVars.DATABASE_URL || process.env.DATABASE_URL;
console.log('Using DB URL:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : 'NONE');

const sql = postgres(dbUrl, { ssl: 'require' });

async function check() {
  try {
    const rows = await sql`SELECT id, user_id, amount, status, gateway, gateway_reference, created_at, updated_at FROM payments ORDER BY created_at DESC LIMIT 10`;
    console.log('PAYMENTS:', JSON.stringify(rows, null, 2));

    const notifs = await sql`SELECT id, user_id, title, message, type, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 10`;
    console.log('NOTIFICATIONS:', JSON.stringify(notifs, null, 2));
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await sql.end();
  }
}

check();
