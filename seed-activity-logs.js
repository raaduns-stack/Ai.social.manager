const postgres = require('postgres');

const dbUrl = 'postgresql://neondb_owner:npg_n1dY0xOKwsyZ@ep-little-wind-axuuaawc.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';
const sql = postgres(dbUrl);

async function run() {
  try {
    const users = await sql.unsafe('SELECT id, full_name FROM users LIMIT 3');
    if (users.length === 0) {
      console.log('No users found.');
      process.exit(1);
    }
    const admin = users.find(u => u.full_name.toLowerCase().includes('naanma')) || users[0];
    const customer = users.find(u => u.full_name.toLowerCase().includes('samuel')) || users[0];

    const logs = [
      {
        user_id: customer.id,
        user_name: customer.full_name,
        action: 'USER_REGISTERED',
        module: 'Users',
        description: `New customer registered: ${customer.full_name}`,
      },
      {
        user_id: admin.id,
        user_name: admin.full_name,
        action: 'USER_SUSPENDED',
        module: 'Users',
        description: `Admin suspended user account: ${customer.id}`,
      },
      {
        user_id: customer.id,
        user_name: customer.full_name,
        action: 'PAYMENT_SUCCESSFUL',
        module: 'Billing',
        description: `Subscription payment successful for Starter plan. Amount: $30.00`,
      },
      {
        user_id: admin.id,
        user_name: admin.full_name,
        action: 'PROMPT_UPDATED',
        module: 'AI Management',
        description: `Admin updated default system prompt template for Facebook.`,
      },
      {
        user_id: admin.id,
        user_name: admin.full_name,
        action: 'STAFF_ADDED',
        module: 'Staff',
        description: `Super admin invited a new team member: test_staff@example.com`,
      },
      {
        user_id: customer.id,
        user_name: customer.full_name,
        action: 'POST_SCHEDULED',
        module: 'Calendar',
        description: `User scheduled a new Instagram post for 2026-08-15.`,
      },
      {
        user_id: null,
        user_name: 'System',
        action: 'SYSTEM_BACKUP',
        module: 'System',
        description: `Automated nightly database backup completed successfully.`,
      }
    ];

    for (const log of logs) {
      await sql.unsafe(
        'INSERT INTO activity_logs (user_id, user_name, action, module, description) VALUES ($1, $2, $3, $4, $5)',
        [log.user_id, log.user_name, log.action, log.module, log.description]
      );
      console.log(`Inserted activity log for module: ${log.module}`);
    }
  } catch (err) {
    console.error('Error seeding activity logs:', err);
  } finally {
    await sql.end();
  }
}

run();
