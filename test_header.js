const http = require('http');

function post(path, body, headers = {}) {
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
        ...headers
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
    const email = 'verify_test_1786190976736@example.com';
    const password = 'SecurePass123!';

    // 1. Without Authorization header
    console.log('Sending login without Auth header...');
    const r1 = await post('/auth/login', { email, password });
    console.log('Status:', r1.status);

    // 2. With invalid/expired Authorization header
    console.log('\nSending login WITH invalid Bearer Auth header...');
    const r2 = await post('/auth/login', { email, password }, {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid'
    });
    console.log('Status:', r2.status);
    console.log('Body:', JSON.stringify(r2.body));
  } catch (e) {
    console.error(e);
  }
})();
