const http = require('http');
const postgres = require('postgres');
require('dotenv').config({ path: './.env' });

function request(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api${path}`,
      method,
      headers,
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
    if (body) req.write(data);
    req.end();
  });
}

(async () => {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

  try {
    const normalEmail = `normal_${Date.now()}@example.com`;
    const adminEmail = `admin_${Date.now()}@example.com`;
    const password = 'SecurePass123!';

    console.log('--- Setting up test users ---');
    // Register Normal User
    const reg1 = await request('/auth/register', 'POST', {
      email: normalEmail,
      password,
      fullName: 'Normal User'
    });
    console.log('Register normal:', reg1.status, reg1.body);
    await sql.unsafe(`UPDATE users SET is_email_verified = true WHERE email = '${normalEmail}'`);
    const rNormal = await request('/auth/login', 'POST', { email: normalEmail, password });
    console.log('Login normal response:', rNormal.status, rNormal.body);
    const normalToken = rNormal.body.accessToken;

    // Register Admin User
    const reg2 = await request('/auth/register', 'POST', {
      email: adminEmail,
      password,
      fullName: 'Admin User'
    });
    console.log('Register admin:', reg2.status, reg2.body);
    await sql.unsafe(`UPDATE users SET is_email_verified = true, role = 'super_admin' WHERE email = '${adminEmail}'`);
    const rAdmin = await request('/auth/login', 'POST', { email: adminEmail, password });
    console.log('Login admin response:', rAdmin.status, rAdmin.body);
    const adminToken = rAdmin.body.accessToken;

    console.log('1. Testing Unauthenticated Request (Expecting 401)');
    const r1 = await request('/admin/analytics', 'GET');
    console.log('Status:', r1.status);
    console.log(r1.status === 401 ? '✅ Passed' : '❌ Failed');
    console.log('-------------------------------------------');

    console.log('2. Testing Normal User Request (Expecting 403)');
    const r2 = await request('/admin/analytics', 'GET', null, normalToken);
    console.log('Status:', r2.status);
    console.log(r2.status === 403 ? '✅ Passed' : '❌ Failed');
    console.log('-------------------------------------------');

    console.log('3. Testing Admin User Request (Expecting 200)');
    const r3 = await request('/admin/analytics', 'GET', null, adminToken);
    console.log('Status:', r3.status);
    console.log(r3.status === 200 ? '✅ Passed' : '❌ Failed');
    if (r3.status === 200) {
      console.log('✅ Empty-data handling & response structure:');
      console.log('KPIs:', Object.keys(r3.body.kpis));
      console.log('Revenue buckets count (month):', r3.body.revenueTimeSeries.buckets.length);
      console.log('Social platforms count:', r3.body.socialPerformance.platforms.length);
      console.log('AI Usage dataAvailable:', r3.body.aiUsageTimeSeries.dataAvailable);
      console.log('Top Content dataAvailable:', r3.body.topContent.dataAvailable);
    }
    console.log('-------------------------------------------');

    console.log('4. Testing day/week filters');
    const rDay = await request('/admin/analytics?period=day', 'GET', null, adminToken);
    console.log('Day buckets count:', rDay.body?.revenueTimeSeries?.buckets?.length);
    
    const rWeek = await request('/admin/analytics?period=week', 'GET', null, adminToken);
    console.log('Week buckets count:', rWeek.body?.revenueTimeSeries?.buckets?.length);

  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
})();
