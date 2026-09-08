require('dotenv/config');
const postgres = require('postgres');

async function check() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    const settings = await sql`
      SELECT * FROM notification_type_settings
    `;
    console.log('notification_type_settings rows:', settings.length);
    settings.forEach(s => console.log(' -', s.notification_type, '| global:', s.is_enabled_globally, '| email:', s.email_available, '| inApp:', s.in_app_available));

    const prefs = await sql`
      SELECT * FROM notification_preferences LIMIT 5
    `;
    console.log('\nnotification_preferences rows:', prefs.length);
    prefs.forEach(p => console.log(' - user:', p.user_id, '| type:', p.notification_type, '| email:', p.email_enabled, '| inApp:', p.in_app_enabled));

    const notifs = await sql`
      SELECT id, user_id, type, channel, status, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 5
    `;
    console.log('\nRecent notifications:', notifs.length);
    notifs.forEach(n => console.log(' -', n.id, '| user:', n.user_id, '| type:', n.type, '| channel:', n.channel, '| read:', n.is_read, '| created:', n.created_at));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

check();
