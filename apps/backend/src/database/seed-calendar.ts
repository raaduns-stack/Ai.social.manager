import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require' });

async function main() {
  try {
    // Get existing users
    const users = await sql`SELECT id, email, full_name FROM users LIMIT 5`;
    console.log('Found users in database:', users);

    if (users.length === 0) {
      console.log('No users found in database to link calendar posts to.');
      return;
    }

    const testUser = users[0];
    console.log(`Seeding calendar posts for user: ${testUser.full_name} (${testUser.id})`);

    // Clean existing posts to prevent duplicate key or overflow
    await sql`DELETE FROM content_calendar WHERE user_id = ${testUser.id}`;

    // Insert structured calendar posts matching status & approvalStatus constraints
    const posts = [
      {
        user_id: testUser.id,
        title: '5 Steps to Automate Your Workflow',
        caption: "Efficiency isn't just about doing more; it's about doing what matters. Check out these 5 automation hacks that saved our team 20+ hours a week.",
        platform: 'Instagram',
        status: 'SCHEDULED',
        approval_status: 'APPROVED',
        scheduled_at: new Date('2026-08-15T10:00:00Z'),
        hashtags: JSON.stringify(['#productivity', '#SaaS', '#WorkflowAutomation']),
        ai_generated: true
      },
      {
        user_id: testUser.id,
        title: 'The Future of AI in Content Creation',
        caption: "AI isn't replacing creators; it's empowering them. 🚀 We analyzed the latest engagement data—here's what you need to know.",
        platform: 'X / Twitter',
        status: 'PUBLISHED',
        approval_status: 'APPROVED',
        published_at: new Date('2026-08-08T14:30:00Z'),
        hashtags: JSON.stringify(['#AI', '#ContentStrategy', '#SocialMediaTrends']),
        ai_generated: true
      },
      {
        user_id: testUser.id,
        title: 'Behind the Scenes at Product Launch',
        caption: "Behind every 'perfect' post is a whole lot of chaos. ☕️ Tag someone who needs to see the unedited version of building a startup!",
        platform: 'TikTok',
        status: 'SCHEDULED',
        approval_status: 'PENDING',
        scheduled_at: new Date('2026-08-20T16:00:00Z'),
        hashtags: JSON.stringify(['#BTS', '#StartupLife', '#CreativeProcess']),
        ai_generated: false
      },
      {
        user_id: testUser.id,
        title: "Why 'Quantity' is No Longer King in B2B",
        caption: "Stop chasing the algorithm and start chasing your audience's needs. 🎯 In 2026, one 'perfect' post is worth 100 'good enough' ones.",
        platform: 'LinkedIn',
        status: 'SCHEDULED',
        approval_status: 'APPROVED',
        scheduled_at: new Date('2026-08-22T09:15:00Z'),
        hashtags: JSON.stringify(['#LinkedInTips', '#ThoughtLeadership', '#MarketingStrategy']),
        ai_generated: true
      },
      {
        user_id: testUser.id,
        title: 'Transforming Social Analytics into Real ROI',
        caption: 'Turn raw data into real ROI. 📊 Our latest dashboard update gives you real-time insights with zero noise.',
        platform: 'Instagram',
        status: 'SCHEDULED',
        approval_status: 'REVISION_REQUIRED',
        admin_notes: 'Please refine the CTA link wording to match the latest summer campaign.',
        scheduled_at: new Date('2026-08-18T11:00:00Z'),
        hashtags: JSON.stringify(['#SocialMediaTools', '#Analytics', '#Growth']),
        ai_generated: true
      }
    ];

    for (const post of posts) {
      await sql`
        INSERT INTO content_calendar (
          user_id, title, caption, platform, status, approval_status, admin_notes, scheduled_at, published_at, hashtags, ai_generated
        ) VALUES (
          ${post.user_id}, ${post.title}, ${post.caption}, ${post.platform}, ${post.status}, ${post.approval_status}, ${post.admin_notes || null}, ${post.scheduled_at || null}, ${post.published_at || null}, ${post.hashtags}, ${post.ai_generated}
        )
      `;
    }

    console.log('Successfully seeded content_calendar posts.');
  } catch (err) {
    console.error('Failed to seed calendar posts:', err);
  } finally {
    await sql.end();
  }
}

main();
