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

function get(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
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
    req.end();
  });
}

(async () => {
  try {
    const email = 'superadmin@test.com';
    const password = 'Password123!';
    
    console.log(`1. Logging in as ${email}...`);
    const r1 = await post('/auth/login', { email, password });
    console.log('Status:', r1.status);
    
    if (r1.status === 201) {
      const token = r1.body.accessToken;
      console.log('Token received:', token.substring(0, 20) + '...');
      
      console.log('\n2. Querying protected /subscription route...');
      const r2 = await get('/subscription', token);
      console.log('Status:', r2.status);
      console.log('Body:', JSON.stringify(r2.body));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
