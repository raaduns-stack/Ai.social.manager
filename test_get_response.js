const http = require('http');

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
    const loginRes = await request('POST', '/auth/login', {}, {
      email: 'superadmin@test.com',
      password: 'Password123!',
    });

    const token = loginRes.body.accessToken;
    const authHeader = { 'Authorization': `Bearer ${token}` };

    const getRes = await request('GET', '/admin/role-permissions', authHeader);
    console.log('GET Response:', JSON.stringify(getRes.body.slice(0, 5), null, 2));
    console.log('Total Count:', getRes.body.length);

  } catch (err) {
    console.error(err);
  }
}

run();
