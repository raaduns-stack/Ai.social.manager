const fs = require('fs');
const jwt = require('jsonwebtoken');

const env = fs.readFileSync('apps/backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const jwtMatch = env.match(/JWT_ACCESS_SECRET=([^\r\n]+)/);
const secret = jwtMatch ? jwtMatch[1].replace(/['"]/g, '') : 'default_secret';
const sql = require('postgres')(match[1].replace(/['"]/g, ''));

async function main() {
  console.log('===============================================================');
  console.log('       MULTI-ROLE COMPREHENSIVE APPLICATION HEALTH AUDIT       ');
  console.log('===============================================================\n');

  const admins = await sql`SELECT id, email, role FROM users WHERE role IN ('super_admin', 'account_manager') LIMIT 1`;
  const designers = await sql`SELECT id, email, role FROM users WHERE role = 'designer' LIMIT 1`;
  const customers = await sql`SELECT id, email, role FROM users WHERE role = 'user' LIMIT 1`;

  const adminToken = jwt.sign(
    { sub: admins[0].id, email: admins[0].email, role: admins[0].role },
    secret,
    { expiresIn: '1h' }
  );

  const designerToken = jwt.sign(
    { sub: designers[0].id, email: designers[0].email, role: designers[0].role },
    secret,
    { expiresIn: '1h' }
  );

  const customerToken = customers.length
    ? jwt.sign({ sub: customers[0].id, email: customers[0].email, role: customers[0].role }, secret, { expiresIn: '1h' })
    : adminToken;

  const BASE = 'http://127.0.0.1:4000/api';

  async function check(domain, role, method, path, token) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        console.log(`✅ [${res.status}] [${domain}] [${role}] ${method} ${path}`);
        return true;
      } else {
        const text = await res.text();
        console.error(`❌ [${res.status}] [${domain}] [${role}] ${method} ${path} ->`, text.slice(0, 100));
        return false;
      }
    } catch (err) {
      console.error(`❌ [EXCEPTION] [${domain}] [${role}] ${method} ${path} ->`, err.message);
      return false;
    }
  }

  const tests = [
    // 1. Health & Auth
    { domain: 'System', role: 'Public', method: 'GET', path: '/health', token: '' },
    { domain: 'Auth', role: 'Admin', method: 'GET', path: '/auth/me', token: adminToken },
    { domain: 'Auth', role: 'Admin', method: 'GET', path: '/auth/me/permissions', token: adminToken },

    // 2. Admin - Core & Operations
    { domain: 'Admin', role: 'Admin', method: 'GET', path: '/admin/dashboard-summary', token: adminToken },
    { domain: 'Admin', role: 'Admin', method: 'GET', path: '/admin/users', token: adminToken },
    { domain: 'Admin', role: 'Admin', method: 'GET', path: '/admin/billing/stats', token: adminToken },
    { domain: 'Admin', role: 'Admin', method: 'GET', path: '/admin/social-accounts', token: adminToken },
    { domain: 'Admin', role: 'Admin', method: 'GET', path: '/admin/uploads', token: adminToken },
    { domain: 'Admin', role: 'Admin', method: 'GET', path: '/admin/activity-logs', token: adminToken },
    { domain: 'Admin', role: 'Admin', method: 'GET', path: '/admin/login-history', token: adminToken },
    { domain: 'Admin', role: 'Admin', method: 'GET', path: '/admin/notifications/history', token: adminToken },

    // 3. Admin - Design Section
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/design-tasks', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/design-submissions', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/designer-payments/dashboard', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/designer-payments/earnings', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/designer-payments/records', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/designer-payments/settings', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/design-reports/overview', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/design-reports/design-performance', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/design-reports/designer-performance', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/design-reports/staff-performance', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/design-reports/payment-earnings', token: adminToken },
    { domain: 'Admin Design', role: 'Admin', method: 'GET', path: '/admin/design-reports/operational-workflow', token: adminToken },

    // 4. Designer Portal
    { domain: 'Designer', role: 'Designer', method: 'GET', path: '/designer/dashboard/summary', token: designerToken },
    { domain: 'Designer', role: 'Designer', method: 'GET', path: '/designer/tasks', token: designerToken },
    { domain: 'Designer', role: 'Designer', method: 'GET', path: '/designer/submissions', token: designerToken },
    { domain: 'Designer', role: 'Designer', method: 'GET', path: '/designer/payments', token: designerToken },
    { domain: 'Designer', role: 'Designer', method: 'GET', path: '/designer/notifications', token: designerToken },
    { domain: 'Designer', role: 'Designer', method: 'GET', path: '/designer/image-to-code', token: designerToken },

    // 5. Customer App
    { domain: 'Customer', role: 'Customer', method: 'GET', path: '/dashboard/my-summary', token: customerToken },
    { domain: 'Customer', role: 'Customer', method: 'GET', path: '/notifications', token: customerToken },
    { domain: 'Customer', role: 'Customer', method: 'GET', path: '/notifications/unread-count', token: customerToken },
    { domain: 'Customer', role: 'Customer', method: 'GET', path: '/uploads', token: customerToken },
    { domain: 'Customer', role: 'Customer', method: 'GET', path: '/plans', token: customerToken },
  ];

  let passed = 0;
  for (const t of tests) {
    const ok = await check(t.domain, t.role, t.method, t.path, t.token);
    if (ok) passed++;
  }

  console.log(`\nAudit Complete: ${passed}/${tests.length} endpoints passed.`);
  await sql.end();

  if (passed === tests.length) {
    console.log('🎉 ALL APPLICATION DOMAINS & ROLES HEALTHY!');
  } else {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
