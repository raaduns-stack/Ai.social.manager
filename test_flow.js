const http = require('http');
const postgres = require('postgres');
require('dotenv').config({ path: 'apps/backend/.env' });

const API_KEY = 'super_secret_n8n_key_12345';
const PORT = 4000;
const HOST = 'localhost';

// Helper to make HTTP requests
function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: HOST,
      port: PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

(async () => {
  let webhookServer;
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

  try {
    console.log('--- Step 0: Preparing Test User in Database ---');
    const testEmail = 'calendar_test_user@example.com';
    const testPassword = 'SecurePass123!';
    const testFullName = 'Calendar Test User';
    
    // Find or create test user
    let usersList = await sql`SELECT * FROM users WHERE email = ${testEmail}`;
    let userId;
    if (usersList.length === 0) {
      console.log('Creating test user...');
      console.log('Registering user via API...');
      const regRes = await request('POST', '/auth/register', {}, {
        email: testEmail,
        password: testPassword,
        fullName: testFullName,
      });
      console.log('Register status:', regRes.status, regRes.body);
      userId = regRes.body.user.id;
    } else {
      userId = usersList[0].id;
    }

    // Force verified and active status in DB
    await sql`UPDATE users SET is_email_verified = true, is_active = true WHERE id = ${userId}`;
    console.log('User verified & active.');

    // Ensure company profile exists
    const profileList = await sql`SELECT * FROM customer_company_profile WHERE user_id = ${userId}`;
    if (profileList.length === 0) {
      await sql`INSERT INTO customer_company_profile (user_id, business_name, business_description, industry) 
                VALUES (${userId}, 'Test Business', 'Description of test business', 'Marketing')`;
      console.log('Created company profile.');
    }

    // Login to get customer JWT
    console.log('Logging in to get JWT token...');
    const loginRes = await request('POST', '/auth/login', {}, { email: testEmail, password: testPassword });
    if (loginRes.status !== 200 && loginRes.status !== 201) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }
    const token = loginRes.body.accessToken;
    console.log('Obtained customer JWT successfully.');

    const customerHeaders = { Authorization: `Bearer ${token}` };

    // --- Step 1: Start Mock n8n Webhook Server ---
    console.log('\n--- Step 1: Starting Mock n8n Webhook Server ---');
    webhookServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        const payload = JSON.parse(body);
        console.log('[MOCK N8N] Received webhook trigger:', payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ accepted: true }));

        // Run n8n flow tasks asynchronously
        try {
          // A. Fetch Context
          console.log('[MOCK N8N] Fetching customer context from NestJS...');
          const ctxRes = await request('GET', `/calendar/generation-context/${payload.customerId}`, {
            'X-N8N-API-KEY': API_KEY,
          });
          console.log('[MOCK N8N] Context response:', ctxRes.status, JSON.stringify(ctxRes.body));

          // B. Generate and submit results
          console.log('[MOCK N8N] Submitting generated content posts...');
          const resultRes = await request('POST', `/calendar/generation/${payload.jobId}/result`, {
            'X-N8N-API-KEY': API_KEY,
          }, {
            customerId: payload.customerId,
            month: payload.month,
            posts: [
              {
                title: 'First Post Title',
                caption: 'Caption for first post',
                platform: 'Instagram',
                scheduledDate: `${payload.month}-05`,
                scheduledTime: '10:00',
                hashtags: ['#insta', '#test'],
              },
              {
                title: 'Second Post Title',
                caption: 'Caption for second post',
                platform: 'Facebook',
                scheduledDate: `${payload.month}-12`,
                scheduledTime: '14:30',
                hashtags: ['#fb', '#test'],
              },
            ]
          });
          console.log('[MOCK N8N] Result submission status:', resultRes.status, resultRes.body);
        } catch (e) {
          console.error('[MOCK N8N] Error during mock execution:', e.message);
        }
      });
    });

    webhookServer.listen(5678, 'localhost', () => {
      console.log('[MOCK N8N] Listening for webhooks on http://localhost:5678');
    });

    // --- Step 2: Request Calendar Generation ---
    console.log('\n--- Step 2: Requesting Content Calendar Generation ---');
    const genRes = await request('POST', '/calendar/generate', customerHeaders, {
      month: '2026-09',
      platforms: ['Instagram', 'Facebook'],
    });
    console.log('Generate status:', genRes.status, genRes.body);
    const jobId = genRes.body.id;

    // --- Step 3: Poll/Check Status of Generation Job ---
    console.log('\n--- Step 3: Checking Job Status ---');
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const statusRes = await request('GET', `/calendar/generation/${jobId}`, customerHeaders);
      console.log(`Poll #${i + 1} Status:`, statusRes.body.status);
      if (statusRes.body.status === 'GENERATED' || statusRes.body.status === 'FAILED') {
        console.log('Job finished processing with status:', statusRes.body.status);
        break;
      }
    }

    // --- Step 4: Verify Saved Posts in Database ---
    console.log('\n--- Step 4: Checking Saved Calendar Posts ---');
    const posts = await sql`SELECT * FROM content_calendar WHERE user_id = ${userId} AND ai_generated = true`;
    console.log(`Found ${posts.length} AI generated posts:`);
    for (const post of posts) {
      console.log(`- [${post.platform}] ${post.title} (Scheduled: ${post.scheduled_at})`);
    }

    // Clean up
    console.log('\nCleaning up generated posts and job from DB...');
    await sql`DELETE FROM content_calendar WHERE user_id = ${userId}`;
    await sql`DELETE FROM calendar_generation_jobs WHERE user_id = ${userId}`;
    console.log('Cleanup complete.');

  } catch (error) {
    console.error('Test script error:', error.message);
  } finally {
    await sql.end();
    if (webhookServer) {
      webhookServer.close();
      console.log('Webhook server stopped.');
    }
  }
})();
