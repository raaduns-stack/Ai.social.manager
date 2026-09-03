require('dotenv/config');
const postgres = require('postgres');
const bcrypt = require('bcrypt');

const passwords = [
  'Password123!',
  'Password123',
  'Pass123!',
  'treasure',
  'adejumo',
  'adejumotreasure',
  'adejumo123',
  'treasure123',
  'adejumotreasure123',
  'password',
  'admin',
  'Admin123!',
  'Admin123',
  '123456',
  '12345678',
  'SecurePass123!'
];

async function check() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  try {
    const users = await sql`SELECT id, email, role, password_hash, account_status, is_email_verified FROM users`;
    console.log(`Found ${users.length} users:`);
    for (const u of users) {
      let matched = false;
      for (const p of passwords) {
        if (await bcrypt.compare(p, u.password_hash)) {
          console.log(`MATCH: ${u.email} (${u.role}) -> password: "${p}"`);
          matched = true;
          break;
        }
      }
      if (!matched) {
        console.log(`NO MATCH for ${u.email} (${u.role}) - Hash: ${u.password_hash}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

check();
