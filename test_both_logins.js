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
  console.log('=== VERIFYING ADMIN & CUSTOMER LOGIN FLOWS ===\n');

  // 1. Admin Portal Login with valid credentials
  console.log('1. Testing Admin Login (superadmin@test.com)...');
  const adminRes = await post('/auth/login', { email: 'superadmin@test.com', password: 'Password123!' });
  console.log('   Status:', adminRes.status);
  console.log('   User Role:', adminRes.body?.user?.role);
  console.log('   Has Access Token:', !!adminRes.body?.accessToken);

  // 2. Customer Portal Login with valid credentials
  console.log('\n2. Testing Customer Login (testclient1@example.com)...');
  const customerRes = await post('/auth/login', { email: 'testclient1@example.com', password: 'Password123!' });
  console.log('   Status:', customerRes.status);
  console.log('   User Email:', customerRes.body?.user?.email);
  console.log('   Has Active Plan:', !!customerRes.body?.user?.plan);
  console.log('   Has Access Token:', !!customerRes.body?.accessToken);

  // 3. Testing Invalid Password rejection (401 Unauthorized)
  console.log('\n3. Testing Invalid Password Rejection...');
  const invalidRes = await post('/auth/login', { email: 'superadmin@test.com', password: 'WrongPassword!' });
  console.log('   Status:', invalidRes.status);
  console.log('   Error Code:', invalidRes.body?.errorCode);
  console.log('   Error Message:', invalidRes.body?.message);

  if (adminRes.status === 201 || adminRes.status === 200) {
    if (customerRes.status === 201 || customerRes.status === 200) {
      if (invalidRes.status === 401) {
        console.log('\n✅ ALL BACKEND AUTH VERIFICATIONS PASSED!');
        process.exit(0);
      }
    }
  }
  console.error('\n❌ VERIFICATION FAILED!');
  process.exit(1);
})();
