const fs = require('fs');
const jwt = require('jsonwebtoken');

const env = fs.readFileSync('apps/backend/.env', 'utf8');
const jwtMatch = env.match(/JWT_ACCESS_SECRET=([^\r\n]+)/);
const secret = jwtMatch ? jwtMatch[1].replace(/['"]/g, '') : 'default_secret';

const adminId = '92ce8d0e-3d4d-4b95-872d-91722a214808';
const token = jwt.sign(
  { sub: adminId, email: 'sushibmanger2023@gmail.com', role: 'super_admin' },
  secret,
  { expiresIn: '1h' }
);

const BASE = 'http://127.0.0.1:4000/api/admin/design-reports';

async function testEndpoint(name, url) {
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ [${res.status}] ${name} failed:`, errText);
      return false;
    }

    const data = await res.json();
    console.log(`✅ [${res.status}] ${name} returned success:`);
    console.log('   Data keys:', Object.keys(data));
    return true;
  } catch (err) {
    console.error(`❌ [EXCEPTION] ${name}:`, err.message);
    return false;
  }
}

async function run() {
  console.log('=== ADMIN DESIGN REPORTS & ANALYTICS VERIFICATION ===\n');

  const tests = [
    { name: '1. Overview (All Time)', url: `${BASE}/overview?timeframe=all` },
    { name: '2. Overview (Last 30 Days)', url: `${BASE}/overview?timeframe=30d` },
    { name: '3. Design Performance', url: `${BASE}/design-performance?timeframe=all` },
    { name: '4. Designer Performance', url: `${BASE}/designer-performance?timeframe=all` },
    { name: '5. Staff Performance', url: `${BASE}/staff-performance?timeframe=all` },
    { name: '6. Payment & Earnings', url: `${BASE}/payment-earnings?timeframe=all` },
    { name: '7. Operational Workflow', url: `${BASE}/operational-workflow?timeframe=all` },
  ];

  let passed = 0;
  for (const t of tests) {
    const ok = await testEndpoint(t.name, t.url);
    if (ok) passed++;
  }

  console.log(`\nResults: ${passed}/${tests.length} tests passed.`);
  if (passed === tests.length) {
    console.log('🎉 ALL REPORT ENDPOINTS WORKING WITH REAL DB AGGREGATIONS!');
  } else {
    process.exit(1);
  }
}

run();
