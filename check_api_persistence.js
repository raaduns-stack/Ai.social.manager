require('./apps/backend/node_modules/dotenv').config({ path: './apps/backend/.env' });
const http = require('http');
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);
const PORT = 4000;
const HOST = 'localhost';

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: HOST,
      port: PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function run() {
  try {
    console.log('Logging in as super admin...');
    const loginRes = await request('POST', '/auth/login', {}, {
      email: 'superadmin@test.com',
      password: 'Password123!',
    });

    const token = loginRes.body.accessToken;
    const authHeader = { 'Authorization': `Bearer ${token}` };

    console.log('--- BEFORE API PATCH ---');
    const before = await sql`SELECT id, role, module, access_level FROM role_permissions WHERE role = 'support_staff' AND module = 'analytics'`;
    console.log('Before (DB):', JSON.stringify(before, null, 2));

    const payload = {
      role: 'support_staff',
      permissions: [
        { module: 'analytics', accessLevel: 'view' }, // let's change it back to 'view'
      ],
    };

    console.log('Sending PATCH to REST API...');
    const patchRes = await request('PATCH', '/admin/role-permissions', authHeader, payload);
    console.log('PATCH response status:', patchRes.status, patchRes.body);

    console.log('\n--- AFTER API PATCH ---');
    const after = await sql`SELECT id, role, module, access_level FROM role_permissions WHERE role = 'support_staff' AND module = 'analytics'`;
    console.log('After (DB):', JSON.stringify(after, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
