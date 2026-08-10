const postgres = require('postgres');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './apps/backend/.env' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

const passwords = [
  'password', 'Password123', 'admin', 'Admin123', '123456', '12345678',
  'Pass123!', 'password123', 'owner', 'owner123', 'ownerpassword', 'test',
  'testpass', 'testpassword', 'socialpilot', 'socialpilot123'
];

(async () => {
  try {
    const users = await sql.unsafe('SELECT email, password_hash FROM users');
    console.log(`Found ${users.length} users in DB. Testing common passwords...`);

    for (const u of users) {
      let matched = false;
      for (const p of passwords) {
        if (await bcrypt.compare(p, u.password_hash)) {
          console.log(`Match found! User: ${u.email} -> Password: "${p}"`);
          matched = true;
          break;
        }
      }
      if (!matched) {
        console.log(`No common password matched for user: ${u.email} (hash: ${u.password_hash})`);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sql.end();
  }
})();
