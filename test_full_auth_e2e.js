const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqOptions = {
      hostname: 'localhost',
      port: 4000,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(reqOptions, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log('====================================================');
  console.log('   FULL END-TO-END AUTHENTICATION SUITE VERIFICATION');
  console.log('====================================================\n');

  let passed = true;

  // --- 1. CUSTOMER PORTAL AUTH FLOW ---
  console.log('[CUSTOMER PORTAL FLOW]');
  console.log('Submitting POST /api/auth/login with testclient1@example.com...');
  const customerLogin = await request({ path: '/api/auth/login', method: 'POST' }, {
    email: 'testclient1@example.com',
    password: 'Password123!',
  });

  if (customerLogin.status === 200 || customerLogin.status === 201) {
    console.log('  ✔ Customer Login HTTP Status:', customerLogin.status);
    console.log('  ✔ Returned User ID:', customerLogin.body?.user?.id);
    console.log('  ✔ User Role:', customerLogin.body?.user?.role);
    console.log('  ✔ Active Plan Slug:', customerLogin.body?.user?.plan?.slug);
    console.log('  ✔ Access Token Issued:', !!customerLogin.body?.accessToken);
    console.log('  ✔ Set-Cookie Header Present:', !!customerLogin.headers['set-cookie']);

    // Verify /api/auth/me with access token
    const token = customerLogin.body.accessToken;
    const customerMe = await request({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (customerMe.status === 200) {
      console.log('  ✔ GET /api/auth/me Succeeded:', customerMe.body.email);
    } else {
      console.error('  ❌ GET /api/auth/me Failed:', customerMe.status, customerMe.body);
      passed = false;
    }
  } else {
    console.error('  ❌ Customer Login Failed:', customerLogin.status, customerLogin.body);
    passed = false;
  }

  console.log('\n----------------------------------------------------\n');

  // --- 2. ADMIN PORTAL AUTH FLOW ---
  console.log('[ADMIN PORTAL FLOW]');
  console.log('Submitting POST /api/auth/login with superadmin@test.com...');
  const adminLogin = await request({ path: '/api/auth/login', method: 'POST' }, {
    email: 'superadmin@test.com',
    password: 'Password123!',
  });

  if (adminLogin.status === 200 || adminLogin.status === 201) {
    console.log('  ✔ Admin Login HTTP Status:', adminLogin.status);
    console.log('  ✔ Returned Admin ID:', adminLogin.body?.user?.id);
    console.log('  ✔ Admin Role:', adminLogin.body?.user?.role);
    console.log('  ✔ Access Token Issued:', !!adminLogin.body?.accessToken);
    console.log('  ✔ Set-Cookie Header Present:', !!adminLogin.headers['set-cookie']);

    // Verify /api/auth/me/permissions with access token
    const adminToken = adminLogin.body.accessToken;
    const adminPerms = await request({
      path: '/api/auth/me/permissions',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminPerms.status === 200) {
      console.log('  ✔ GET /api/auth/me/permissions Succeeded!');
      console.log('  ✔ Dashboard Access Level:', adminPerms.body?.permissions?.dashboard);
      console.log('  ✔ User Management Access Level:', adminPerms.body?.permissions?.user_management);
    } else {
      console.error('  ❌ GET /api/auth/me/permissions Failed:', adminPerms.status, adminPerms.body);
      passed = false;
    }
  } else {
    console.error('  ❌ Admin Login Failed:', adminLogin.status, adminLogin.body);
    passed = false;
  }

  console.log('\n----------------------------------------------------\n');

  // --- 3. REJECTION & ERROR FLOWS ---
  console.log('[REJECTION & ERROR FLOWS]');
  console.log('Testing invalid password rejection...');
  const badPass = await request({ path: '/api/auth/login', method: 'POST' }, {
    email: 'superadmin@test.com',
    password: 'WrongPassword999',
  });
  if (badPass.status === 401 && badPass.body?.errorCode === 'INVALID_CREDENTIALS') {
    console.log('  ✔ Rejection Status: 401');
    console.log('  ✔ Error Code:', badPass.body.errorCode);
    console.log('  ✔ Error Message:', badPass.body.message);
  } else {
    console.error('  ❌ Rejection Test Failed:', badPass.status, badPass.body);
    passed = false;
  }

  console.log('\n====================================================');
  if (passed) {
    console.log('  🎉 E2E AUTHENTICATION VERIFICATION SUCCESSFUL!');
    console.log('====================================================');
    process.exit(0);
  } else {
    console.log('  ❌ E2E AUTHENTICATION VERIFICATION FAILED!');
    console.log('====================================================');
    process.exit(1);
  }
})();
