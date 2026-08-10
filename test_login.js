const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    // 1. Try to login with the registered user before verification
    const email = 'verify_test_1786190976736@example.com';
    const password = 'SecurePass123!';
    console.log(`Trying to login as ${email} (unverified)...`);
    const r1 = await post('/auth/login', { email, password });
    console.log('Status:', r1.status);
    console.log('Body:', JSON.stringify(r1.body));

    // 2. Mark this user as verified in DB
    const postgres = require('postgres');
    require('dotenv').config({ path: './apps/backend/.env' });
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    await sql.unsafe(`UPDATE users SET is_email_verified = true WHERE email = '${email}'`);
    await sql.end();
    console.log('Marked user as verified.');

    // 3. Try to login again
    console.log(`Trying to login as ${email} (verified)...`);
    const r2 = await post('/auth/login', { email, password });
    console.log('Status:', r2.status);
    console.log('Body:', JSON.stringify(r2.body));
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
