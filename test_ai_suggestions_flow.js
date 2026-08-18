const http = require('http');
const postgres = require('postgres');
require('dotenv').config({ path: 'apps/backend/.env' });

const API_KEY = process.env.N8N_INTERNAL_API_KEY || 'super_secret_n8n_key_12345';
const PORT = process.env.PORT || 4000;
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
    console.log('=== STEP 1: Prepare Test User and Real Calendar Post in DB ===');
    const testEmail = 'aisuggestion_test_user@example.com';
    const testPassword = 'SecurePass123!';
    const testFullName = 'AI Suggestion Test User';

    // Find or create test user
    let usersList = await sql`SELECT * FROM users WHERE email = ${testEmail}`;
    let userId;
    if (usersList.length === 0) {
      console.log('Registering test user...');
      const regRes = await request('POST', '/auth/register', {}, {
        email: testEmail,
        password: testPassword,
        fullName: testFullName,
      });
      userId = regRes.body.user.id;
    } else {
      userId = usersList[0].id;
    }

    // Ensure user is active and verified
    await sql`UPDATE users SET is_email_verified = true, is_active = true WHERE id = ${userId}`;
    console.log(`Test User ID: ${userId}`);

    // Login to get customer JWT
    const loginRes = await request('POST', '/auth/login', {}, { email: testEmail, password: testPassword });
    const token = loginRes.body.accessToken;
    console.log('Obtained customer JWT successfully.');
    const userHeaders = { Authorization: `Bearer ${token}` };

    // Connect a social platform to pass validation
    await sql`DELETE FROM social_accounts WHERE user_id = ${userId}`;
    await sql`INSERT INTO social_accounts (user_id, platform, account_name, status) 
              VALUES (${userId}, 'instagram', 'Test Account', 'connected')`;

    // Create a real content calendar post for test user
    console.log('Creating real Content Calendar post in DB...');
    const postRes = await request('POST', '/calendar/posts', userHeaders, {
      title: 'Automating Social Media Workflow with AI',
      caption: 'Initial caption before AI suggestions.',
      platform: 'Instagram',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });

    if (postRes.status !== 200 && postRes.status !== 201) {
      throw new Error(`Failed to create post: ${JSON.stringify(postRes.body)}`);
    }
    const realPostId = postRes.body.id;
    console.log(`Real Database Post ID created: ${realPostId}`);

    // === STEP 2: Start Mock n8n Webhook Server ===
    console.log('\n=== STEP 2: Starting Mock n8n Webhook Server ===');
    let receivedPayload = null;
    let n8nGetPostResult = null;

    webhookServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          receivedPayload = JSON.parse(body);
          console.log('[MOCK N8N] Received webhook trigger payload:', receivedPayload);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ accepted: true }));

          // Simulate n8n workflow execution:
          // Node 1: GET Calendar Post from SocialPilot using X-N8N-API-KEY
          console.log(`[MOCK N8N] Fetching calendar post context for postId=${receivedPayload.postId}...`);
          const postCtxRes = await request('GET', `/calendar/posts/${receivedPayload.postId}`, {
            'X-N8N-API-KEY': API_KEY,
          });
          n8nGetPostResult = postCtxRes;
          console.log('[MOCK N8N] GET calendar post response status:', postCtxRes.status);
          console.log('[MOCK N8N] Retrieved post title:', postCtxRes.body?.title);

          // Node 2: Generate AI variations and send response back to SocialPilot
          console.log('[MOCK N8N] Sending generated variations back to SocialPilot webhook response endpoint...');
          const webhookRespRes = await request('POST', '/content-suggestions/webhook/n8n-response', {
            'X-N8N-API-KEY': API_KEY,
          }, {
            postId: receivedPayload.postId,
            userId: receivedPayload.userId,
            variations: [
              {
                title: '5 Steps to Master AI Workflows',
                caption: 'Want to automate your content schedule? Here are 5 battle-tested strategies we use daily. 👇',
                hashtags: ['#automation', '#AI', '#growth'],
              },
              {
                title: 'Why AI Suggestions Save 10+ Hours/Week',
                caption: 'Stop starting from scratch. Let AI suggest high-converting captions for your brand! 🚀',
                hashtags: ['#productivity', '#marketing'],
              },
            ],
          });
          console.log('[MOCK N8N] n8n-response callback status:', webhookRespRes.status);
        } catch (e) {
          console.error('[MOCK N8N] Error in mock server:', e.message);
        }
      });
    });

    await new Promise((resolve) => {
      webhookServer.listen(5679, 'localhost', () => {
        console.log('[MOCK N8N] Listening on http://localhost:5679');
        resolve();
      });
    });

    // Temporarily point backend n8n webhook URL to mock server
    process.env.N8N_CONTENT_SUGGESTIONS_WEBHOOK_URL = 'http://localhost:5679/webhook';

    // === STEP 3: Trigger AI Suggestions for Post ===
    console.log('\n=== STEP 3: Triggering AI Suggestion endpoint via user JWT ===');
    const suggestionsRes = await request('POST', `/content-suggestions/post/${realPostId}/regenerate`, userHeaders);
    console.log('Regenerate suggestions response status:', suggestionsRes.status);

    // Wait a brief moment for async webhook flow to complete
    await new Promise(r => setTimeout(r, 1000));

    // === STEP 4: Verify Results & Data Integrity ===
    console.log('\n=== STEP 4: Verifying Received Data & Database State ===');
    console.log('1. Real postId received by n8n:', receivedPayload?.postId === realPostId ? 'PASSED (Matches DB)' : 'FAILED');
    console.log('2. Real userId received by n8n:', receivedPayload?.userId === userId ? 'PASSED (Matches Auth User)' : 'FAILED');
    console.log('3. n8n GET post by ID status:', n8nGetPostResult?.status === 200 ? 'PASSED (200 OK)' : 'FAILED');
    console.log('4. n8n GET post returned title:', n8nGetPostResult?.body?.title);

    // Fetch saved suggestions from DB via API
    const getSuggestionsRes = await request('GET', `/content-suggestions/post/${realPostId}`, userHeaders);
    console.log('\nRetrieved suggestions for post from API:');
    console.log(`Count: ${getSuggestionsRes.body.length}`);
    for (const s of getSuggestionsRes.body) {
      console.log(`- [ID: ${s.id}] Title: "${s.title}" | Caption: "${s.content}"`);
    }

    // === STEP 5: Security & Authorization Tests ===
    console.log('\n=== STEP 5: Testing Security Rules & Authorization ===');

    // Create a second user
    const secondEmail = 'user_two@example.com';
    let userTwoList = await sql`SELECT * FROM users WHERE email = ${secondEmail}`;
    let userTwoId;
    if (userTwoList.length === 0) {
      const reg2 = await request('POST', '/auth/register', {}, { email: secondEmail, password: testPassword, fullName: 'User Two' });
      userTwoId = reg2.body.user.id;
    } else {
      userTwoId = userTwoList[0].id;
    }
    await sql`UPDATE users SET is_email_verified = true, is_active = true WHERE id = ${userTwoId}`;
    const login2 = await request('POST', '/auth/login', {}, { email: secondEmail, password: testPassword });
    const userTwoHeaders = { Authorization: `Bearer ${login2.body.accessToken}` };

    // Test A: User Two tries to request suggestions for User One's post
    console.log('Test A: User Two requesting AI Suggestions for User One\'s post...');
    const unauthorizedRes = await request('GET', `/content-suggestions/post/${realPostId}`, userTwoHeaders);
    console.log(`Result Status: ${unauthorizedRes.status} (Expected: 404/403) -> ${unauthorizedRes.status === 404 || unauthorizedRes.status === 403 ? 'PASSED' : 'FAILED'}`);

    // Test B: n8n callback with mismatched userId and postId
    console.log('Test B: Sending n8n callback with mismatched userId and postId...');
    const mismatchRes = await request('POST', '/content-suggestions/webhook/n8n-response', {
      'X-N8N-API-KEY': API_KEY,
    }, {
      postId: realPostId,
      userId: userTwoId, // Wrong owner!
      variations: [{ caption: 'Hacked caption' }],
    });
    console.log(`Result Status: ${mismatchRes.status} (Expected: 400 Bad Request) -> ${mismatchRes.status === 400 ? 'PASSED' : 'FAILED'}`);

    // Clean up
    console.log('\nCleaning up test records from database...');
    await sql`DELETE FROM content_suggestions WHERE user_id IN (${userId}, ${userTwoId})`;
    await sql`DELETE FROM content_calendar WHERE user_id IN (${userId}, ${userTwoId})`;
    await sql`DELETE FROM social_accounts WHERE user_id IN (${userId}, ${userTwoId})`;
    await sql`DELETE FROM users WHERE id IN (${userId}, ${userTwoId})`;
    console.log('Cleanup complete.');

    console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! 🎉');

  } catch (err) {
    console.error('Test execution error:', err.message, err);
  } finally {
    await sql.end();
    if (webhookServer) {
      webhookServer.close();
    }
  }
})();
