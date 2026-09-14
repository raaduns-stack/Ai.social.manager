const fs = require('fs');
const jwt = require('jsonwebtoken');

const env = fs.readFileSync('apps/backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const jwtMatch = env.match(/JWT_ACCESS_SECRET=([^\r\n]+)/);
const secret = jwtMatch ? jwtMatch[1].replace(/['"]/g, '') : 'default_secret';
const sql = require('postgres')(match[1].replace(/['"]/g, ''));

async function checkEndpoints() {
  try {
    const admins = await sql`SELECT id, email, role FROM users WHERE role = 'super_admin' LIMIT 1`;
    if (!admins.length) {
      console.log('No admin found');
      return;
    }
    const admin = admins[0];
    const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, secret, { expiresIn: '1h' });

    const headers = { 'Authorization': `Bearer ${token}` };

    const dashRes = await fetch('http://localhost:4000/api/admin/designer-payments/dashboard', { headers });
    const dash = await dashRes.json();
    console.log('Dashboard stats:', JSON.stringify(dash, null, 2));

    const earnRes = await fetch('http://localhost:4000/api/admin/designer-payments/earnings', { headers });
    const earn = await earnRes.json();
    console.log('Earnings:', JSON.stringify(earn, null, 2));

    const recRes = await fetch('http://localhost:4000/api/admin/designer-payments/records', { headers });
    const rec = await recRes.json();
    console.log('Records:', JSON.stringify(rec, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    await sql.end();
  }
}

checkEndpoints();
