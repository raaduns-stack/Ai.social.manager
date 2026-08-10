const postgres = require('postgres');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './apps/backend/.env' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

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
  '12345678'
];

(async () => {
  try {
    const users = await sql.unsafe('SELECT email, password_hash FROM users');
    console.log(`Found ${users.length} users. Testing passwords...`);
    for (const u of users) {
      for (const p of passwords) {
        if (await bcrypt.compare(p, u.password_hash)) {
          console.log(`MATCH: User: ${u.email} -> Password: "${p}"`);
        }
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
})();
