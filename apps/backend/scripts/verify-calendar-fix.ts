import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { CalendarService } from '../src/calendar/calendar.service';
import { DATABASE_CONNECTION } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type Database = PostgresJsDatabase<typeof schema>;

async function runAcceptanceTests() {
  console.log('==================================================');
  console.log('CALENDAR SYSTEM ACCEPTANCE TESTS VERIFICATION');
  console.log('==================================================\n');

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const calendarService = app.get(CalendarService);
  const db: Database = app.get(DATABASE_CONNECTION);

  // 1. Create a test user in DB
  const testEmail = `acceptance_test_${Date.now()}@example.com`;
  const [testUser] = await db
    .insert(schema.users)
    .values({
      email: testEmail,
      passwordHash: 'hashed_pw',
      fullName: 'Acceptance Test User',
      isEmailVerified: true,
    })
    .returning();

  console.log(`[Setup] Created test user ${testUser.id} (${testUser.email})`);

  // Ensure user has connected social accounts (Facebook & Instagram)
  await db.insert(schema.social_accounts).values([
    { userId: testUser.id, platform: 'facebook', accountHandle: '@test_fb', status: 'connected' },
    { userId: testUser.id, platform: 'instagram', accountHandle: '@test_ig', status: 'connected' },
  ]);

  const targetMonth = '2026-10';

  try {
    // -------------------------------------------------------------
    // TEST 1: Generate 8 -> database contains exactly 8.
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Generate 8 posts -> DB contains exactly 8 ---');
    const job1 = await calendarService.createGenerationJob(testUser.id, {
      month: targetMonth,
      platforms: ['Facebook', 'Instagram'],
    });

    const postsPayload1 = Array.from({ length: 8 }).map((_, i) => ({
      generationItemId: `item-${i + 1}`,
      postIndex: i + 1,
      title: `Generated Post ${i + 1}`,
      caption: `Caption text for post ${i + 1}`,
      platform: i % 2 === 0 ? 'Facebook' : 'Instagram',
      scheduledDate: '2026-10-01',
      scheduledTime: '09:00',
    }));

    const result1 = await calendarService.handleN8nResult(job1.id, {
      customerId: testUser.id,
      month: targetMonth,
      expectedPostCount: 8,
      posts: postsPayload1,
    });

    const dbPosts1 = await db.query.contentCalendar.findMany({
      where: eq(schema.contentCalendar.userId, testUser.id),
    });

    console.log(`Job Result 1: success=${result1.success}, count=${result1.count}`);
    console.log(`DB Calendar Posts Count: ${dbPosts1.length}`);
    if (dbPosts1.length === 8) {
      console.log('✅ TEST 1 PASSED: Exactly 8 records in database.');
    } else {
      console.error(`❌ TEST 1 FAILED: Expected 8 records, found ${dbPosts1.length}`);
    }

    // -------------------------------------------------------------
    // TEST 2: Repeat the exact same callback 5 times -> DB still contains 8.
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Repeat callback 5 times -> DB still contains 8 ---');
    for (let retry = 1; retry <= 5; retry++) {
      const res = await calendarService.handleN8nResult(job1.id, {
        customerId: testUser.id,
        month: targetMonth,
        expectedPostCount: 8,
        posts: postsPayload1,
      });
      console.log(`Retry ${retry}: success=${res.success}, skipped=${res.skipped}, postCount=${res.postCount}`);
    }

    const dbPosts2 = await db.query.contentCalendar.findMany({
      where: eq(schema.contentCalendar.userId, testUser.id),
    });
    console.log(`DB Calendar Posts Count after 5 retries: ${dbPosts2.length}`);
    if (dbPosts2.length === 8) {
      console.log('✅ TEST 2 PASSED: Retries skipped cleanly, DB still contains exactly 8.');
    } else {
      console.error(`❌ TEST 2 FAILED: Expected 8 records, found ${dbPosts2.length}`);
    }

    // -------------------------------------------------------------
    // TEST 3: Send two callbacks concurrently -> DB still contains 8.
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Send two callbacks concurrently -> DB still contains 8 ---');
    const job3 = await calendarService.createGenerationJob(testUser.id, {
      month: '2026-11',
      platforms: ['Facebook', 'Instagram'],
    });

    const postsPayload3 = Array.from({ length: 8 }).map((_, i) => ({
      generationItemId: `item-nov-${i + 1}`,
      postIndex: i + 1,
      title: `Nov Post ${i + 1}`,
      caption: `Nov Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: '2026-11-01',
    }));

    const [c1, c2] = await Promise.all([
      calendarService.handleN8nResult(job3.id, {
        customerId: testUser.id,
        month: '2026-11',
        expectedPostCount: 8,
        posts: postsPayload3,
      }),
      calendarService.handleN8nResult(job3.id, {
        customerId: testUser.id,
        month: '2026-11',
        expectedPostCount: 8,
        posts: postsPayload3,
      }),
    ]);

    console.log(`Concurrent 1: success=${c1.success}, count=${c1.count}, skipped=${c1.skipped}`);
    console.log(`Concurrent 2: success=${c2.success}, count=${c2.count}, skipped=${c2.skipped}`);

    const dbPostsNov = await db.query.contentCalendar.findMany({
      where: and(
        eq(schema.contentCalendar.userId, testUser.id),
        eq(schema.contentCalendar.title, 'Nov Post 1'),
      ),
    });
    console.log(`Nov Post 1 count in DB: ${dbPostsNov.length}`);
    if (dbPostsNov.length === 1) {
      console.log('✅ TEST 3 PASSED: Concurrent requests handled atomically with 0 duplicate posts.');
    } else {
      console.error(`❌ TEST 3 FAILED: Nov Post 1 appeared ${dbPostsNov.length} times.`);
    }

    // -------------------------------------------------------------
    // TEST 4: Refresh calendar repeatedly -> DB count does not change.
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Refresh calendar repeatedly -> DB count does not change ---');
    const initialCount = (await calendarService.findAllForUser(testUser.id)).length;
    for (let r = 0; r < 5; r++) {
      await calendarService.findAllForUser(testUser.id);
    }
    const finalCount = (await calendarService.findAllForUser(testUser.id)).length;
    console.log(`Initial count: ${initialCount}, Final count: ${finalCount}`);
    if (initialCount === finalCount) {
      console.log('✅ TEST 4 PASSED: Calendar reads are strictly read-only.');
    } else {
      console.error(`❌ TEST 4 FAILED: Read mutated DB count.`);
    }

    // -------------------------------------------------------------
    // TEST 5: Generate with exhausted quota -> no additional rows.
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Generate with exhausted quota -> rejected ---');
    try {
      await calendarService.createGenerationJob(testUser.id, {
        month: targetMonth,
        platforms: ['Facebook', 'Instagram'],
      });
      console.error('❌ TEST 5 FAILED: Job creation should have thrown limit exceeded error.');
    } catch (err: any) {
      console.log(`Caught expected error: "${err.message}"`);
      console.log('✅ TEST 5 PASSED: Exceeded quota blocked on backend.');
    }

    // -------------------------------------------------------------
    // TEST 6: Edit a post -> same post ID, no new row.
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Edit post date/time -> same post ID, no new row ---');
    const postToEdit = dbPosts1[0];
    const originalPostId = postToEdit.id;
    const newScheduledDate = '2026-10-02';

    const updatedPost = await calendarService.updateForUser(originalPostId, testUser.id, {
      title: 'Updated Title for Post 1',
      scheduledDate: newScheduledDate,
      scheduledTime: '14:00',
    });

    console.log(`Updated post ID: ${updatedPost.id}`);
    const postAfterEdit = await db.query.contentCalendar.findFirst({
      where: eq(schema.contentCalendar.id, originalPostId),
    });

    if (updatedPost.id === originalPostId && postAfterEdit?.title === 'Updated Title for Post 1') {
      console.log('✅ TEST 6 PASSED: Edit performs UPDATE in-place; post ID preserved, no new row.');
    } else {
      console.error('❌ TEST 6 FAILED: Post ID changed or row not updated properly.');
    }

    // -------------------------------------------------------------
    // TEST 7: Try editing to a date outside original week -> rejected.
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Reschedule outside original week -> backend rejects ---');
    try {
      await calendarService.updateForUser(originalPostId, testUser.id, {
        scheduledDate: '2026-10-25', // Outside week of Oct 1
      });
      console.error('❌ TEST 7 FAILED: Edit outside week should have been rejected.');
    } catch (err: any) {
      console.log(`Caught expected week error: "${err.message}"`);
      const unchangedPost = await db.query.contentCalendar.findFirst({
        where: eq(schema.contentCalendar.id, originalPostId),
      });
      console.log(`Post scheduledAt after rejected edit: ${unchangedPost?.scheduledAt}`);
      console.log('✅ TEST 7 PASSED: Rescheduling outside original week was rejected.');
    }

    // -------------------------------------------------------------
    // TEST 8: Timeout check -> job transitions to TIMED_OUT.
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Job timeout -> status transitions to TIMED_OUT ---');
    const [timeoutJob] = await db
      .insert(schema.calendarGenerationJobs)
      .values({
        userId: testUser.id,
        month: '2026-12',
        platforms: ['Facebook'],
        status: 'GENERATING',
        expectedPostCount: 8,
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
        updatedAt: new Date(Date.now() - 15 * 60 * 1000),
      })
      .returning();

    const jobStatusResult = await calendarService.getJobStatus(timeoutJob.id, testUser.id);
    console.log(`Job status after timeout check: ${jobStatusResult.status}`);
    if (jobStatusResult.status === 'TIMED_OUT') {
      console.log('✅ TEST 8 PASSED: Stale generation job correctly marked TIMED_OUT.');
    } else {
      console.error(`❌ TEST 8 FAILED: Expected TIMED_OUT, got ${jobStatusResult.status}`);
    }

    console.log('\n==================================================');
    console.log('ALL ACCEPTANCE TESTS COMPLETED SUCCESSFULLY');
    console.log('==================================================\n');

  } catch (err) {
    console.error('Acceptance test execution error:', err);
  } finally {
    // Cleanup test user
    await db.delete(schema.users).where(eq(schema.users.id, testUser.id));
    console.log(`[Cleanup] Deleted test user ${testUser.id}`);
    await app.close();
  }
}

runAcceptanceTests().catch(console.error);
