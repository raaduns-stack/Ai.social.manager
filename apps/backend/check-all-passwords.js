require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const users = await sql.query(
    "SELECT id, email, role, account_status, is_active, is_email_verified, password_hash FROM users ORDER BY created_at DESC"
  );
  console.log('Total users:', users.length);
  for (const u of users) {
    let bcryptHashOk = false;
    let hashStartsWithBcrypt = u.password_hash && u.password_hash.startsWith('$2');
    if (hashStartsWithBcrypt) {
      // Try common test passwords
      const testPasswords = ['TestPass123!', 'Admin@2026', 'Admin@2026!', 'Password123!', 'Password123', 'admin123', 'test123', 'RaaSocial123!'];
      for (const p of testPasswords) {
        try {
          if (await bcrypt.compare(p, u.password_hash)) {
            bcryptHashOk = p;
            break;
          }
        } catch {}
      }
    }
    console.log({
      id: u.id.slice(0, 8),
      email: u.email,
      role: u.role,
      accountStatus: u.account_status,
      isActive: u.is_active,
      isEmailVerified: u.is_email_verified,
      hasBcryptHash: hashStartsWithBcrypt,
      workingPassword: bcryptHashOk || 'NONE',
    });
  }
})();
