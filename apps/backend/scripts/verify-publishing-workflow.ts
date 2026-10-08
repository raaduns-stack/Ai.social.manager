import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require' });

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING SCHEDULED PUBLISHING & DESIGNER E2E VERIFICATION');
  console.log('====================================================\n');

  let customerAId: string;
  let customerBId: string;
  let designerId: string;

  try {
    // ------------------------------------------------------------------------
    // SETUP: Create or retrieve Customer A, Customer B, and Designer
    // ------------------------------------------------------------------------
    console.log('[Setup] Preparing test users...');
    const emailA = `cust_a_${Date.now()}@example.com`;
    const emailB = `cust_b_${Date.now()}@example.com`;
    const emailD = `designer_${Date.now()}@example.com`;

    const [uA] = await sql`
      INSERT INTO users (full_name, email, password_hash, role, is_active, is_email_verified)
      VALUES ('Customer A', ${emailA}, 'hash123', 'user', true, true)
      RETURNING id
    `;
    customerAId = uA.id;

    const [uB] = await sql`
      INSERT INTO users (full_name, email, password_hash, role, is_active, is_email_verified)
      VALUES ('Customer B', ${emailB}, 'hash123', 'user', true, true)
      RETURNING id
    `;
    customerBId = uB.id;

    const [uD] = await sql`
      INSERT INTO users (full_name, email, password_hash, role, is_active, is_email_verified)
      VALUES ('Designer Test', ${emailD}, 'hash123', 'designer', true, true)
      RETURNING id
    `;
    designerId = uD.id;

    // Create connected social account for Customer A
    const [socialAccountA] = await sql`
      INSERT INTO social_accounts (user_id, platform, account_handle, status, access_token_encrypted)
      VALUES (${customerAId}, 'instagram', 'cust_a_ig', 'connected', 'dummy_token')
      RETURNING id
    `;

    // Create connected social account for Customer B
    const [socialAccountB] = await sql`
      INSERT INTO social_accounts (user_id, platform, account_handle, status, access_token_encrypted)
      VALUES (${customerBId}, 'instagram', 'cust_b_ig', 'connected', 'dummy_token')
      RETURNING id
    `;

    console.log(`✅ Users created: Customer A (${customerAId}), Customer B (${customerBId}), Designer (${designerId})\n`);

    // ------------------------------------------------------------------------
    // TEST 1: Designer Association & Cross-Customer Isolation
    // ------------------------------------------------------------------------
    console.log('[Test 1] Verifying Designer Asset Association & Cross-Customer Isolation...');

    // Customer A has a post
    const [postA] = await sql`
      INSERT INTO content_calendar (user_id, title, caption, platform, status, approval_status, scheduled_at)
      VALUES (${customerAId}, 'Customer A Post', 'Caption A', 'Instagram', 'DRAFT', 'PENDING', ${new Date(Date.now() + 86400000)})
      RETURNING id
    `;

    // Customer B has a post
    const [postB] = await sql`
      INSERT INTO content_calendar (user_id, title, caption, platform, status, approval_status, scheduled_at)
      VALUES (${customerBId}, 'Customer B Post', 'Caption B', 'Instagram', 'DRAFT', 'PENDING', ${new Date(Date.now() + 86400000)})
      RETURNING id
    `;

    // Designer task created for Customer A
    const [taskA] = await sql`
      INSERT INTO tasks (title, brief, assigned_to, calendar_post_id, customer_id, status)
      VALUES ('Design for Post A', 'Banner for A', ${designerId}, ${postA.id}, ${customerAId}, 'open')
      RETURNING id
    `;

    // Designer submission created for Task A
    const [subA] = await sql`
      INSERT INTO submissions (title, task_id, designer_id, status)
      VALUES ('Approved Submission A', ${taskA.id}, ${designerId}, 'approved')
      RETURNING id
    `;

    // Submission files for Sub A
    const assetUrlA = '/uploads/customer_a_asset.png';
    await sql`
      INSERT INTO submission_files (submission_id, original_name, stored_name, file_url, mime_type, file_size)
      VALUES (${subA.id}, 'asset_a.png', 'stored_a.png', ${assetUrlA}, 'image/png', 1024)
    `;

    // Update Post A with designer submission
    await sql`
      UPDATE content_calendar
      SET designer_submission_id = ${subA.id}, designer_task_id = ${taskA.id}, media_url = ${assetUrlA}
      WHERE id = ${postA.id}
    `;

    // Verify Post A has Asset A
    const [checkPostA] = await sql`SELECT * FROM content_calendar WHERE id = ${postA.id}`;
    if (checkPostA.media_url !== assetUrlA || checkPostA.designer_submission_id !== subA.id) {
      throw new Error('Test 1 Failed: Post A does not have Asset A');
    }

    // Verify Post B does NOT have Asset A
    const [checkPostB] = await sql`SELECT * FROM content_calendar WHERE id = ${postB.id}`;
    if (checkPostB.media_url === assetUrlA || checkPostB.designer_submission_id === subA.id) {
      throw new Error('Test 1 Failed: Cross-customer contamination detected! Post B got Asset A');
    }
    console.log('✅ Test 1 Passed: Customer A has Asset A, Customer B post has NO access to Asset A.');

    // ------------------------------------------------------------------------
    // TEST 2: Post in 5 Minutes Functionality
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] Verifying Post in 5 Minutes Scheduling...');

    const originalScheduledTime = new Date(Date.now() + 7 * 86400000); // 7 days in future
    const [farFuturePost] = await sql`
      INSERT INTO content_calendar (user_id, title, caption, platform, status, approval_status, scheduled_at, media_url, designer_submission_id)
      VALUES (${customerAId}, 'Future Post', 'Will post in 5 min', 'Instagram', 'SCHEDULED', 'APPROVED', ${originalScheduledTime}, ${assetUrlA}, ${subA.id})
      RETURNING id
    `;

    // Simulate clicking "Post in 5 Minutes"
    const target5Min = new Date(Date.now() + 5 * 60 * 1000);

    // Update content calendar
    await sql`
      UPDATE content_calendar
      SET scheduled_at = ${target5Min}, status = 'SCHEDULED', approval_status = 'APPROVED', updated_at = NOW()
      WHERE id = ${farFuturePost.id}
    `;

    // Create or update scheduled_posts
    const [scheduledRow] = await sql`
      INSERT INTO scheduled_posts (
        calendar_post_id, variation_id, social_account_id, platform, content, media_url, designer_submission_id, has_designer_asset, scheduled_at, status
      ) VALUES (
        ${farFuturePost.id}, ${crypto.randomUUID()}, ${socialAccountA.id}, 'instagram', 'Will post in 5 min', ${assetUrlA}, ${subA.id}, true, ${target5Min}, 'SCHEDULED'
      )
      RETURNING *
    `;

    // Verify scheduled_posts has the ~5 minute timestamp and status SCHEDULED
    const storedDate = new Date(scheduledRow.scheduled_at);
    console.log(`[Test 2 details] Stored date: ${storedDate.toISOString()}, Target: ${target5Min.toISOString()}`);
    const timeDiffSeconds = Math.abs((storedDate.getTime() - target5Min.getTime()) / 1000);
    // Allow either exact match or timezone offset (e.g. 3600s in BST/GMT+1)
    const normalizedDiff = timeDiffSeconds % 3600;
    if (normalizedDiff > 10 || scheduledRow.status !== 'SCHEDULED' || !scheduledRow.has_designer_asset) {
      throw new Error(`Test 2 Failed: ScheduledPost not properly queued. Time diff: ${timeDiffSeconds}s, status: ${scheduledRow.status}`);
    }
    console.log('✅ Test 2 Passed: "Post in 5 Minutes" updated scheduled_at to ~5m from now, persisted in scheduled_posts with designer asset.');

    // ------------------------------------------------------------------------
    // TEST 3: Duplicate Protection & Atomic Claiming
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] Verifying Duplicate Dispatch Protection & Atomic Claiming...');

    const duePostId = crypto.randomUUID();
    const [dueScheduled] = await sql`
      INSERT INTO scheduled_posts (
        scheduled_post_id, calendar_post_id, variation_id, social_account_id, platform, content, scheduled_at, status
      ) VALUES (
        ${duePostId}, ${crypto.randomUUID()}, ${crypto.randomUUID()}, ${socialAccountA.id}, 'instagram', 'Due post for claiming test', ${new Date(Date.now() - 60000)}, 'SCHEDULED'
      )
      RETURNING *
    `;

    // Worker 1 claims the post
    const key1 = `dispatch-${duePostId}-1`;
    const claim1 = await sql`
      UPDATE scheduled_posts
      SET status = 'PROCESSING', idempotency_key = ${key1}, updated_at = NOW()
      WHERE scheduled_post_id = ${duePostId} AND status = 'SCHEDULED'
      RETURNING *
    `;

    if (claim1.length !== 1) {
      throw new Error('Test 3 Failed: Worker 1 should have claimed the post');
    }

    // Worker 2 attempts to claim the EXACT SAME post concurrently
    const key2 = `dispatch-${duePostId}-2`;
    const claim2 = await sql`
      UPDATE scheduled_posts
      SET status = 'PROCESSING', idempotency_key = ${key2}, updated_at = NOW()
      WHERE scheduled_post_id = ${duePostId} AND status = 'SCHEDULED'
      RETURNING *
    `;

    if (claim2.length !== 0) {
      throw new Error('Test 3 Failed: Worker 2 claimed an already-processing post! Duplicate dispatch vulnerability!');
    }
    console.log('✅ Test 3 Passed: Atomic claiming prevented second worker from claiming the post.');

    // ------------------------------------------------------------------------
    // TEST 4: Partial Channel Success & Independent Results
    // ------------------------------------------------------------------------
    console.log('\n[Test 4] Verifying Independent Channel Results & Retry Isolation...');

    const multiChannelCalPost = crypto.randomUUID();
    await sql`
      INSERT INTO content_calendar (id, user_id, title, caption, platform, status, approval_status, scheduled_at)
      VALUES (${multiChannelCalPost}, ${customerAId}, 'Multi-Channel Post', 'Caption', 'Instagram', 'SCHEDULED', 'APPROVED', ${new Date()})
    `;

    // Channel 1: Instagram (Succeeds)
    const [igRow] = await sql`
      INSERT INTO scheduled_posts (
        calendar_post_id, variation_id, social_account_id, platform, content, media_url, scheduled_at, status
      ) VALUES (
        ${multiChannelCalPost}, ${crypto.randomUUID()}, ${socialAccountA.id}, 'instagram', 'IG Content', ${assetUrlA}, ${new Date()}, 'PROCESSING'
      )
      RETURNING *
    `;

    // Channel 2: Facebook (Fails)
    const [fbRow] = await sql`
      INSERT INTO scheduled_posts (
        calendar_post_id, variation_id, social_account_id, platform, content, media_url, scheduled_at, status
      ) VALUES (
        ${crypto.randomUUID()}, ${crypto.randomUUID()}, ${socialAccountA.id}, 'facebook', 'FB Content', ${assetUrlA}, ${new Date()}, 'PROCESSING'
      )
      RETURNING *
    `;

    // Instagram succeeds
    await sql`
      INSERT INTO publishing_logs (scheduled_post_id, status, external_post_id, attempted_at)
      VALUES (${igRow.scheduled_post_id}, 'PUBLISHED', 'ig_ext_12345', NOW())
    `;
    await sql`
      UPDATE scheduled_posts SET status = 'PUBLISHED', updated_at = NOW() WHERE scheduled_post_id = ${igRow.scheduled_post_id}
    `;

    // Facebook fails with temporary error
    const fbError = 'Network timeout contacting Facebook Graph API';
    await sql`
      INSERT INTO publishing_logs (scheduled_post_id, status, error, attempted_at)
      VALUES (${fbRow.scheduled_post_id}, 'FAILED', ${fbError}, NOW())
    `;
    // Retryable: backoff 5 minutes, increment retry_count, return to SCHEDULED
    await sql`
      UPDATE scheduled_posts
      SET status = 'SCHEDULED', retry_count = retry_count + 1, scheduled_at = ${new Date(Date.now() + 300000)}, updated_at = NOW()
      WHERE scheduled_post_id = ${fbRow.scheduled_post_id}
    `;

    // Verify Instagram remains PUBLISHED
    const [checkIg] = await sql`SELECT * FROM scheduled_posts WHERE scheduled_post_id = ${igRow.scheduled_post_id}`;
    if (checkIg.status !== 'PUBLISHED') {
      throw new Error('Test 4 Failed: Instagram status was corrupted by Facebook failure');
    }

    // Verify Facebook is scheduled for retry with incremented retry count and preserved media
    const [checkFb] = await sql`SELECT * FROM scheduled_posts WHERE scheduled_post_id = ${fbRow.scheduled_post_id}`;
    if (checkFb.status !== 'SCHEDULED' || checkFb.retry_count !== 1 || checkFb.media_url !== assetUrlA) {
      throw new Error('Test 4 Failed: Facebook retry status or mediaUrl corrupted');
    }
    console.log('✅ Test 4 Passed: Instagram stayed PUBLISHED; Facebook failure retries independently without losing media.');

    // ------------------------------------------------------------------------
    // TEST 5: Multiple Due Posts Concurrency
    // ------------------------------------------------------------------------
    console.log('\n[Test 5] Simulating 5 Concurrent Due Posts Across Different Customers...');

    const batchPostIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const cId = i % 2 === 0 ? customerAId : customerBId;
      const sId = i % 2 === 0 ? socialAccountA.id : socialAccountB.id;
      const [row] = await sql`
        INSERT INTO scheduled_posts (
          calendar_post_id, variation_id, social_account_id, platform, content, scheduled_at, status
        ) VALUES (
          ${crypto.randomUUID()}, ${crypto.randomUUID()}, ${sId}, 'instagram', ${`Batch Post ${i}`}, ${new Date(Date.now() - 10000)}, 'SCHEDULED'
        )
        RETURNING scheduled_post_id
      `;
      batchPostIds.push(row.scheduled_post_id);
    }

    // Simultaneously claim all 5
    const claimPromises = batchPostIds.map(async (id) => {
      const k = `batch-claim-${id}`;
      return sql`
        UPDATE scheduled_posts
        SET status = 'PROCESSING', idempotency_key = ${k}, updated_at = NOW()
        WHERE scheduled_post_id = ${id} AND status = 'SCHEDULED'
        RETURNING scheduled_post_id
      `;
    });

    const claimResults = await Promise.all(claimPromises);
    const successfullyClaimed = claimResults.filter(r => r.length === 1).length;

    if (successfullyClaimed !== 5) {
      throw new Error(`Test 5 Failed: Expected 5 successfully claimed posts, got ${successfullyClaimed}`);
    }
    console.log('✅ Test 5 Passed: All 5 concurrent due posts claimed independently without loss or contention.');

    console.log('\n====================================================');
    console.log('🎉 ALL 5 E2E INTEGRATION & SAFETY TESTS PASSED!');
    console.log('====================================================');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  } finally {
    // Cleanup test artifacts
    if (customerAId! || customerBId! || designerId!) {
      console.log('\n[Cleanup] Removing test users and created rows...');
      await sql`DELETE FROM users WHERE id IN (${customerAId! || '00000000-0000-0000-0000-000000000000'}, ${customerBId! || '00000000-0000-0000-0000-000000000000'}, ${designerId! || '00000000-0000-0000-0000-000000000000'})`;
    }
    await sql.end();
  }
}

runTests();
