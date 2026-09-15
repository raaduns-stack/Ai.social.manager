const fs = require('fs');
const env = fs.readFileSync('apps/backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const jwtMatch = env.match(/JWT_ACCESS_SECRET=([^\r\n]+)/);
const sql = require('postgres')(match[1].replace(/['"]/g, ''));
const jwt = require('jsonwebtoken');

async function run() {
  const admins = await sql`SELECT id, email, full_name, role, is_active FROM users WHERE role = 'super_admin' LIMIT 1`;
  if (admins.length > 0) {
    const admin = admins[0];
    const secret = jwtMatch ? jwtMatch[1].replace(/['"]/g, '') : 'default_secret';
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    const session = {
      id: admin.id,
      email: admin.email,
      name: admin.full_name,
      role: admin.role,
      permissions: {
        analytics: 'manage',
        dashboard: 'manage',
        user_management: 'manage',
        money_management: 'manage',
        content_calendar: 'manage',
        content_creation: 'manage',
        notification_management: 'manage',
        audit_logs: 'manage',
        staff_management: 'manage',
        billing: 'manage',
        social_accounts: 'manage',
        upload_management: 'manage',
        ai_config: 'manage',
        support: 'manage'
      },
      accessToken: token,
      refreshToken: token,
    };
    console.log('SESSION_RAW=' + JSON.stringify(session));
  }
  await sql.end();
}
run();
