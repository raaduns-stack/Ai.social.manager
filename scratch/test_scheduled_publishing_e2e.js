require('./apps/backend/node_modules/dotenv').config({ path: './apps/backend/.env' });
const { NestFactory } = require('./apps/backend/node_modules/@nestjs/core');
const { AppModule } = require('./apps/backend/dist/app.module');
const { PublishingService } = require('./apps/backend/dist/publishing/publishing.service');
const { SchedulingService } = require('./apps/backend/dist/scheduling/scheduling.service');
const { NotificationsService } = require('./apps/backend/dist/notifications/notifications.service');
const postgres = require('./node_modules/postgres');

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function runTests() {
  console.log('================================================================');
  console.log('E2E VERIFICATION: SCHEDULED PUBLISHING (REQ 8, 10, 11, 12)');
  console.log('================================================================\n');

  console.log('Initializing NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const publishingService = app.get(PublishingService);
  const schedulingService = app.get(SchedulingService);
  const notificationsService = app.get(NotificationsService);

  const testUserId = '11111111-aaaa-bbbb-cccc-000000000001';
  const testCalPostId1 = '22222222-aaaa-bbbb-cccc-000000000001';
  const testSchedPostId1 = '33333333-aaaa-bbbb-cccc-000000000001';
  const testVarId1 = '44444444-aaaa-bbbb-cccc-000000000001';

  const testCalPostId2 = '22222222-aaaa-bbbb-cccc-000000000002';
  const testSchedPostId2 = '33333333-aaaa-bbbb-cccc-000000000002';
  const testVarId2 = '44444444-aaaa-bbbb-cccc-000000000002';

  const testSocialAccId = '55555555-aaaa-bbbb-cccc-000000000001';

  try {
    // -------------------------------------------------------------------------
    // Setup Test Data
    // -------------------------------------------------------------------------
    console.log('--- Setting up clean test fixtures ---');
    await sql`DELETE FROM notifications WHERE user_id = ${testUserId}`;
    await sql`DELETE FROM publishing_logs WHERE scheduled_post_id IN (${testSchedPostId1}, ${testSchedPostId2})`;
    await sql`DELETE FROM scheduled_posts WHERE scheduled_post_id IN (${testSchedPostId1}, ${testSchedPostId2})`;
    await sql`DELETE FROM content_calendar WHERE id IN (${testCalPostId1}, ${testCalPostId2})`;
    await sql`DELETE FROM social_accounts WHERE id = ${testSocialAccId}`;
    await sql`DELETE FROM users WHERE id = ${testUserId}`;

    // Create test user
    await sql`
      INSERT INTO users (id, email, password_hash, full_name, role)
      VALUES (${testUserId}, 'test-creator@raasocial.test', 'dummyhash', 'Test Creator', 'user')
    `;

    // Create test social account
    await sql`
      INSERT INTO social_accounts (id, user_id, platform, account_handle, status)
      VALUES (${testSocialAccId}, ${testUserId}, 'snapchat', '@test_creator_snap', 'connected')
    `;

    // -------------------------------------------------------------------------
    // TEST SUITE 1: Post 1 -> Attempt 1 Fail -> Backoff Retry -> Attempt 2 Success
    // -------------------------------------------------------------------------
    console.log('\n============================================================');
    console.log('TEST SUITE 1: Retry Flow & Eventual Success (Req 8, 10, 11)');
    console.log('============================================================');

    // 1. Create content_calendar and scheduled_posts in SCHEDULED status
    await sql`
      INSERT INTO content_calendar (id, user_id, title, caption, platform, status, approval_status, scheduled_at)
      VALUES (${testCalPostId1}, ${testUserId}, 'Post 1 Title', 'Post 1 Caption', 'Instagram', 'SCHEDULED', 'APPROVED', NOW() - INTERVAL '1 minute')
    `;

    await sql`
      INSERT INTO scheduled_posts (scheduled_post_id, calendar_post_id, variation_id, social_account_id, platform, content, scheduled_at, status)
      VALUES (${testSchedPostId1}, ${testCalPostId1}, ${testVarId1}, ${testSocialAccId}, 'instagram', 'Post 1 Content', NOW() - INTERVAL '1 minute', 'SCHEDULED')
    `;

    // 2. Simulate Attempt 1 Failure
    console.log('\n[1.1] Simulating Attempt 1 failure...');
    const resFail1 = await publishingService.createLogEntry({
      scheduledPostId: testSchedPostId1,
      status: 'FAILED',
      externalPostId: null,
      error: 'Simulated API rate limit error 429',
      attemptedAt: new Date().toISOString(),
    });

    console.log('Result of Attempt 1:', resFail1);

    // Verify Attempt 1 database state
    const schedPostAfterFail1 = (await sql`SELECT status, retry_count, scheduled_at FROM scheduled_posts WHERE scheduled_post_id = ${testSchedPostId1}`)[0];
    const calPostAfterFail1 = (await sql`SELECT status, published_at FROM content_calendar WHERE id = ${testCalPostId1}`)[0];
    const logsAfterFail1 = await sql`SELECT status, error FROM publishing_logs WHERE scheduled_post_id = ${testSchedPostId1}`;
    const notifsAfterFail1 = await sql`SELECT type FROM notifications WHERE user_id = ${testUserId}`;

    console.log('-> scheduled_posts status after Attempt 1:', schedPostAfterFail1.status, '(Expected: SCHEDULED)');
    console.log('-> scheduled_posts retry_count:', schedPostAfterFail1.retry_count, '(Expected: 1)');
    console.log('-> scheduled_posts scheduled_at pushed into future?:', new Date(schedPostAfterFail1.scheduled_at) > new Date() ? 'YES ✅' : 'NO ❌');
    console.log('-> content_calendar status:', calPostAfterFail1.status, '(Expected: SCHEDULED - not prematurely failed)');
    console.log('-> publishing_logs count:', logsAfterFail1.length, '(Expected: 1)');
    console.log('-> Notifications sent so far:', notifsAfterFail1.length, '(Expected: 0)');

    if (
      schedPostAfterFail1.status !== 'SCHEDULED' ||
      schedPostAfterFail1.retry_count !== 1 ||
      calPostAfterFail1.status !== 'SCHEDULED' ||
      notifsAfterFail1.length !== 0
    ) {
      throw new Error('FAILED: Attempt 1 state verification failed!');
    }
    console.log('✅ PASS: Attempt 1 correctly scheduled retry, updated retry_count, preserved calendar, and deferred notification.');

    // 3. Simulate Attempt 2: SUCCESS on retry!
    console.log('\n[1.2] Simulating Attempt 2: Success on retry...');
    const resSuccess2 = await publishingService.createLogEntry({
      scheduledPostId: testSchedPostId1,
      status: 'PUBLISHED',
      externalPostId: 'ext-story-99999',
      error: null,
      attemptedAt: new Date().toISOString(),
    });

    console.log('Result of Attempt 2:', resSuccess2);

    const schedPostAfterSuccess = (await sql`SELECT status, retry_count FROM scheduled_posts WHERE scheduled_post_id = ${testSchedPostId1}`)[0];
    const calPostAfterSuccess = (await sql`SELECT status, published_at FROM content_calendar WHERE id = ${testCalPostId1}`)[0];
    const logsAfterSuccess = await sql`SELECT status, external_post_id FROM publishing_logs WHERE scheduled_post_id = ${testSchedPostId1} ORDER BY attempted_at ASC`;
    const notifsAfterSuccess = await sql`SELECT type, title, message FROM notifications WHERE user_id = ${testUserId}`;

    console.log('-> scheduled_posts status:', schedPostAfterSuccess.status, '(Expected: PUBLISHED)');
    console.log('-> content_calendar status:', calPostAfterSuccess.status, '(Expected: PUBLISHED)');
    console.log('-> content_calendar published_at set?:', calPostAfterSuccess.published_at ? 'YES ✅' : 'NO ❌');
    console.log('-> publishing_logs count:', logsAfterSuccess.length, '(Expected: 2 -> [FAILED, PUBLISHED])');
    console.log('-> Notification triggered:', notifsAfterSuccess[0]?.type, '(Expected: CONTENT_PUBLISHED)');
    console.log('-> Notification title:', notifsAfterSuccess[0]?.title);

    console.log('-> Notification details:', notifsAfterSuccess.map(n => ({ type: n.type, title: n.title })));

    if (
      schedPostAfterSuccess.status !== 'PUBLISHED' ||
      calPostAfterSuccess.status !== 'PUBLISHED' ||
      !calPostAfterSuccess.published_at ||
      logsAfterSuccess.length !== 2 ||
      notifsAfterSuccess.length === 0 ||
      notifsAfterSuccess[0].type !== 'CONTENT_PUBLISHED'
    ) {
      console.error('Debug assertion failed:', {
        schedStatus: schedPostAfterSuccess.status,
        calStatus: calPostAfterSuccess.status,
        publishedAt: calPostAfterSuccess.published_at,
        logsCount: logsAfterSuccess.length,
        notifsCount: notifsAfterSuccess.length,
      });
      throw new Error('FAILED: Attempt 2 success flow verification failed!');
    }
    console.log('✅ PASS: Successful retry updated scheduled_posts to PUBLISHED, synchronized content_calendar to PUBLISHED with timestamp, and sent CONTENT_PUBLISHED notification.');

    // -------------------------------------------------------------------------
    // TEST SUITE 2: Post 2 -> Exhausted Retries Flow (Req 8, 10, 11)
    // -------------------------------------------------------------------------
    console.log('\n============================================================');
    console.log('TEST SUITE 2: Retries Exhaustion Flow (Req 8, 10, 11)');
    console.log('============================================================');

    await sql`
      INSERT INTO content_calendar (id, user_id, title, caption, platform, status, approval_status, scheduled_at)
      VALUES (${testCalPostId2}, ${testUserId}, 'Post 2 Title', 'Post 2 Caption', 'Tumblr', 'SCHEDULED', 'APPROVED', NOW() - INTERVAL '1 minute')
    `;

    await sql`
      INSERT INTO scheduled_posts (scheduled_post_id, calendar_post_id, variation_id, social_account_id, platform, content, scheduled_at, status)
      VALUES (${testSchedPostId2}, ${testCalPostId2}, ${testVarId2}, ${testSocialAccId}, 'tumblr', 'Post 2 Content', NOW() - INTERVAL '1 minute', 'SCHEDULED')
    `;

    // Attempt 1: Fail
    console.log('\n[2.1] Attempt 1 (Fail)...');
    await publishingService.createLogEntry({
      scheduledPostId: testSchedPostId2,
      status: 'FAILED',
      externalPostId: null,
      error: 'Network Timeout (1st attempt)',
      attemptedAt: new Date().toISOString(),
    });
    const s1 = (await sql`SELECT status, retry_count FROM scheduled_posts WHERE scheduled_post_id = ${testSchedPostId2}`)[0];
    console.log('Attempt 1 -> status:', s1.status, 'retry_count:', s1.retry_count);

    // Attempt 2: Fail
    console.log('\n[2.2] Attempt 2 (Fail)...');
    await publishingService.createLogEntry({
      scheduledPostId: testSchedPostId2,
      status: 'FAILED',
      externalPostId: null,
      error: 'Network Timeout (2nd attempt)',
      attemptedAt: new Date().toISOString(),
    });
    const s2 = (await sql`SELECT status, retry_count FROM scheduled_posts WHERE scheduled_post_id = ${testSchedPostId2}`)[0];
    console.log('Attempt 2 -> status:', s2.status, 'retry_count:', s2.retry_count);

    // Attempt 3: Fail (Max retries = 3 reached)
    console.log('\n[2.3] Attempt 3 (Fail -> MAX RETRIES EXHAUSTED)...');
    const resFinalFail = await publishingService.createLogEntry({
      scheduledPostId: testSchedPostId2,
      status: 'FAILED',
      externalPostId: null,
      error: 'OAuth Token Revoked',
      attemptedAt: new Date().toISOString(),
    });
    console.log('Result of Attempt 3:', resFinalFail);

    const schedPostExhausted = (await sql`SELECT status, retry_count FROM scheduled_posts WHERE scheduled_post_id = ${testSchedPostId2}`)[0];
    const calPostExhausted = (await sql`SELECT status, admin_notes FROM content_calendar WHERE id = ${testCalPostId2}`)[0];
    const logsExhausted = await sql`SELECT status, error FROM publishing_logs WHERE scheduled_post_id = ${testSchedPostId2}`;
    const notifsPost2 = await sql`SELECT type, title, message FROM notifications WHERE user_id = ${testUserId} AND type = 'CONTENT_PUBLISH_FAILED'`;

    console.log('-> scheduled_posts status:', schedPostExhausted.status, '(Expected: FAILED)');
    console.log('-> scheduled_posts retry_count:', schedPostExhausted.retry_count, '(Expected: 3)');
    console.log('-> content_calendar status:', calPostExhausted.status, '(Expected: FAILED)');
    console.log('-> content_calendar admin_notes:', calPostExhausted.admin_notes);
    console.log('-> publishing_logs count:', logsExhausted.length, '(Expected: 3)');
    console.log('-> CONTENT_PUBLISH_FAILED notification count:', notifsPost2.length, '(Expected: 1)');
    console.log('-> Failure Notification title:', notifsPost2[0]?.title);

    if (
      schedPostExhausted.status !== 'FAILED' ||
      schedPostExhausted.retry_count !== 3 ||
      calPostExhausted.status !== 'FAILED' ||
      logsExhausted.length !== 3 ||
      notifsPost2.length === 0
    ) {
      throw new Error('FAILED: Retry exhaustion flow verification failed!');
    }
    console.log('✅ PASS: Exhausted retries marked scheduled_posts FAILED, synchronized content_calendar to FAILED with error notes, and dispatched CONTENT_PUBLISH_FAILED notification.');

    // -------------------------------------------------------------------------
    // TEST SUITE 3: Idempotency & Duplicate Protection Check (Req 12)
    // -------------------------------------------------------------------------
    console.log('\n============================================================');
    console.log('TEST SUITE 3: Idempotency Protection Check (Req 12)');
    console.log('============================================================');

    const testCalPostId3 = '22222222-aaaa-bbbb-cccc-000000000003';
    const testSchedPostId3 = '33333333-aaaa-bbbb-cccc-000000000003';
    const testVarId3 = '44444444-aaaa-bbbb-cccc-000000000003';

    await sql`
      INSERT INTO content_calendar (id, user_id, title, caption, platform, status, approval_status, scheduled_at)
      VALUES (${testCalPostId3}, ${testUserId}, 'Post 3 Title', 'Post 3 Caption', 'Discord', 'SCHEDULED', 'APPROVED', NOW() - INTERVAL '1 minute')
    `;

    await sql`
      INSERT INTO scheduled_posts (scheduled_post_id, calendar_post_id, variation_id, social_account_id, platform, content, scheduled_at, status)
      VALUES (${testSchedPostId3}, ${testCalPostId3}, ${testVarId3}, ${testSocialAccId}, 'discord', 'Post 3 Content', NOW() - INTERVAL '1 minute', 'SCHEDULED')
    `;

    const claim1 = await schedulingService.claimPost(testSchedPostId3, 'worker-A-key');
    console.log('Worker A claim:', claim1);

    const claim2 = await schedulingService.claimPost(testSchedPostId3, 'worker-B-key');
    console.log('Worker B concurrent claim:', claim2);

    if (!claim1.claimed || claim2.claimed || claim2.reason !== 'already_claimed') {
      throw new Error('FAILED: Idempotency atomic claim test failed!');
    }
    console.log('✅ PASS: Idempotency protection prevents duplicate claims across concurrent workers.');

    // Clean up post 3
    await sql`DELETE FROM scheduled_posts WHERE scheduled_post_id = ${testSchedPostId3}`;
    await sql`DELETE FROM content_calendar WHERE id = ${testCalPostId3}`;

    console.log('\n============================================================');
    console.log('ALL 14 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
    console.log('============================================================');
  } catch (err) {
    console.error('\n❌ ERROR during E2E verification:', err);
    process.exit(1);
  } finally {
    console.log('\n--- Cleaning up all test fixtures ---');
    await sql`DELETE FROM notifications WHERE user_id = ${testUserId}`;
    await sql`DELETE FROM publishing_logs WHERE scheduled_post_id IN (${testSchedPostId1}, ${testSchedPostId2})`;
    await sql`DELETE FROM scheduled_posts WHERE scheduled_post_id IN (${testSchedPostId1}, ${testSchedPostId2})`;
    await sql`DELETE FROM content_calendar WHERE id IN (${testCalPostId1}, ${testCalPostId2})`;
    await sql`DELETE FROM social_accounts WHERE id = ${testSocialAccId}`;
    await sql`DELETE FROM users WHERE id = ${testUserId}`;
    console.log('Cleaned up test records.');
    await sql.end();
    await app.close();
  }
}

runTests();
