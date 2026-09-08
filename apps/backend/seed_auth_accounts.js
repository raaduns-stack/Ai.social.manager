require('dotenv/config');
const postgres = require('postgres');
const bcrypt = require('bcrypt');

async function seed() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
  try {
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Get the free plan ID
    let freePlans = await sql`SELECT id FROM plans WHERE slug = 'free' LIMIT 1`;
    if (freePlans.length === 0) {
      console.log('Inserting default free plan...');
      freePlans = await sql`
        INSERT INTO plans (name, slug, price, interval, is_active, max_social_accounts, description, monthly_post_limit)
        VALUES ('Free', 'free', 0, 'monthly', true, 2, 'Default free plan', 8)
        RETURNING id
      `;
    }
    const freePlanId = freePlans[0].id;

    const testUsers = [
      {
        email: 'superadmin@test.com',
        fullName: 'Super Admin',
        role: 'super_admin',
        accountStatus: 'ACTIVE',
      },
      {
        email: 'sushibmanger2023@gmail.com',
        fullName: 'Sushi Super Admin',
        role: 'super_admin',
        accountStatus: 'ACTIVE',
      },
      {
        email: 'testclient1@example.com',
        fullName: 'Test Client',
        role: 'user',
        accountStatus: 'ACTIVE',
      },
      {
        email: 'customer@test.com',
        fullName: 'Demo Customer',
        role: 'user',
        accountStatus: 'ACTIVE',
      },
    ];

    for (const u of testUsers) {
      const existing = await sql`SELECT id FROM users WHERE email = ${u.email}`;
      let userId;

      if (existing.length > 0) {
        userId = existing[0].id;
        await sql`
          UPDATE users
          SET password_hash = ${passwordHash},
              full_name = ${u.fullName},
              role = ${u.role},
              account_status = ${u.accountStatus},
              is_active = true,
              is_email_verified = true,
              email_verified_at = NOW(),
              updated_at = NOW()
          WHERE id = ${userId}
        `;
        console.log(`Updated user: ${u.email} (${u.role})`);
      } else {
        const inserted = await sql`
          INSERT INTO users (email, password_hash, full_name, role, account_status, is_active, is_email_verified, email_verified_at)
          VALUES (${u.email}, ${passwordHash}, ${u.fullName}, ${u.role}, ${u.accountStatus}, true, true, NOW())
          RETURNING id
        `;
        userId = inserted[0].id;
        console.log(`Created user: ${u.email} (${u.role})`);
      }

      // Check subscription
      const existingSub = await sql`SELECT id FROM subscriptions WHERE user_id = ${userId} AND status = 'active'`;
      if (existingSub.length === 0) {
        await sql`
          INSERT INTO subscriptions (user_id, plan_id, status)
          VALUES (${userId}, ${freePlanId}, 'active')
        `;
        console.log(`Created free subscription for: ${u.email}`);
      }
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await sql.end();
  }
}

seed();
