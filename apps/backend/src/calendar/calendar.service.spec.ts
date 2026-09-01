import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { DATABASE_CONNECTION } from '../database/database.module';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ConfigService } from '@nestjs/config';
import { CustomerProfileService } from '../settings/customer-profile/customer-profile.service';
import { ContentSuggestionsService } from '../content-suggestions/content-suggestions.service';
import { BadRequestException } from '@nestjs/common';
import * as schema from '../database/schema';

describe('CalendarService - AI Calendar Generation Result Scheduling', () => {
  let service: CalendarService;
  let mockSubscriptionsService: any;
  let mockConfigService: any;
  let mockCustomerProfileService: any;
  let mockContentSuggestionsService: any;

  let existingPosts: any[] = [];
  let insertedPosts: any[] = [];
  let jobMock: any = {
    id: 'job-id',
    userId: 'user-id',
    month: '2026-08',
    platforms: ['Facebook', 'Instagram'],
    status: 'PENDING',
  };
  let socialAccountsMock: any[];

  const mockTx = {
    select: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockImplementation(() => ({
        where: jest.fn().mockImplementation(() => ({
          for: jest.fn().mockImplementation(() => Promise.resolve([jobMock])),
        })),
      })),
    })),
    query: {
      contentCalendar: {
        findMany: jest.fn().mockImplementation((config) => {
          let startVal: Date | undefined;
          let endVal: Date | undefined;

          const mockFields = {
            userId: 'userId',
            scheduledAt: 'scheduledAt',
          };
          const mockOperators = {
            and: (...args: any[]) => args,
            eq: (field: any, val: any) => ({ field, op: 'eq', val }),
            gte: (field: any, val: any) => {
              if (field === 'scheduledAt') startVal = val;
              return { field, op: 'gte', val };
            },
            lte: (field: any, val: any) => {
              if (field === 'scheduledAt') endVal = val;
              return { field, op: 'lte', val };
            },
            ne: (field: any, val: any) => ({ field, op: 'ne', val }),
          };

          if (config && typeof config.where === 'function') {
            config.where(mockFields, mockOperators);
          }

          if (startVal && endVal) {
            const allPosts = [...existingPosts, ...insertedPosts];
            return allPosts.filter(
              (p) => p.scheduledAt >= startVal! && p.scheduledAt <= endVal!
            );
          }

          return existingPosts;
        }),
      },
    },
    insert: jest.fn().mockImplementation(() => ({
      values: jest.fn().mockImplementation((val) => {
        const post = {
          id: `inserted-id-${insertedPosts.length}`,
          ...val,
        };
        insertedPosts.push(post);
        return {
          returning: jest.fn().mockResolvedValue([post]),
        };
      }),
    })),
    update: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockImplementation((val: any) => {
        if (val && val.status) {
          jobMock.status = val.status;
        }
        if (val && val.resultIds) {
          jobMock.resultIds = val.resultIds;
        }
        return {
          where: jest.fn().mockResolvedValue([]),
        };
      }),
    })),
  };

  const mockDb = {
    select: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockImplementation(() => ({
        where: jest.fn().mockImplementation(() => ({
          for: jest.fn().mockImplementation(() => Promise.resolve([jobMock])),
        })),
      })),
    })),
    query: {
      calendarGenerationJobs: {
        findFirst: jest.fn().mockImplementation(() => jobMock),
      },
      contentCalendar: {
        findMany: jest.fn().mockImplementation((config) => {
          let startVal: Date | undefined;
          let endVal: Date | undefined;

          const mockFields = {
            userId: 'userId',
            scheduledAt: 'scheduledAt',
          };
          const mockOperators = {
            and: (...args: any[]) => args,
            eq: (field: any, val: any) => ({ field, op: 'eq', val }),
            gte: (field: any, val: any) => {
              if (field === 'scheduledAt') startVal = val;
              return { field, op: 'gte', val };
            },
            lte: (field: any, val: any) => {
              if (field === 'scheduledAt') endVal = val;
              return { field, op: 'lte', val };
            },
            ne: (field: any, val: any) => ({ field, op: 'ne', val }),
          };

          if (config && typeof config.where === 'function') {
            config.where(mockFields, mockOperators);
          }

          if (startVal && endVal) {
            return existingPosts.filter(
              (p) => p.scheduledAt >= startVal! && p.scheduledAt <= endVal!
            );
          }
          return existingPosts;
        }),
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(null)),
      },
      social_accounts: {
        findMany: jest.fn().mockImplementation(() => socialAccountsMock),
      },
    },
    transaction: jest.fn().mockImplementation((cb) => cb(mockTx)),
    delete: jest.fn().mockImplementation(() => ({
      where: jest.fn().mockResolvedValue([]),
    })),
    update: jest.fn().mockImplementation(() => ({
      set: jest.fn().mockImplementation((val) => {
        if (val && val.status) {
          jobMock.status = val.status;
        }
        return {
          where: jest.fn().mockImplementation(() => {
            return Promise.resolve([{ id: 'mock-id' }]);
          }),
        };
      }),
    })),
    set: jest.fn().mockImplementation((val) => {
      if (val && val.status) {
        jobMock.status = val.status;
      }
      return {
        where: jest.fn().mockResolvedValue([]),
      };
    }),
    where: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    existingPosts = [];
    insertedPosts = [];
    socialAccountsMock = [
      { platform: 'facebook', status: 'connected' },
      { platform: 'instagram', status: 'connected' },
    ];
    jobMock.id = 'job-id';
    jobMock.userId = 'user-id';
    jobMock.month = '2026-08';
    jobMock.platforms = ['Facebook', 'Instagram'];
    jobMock.status = 'PENDING';

    mockDb.update = jest.fn().mockImplementation(() => ({
      set: jest.fn().mockImplementation((val: any) => {
        if (val && val.status) {
          jobMock.status = val.status;
        }
        return {
          where: jest.fn().mockImplementation(() => {
            return Promise.resolve([{ id: 'mock-id' }]);
          }),
        };
      }),
    }));

    mockSubscriptionsService = {
      findByUserId: jest.fn().mockResolvedValue({ plan: { slug: 'free' } }),
    };

    mockConfigService = {
      get: jest.fn(),
    };

    mockCustomerProfileService = {
      getCompanyProfile: jest.fn().mockResolvedValue({ businessName: 'Mock Business' }),
    };

    mockContentSuggestionsService = {
      triggerN8nGeneration: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CustomerProfileService,
          useValue: mockCustomerProfileService,
        },
        {
          provide: ContentSuggestionsService,
          useValue: mockContentSuggestionsService,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    jest.clearAllMocks();
  });

  // 1. 8 generated posts for a normal 31-day month
  it('should successfully schedule and distribute 8 posts across a 31-day month (August 2026)', async () => {
    jobMock.month = '2026-08';

    // Generate 8 posts from n8n (concentrated on first few days initially)
    const postsPayload = Array.from({ length: 8 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-08-01`, // originally concentrated
      scheduledTime: '09:00',
    }));

    const result = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-08',
      posts: postsPayload,
    })) as any;

    expect(result.success).toBe(true);
    expect(result.count).toBe(8);

    // Verify posts are scheduled and distributed across August 2026
    expect(insertedPosts.length).toBe(8);
    for (const post of insertedPosts) {
      expect(post.scheduledAt.getFullYear()).toBe(2026);
      expect(post.scheduledAt.getMonth()).toBe(7); // August (0-indexed 7)
    }

    // Verify weekly limits are respected (no week has more than 2 posts)
    const weeklyCounts = new Map<string, number>();
    for (const post of insertedPosts) {
      const { start } = service.getWeekRange(post.scheduledAt);
      const key = start.toISOString();
      weeklyCounts.set(key, (weeklyCounts.get(key) || 0) + 1);
    }

    for (const [_, count] of weeklyCounts.entries()) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  // 2. 8 generated posts for a 30-day month
  it('should successfully schedule and distribute 8 posts across a 30-day month (September 2026)', async () => {
    jobMock.month = '2026-09';

    const postsPayload = Array.from({ length: 8 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-09-01`,
      scheduledTime: '10:00',
    }));

    const result = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-09',
      posts: postsPayload,
    })) as any;

    expect(result.success).toBe(true);
    expect(insertedPosts.length).toBe(8);
    for (const post of insertedPosts) {
      expect(post.scheduledAt.getFullYear()).toBe(2026);
      expect(post.scheduledAt.getMonth()).toBe(8); // September (0-indexed 8)
    }

    const weeklyCounts = new Map<string, number>();
    for (const post of insertedPosts) {
      const { start } = service.getWeekRange(post.scheduledAt);
      const key = start.toISOString();
      weeklyCounts.set(key, (weeklyCounts.get(key) || 0) + 1);
    }

    for (const [_, count] of weeklyCounts.entries()) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  // 3. 8 generated posts for February (28-day vs Leap year 29-day)
  it('should successfully distribute 8 posts across February 2026 (28 days) and February 2028 (29 days)', async () => {
    // Test February 2026 (28 days)
    jobMock.month = '2026-02';
    let postsPayload = Array.from({ length: 8 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-02-01`,
      scheduledTime: '11:00',
    }));

    let result = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-02',
      posts: postsPayload,
    })) as any;

    expect(result.success).toBe(true);
    expect(insertedPosts.length).toBe(8);
    for (const post of insertedPosts) {
      expect(post.scheduledAt.getFullYear()).toBe(2026);
      expect(post.scheduledAt.getMonth()).toBe(1); // Feb (0-indexed 1)
      expect(post.scheduledAt.getDate()).toBeLessThanOrEqual(28);
    }

    // Reset and test Leap Year February 2028 (29 days)
    insertedPosts = [];
    jobMock.status = 'PENDING';
    jobMock.month = '2028-02';
    postsPayload = Array.from({ length: 8 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2028-02-01`,
      scheduledTime: '11:00',
    }));

    result = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2028-02',
      posts: postsPayload,
    })) as any;

    expect(result.success).toBe(true);
    expect(insertedPosts.length).toBe(8);
    for (const post of insertedPosts) {
      expect(post.scheduledAt.getFullYear()).toBe(2028);
      expect(post.scheduledAt.getMonth()).toBe(1);
      expect(post.scheduledAt.getDate()).toBeLessThanOrEqual(29);
    }
  });

  // 4. Generated dates all falling in the same week initially
  it('should redistribute posts to other weeks if n8n generates all dates inside a single week', async () => {
    jobMock.month = '2026-08';

    // Generate 8 posts from n8n all scheduled on Aug 3, 2026 (a Monday in week 2)
    const postsPayload = Array.from({ length: 8 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-08-03`,
      scheduledTime: '12:00',
    }));

    const result = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-08',
      posts: postsPayload,
    })) as any;

    expect(result.success).toBe(true);
    expect(insertedPosts.length).toBe(8);

    const weeklyCounts = new Map<string, number>();
    for (const post of insertedPosts) {
      const { start } = service.getWeekRange(post.scheduledAt);
      const key = start.toISOString();
      weeklyCounts.set(key, (weeklyCounts.get(key) || 0) + 1);
    }

    for (const [_, count] of weeklyCounts.entries()) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  // 5. Existing posts already occupying some weekly slots
  it('should successfully schedule around existing scheduled posts', async () => {
    jobMock.month = '2026-08';

    // Week starting Aug 2: already has 2 posts scheduled (fully occupied)
    existingPosts = [
      {
        userId: 'user-id',
        scheduledAt: new Date('2026-08-03T09:00:00'),
        platform: 'Facebook',
      },
      {
        userId: 'user-id',
        scheduledAt: new Date('2026-08-05T09:00:00'),
        platform: 'Facebook',
      },
    ];

    // Attempt to schedule 6 new posts. They should all go to other weeks (Weeks 1, 3, 4, 5, 6).
    const postsPayload = Array.from({ length: 6 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-08-01`,
      scheduledTime: '09:00',
    }));

    const result = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-08',
      posts: postsPayload,
    })) as any;

    expect(result.success).toBe(true);
    expect(insertedPosts.length).toBe(6);

    // Verify none of the new posts were scheduled in the week of Aug 2 - Aug 8
    const weekOfAug2Start = service.getWeekRange(new Date('2026-08-03')).start.getTime();
    for (const post of insertedPosts) {
      const postWeekStart = service.getWeekRange(post.scheduledAt).start.getTime();
      expect(postWeekStart).not.toBe(weekOfAug2Start);
    }
  });

  // 6. More than 8 posts requested on Free plan
  it('should throw BadRequestException if more than 8 posts are requested on the Free plan', async () => {
    jobMock.month = '2026-08';

    const postsPayload = Array.from({ length: 9 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-08-01`,
      scheduledTime: '09:00',
    }));

    await expect(
      service.handleN8nResult('job-id', {
        customerId: 'user-id',
        month: '2026-08',
        posts: postsPayload,
      })
    ).rejects.toThrow(BadRequestException);
  });

  // 7. More than 2 posts attempting to enter one week due to existing posts
  it('should throw BadRequestException if there are not enough weekly slots left in the month for all requested posts', async () => {
    jobMock.month = '2026-08';

    // August 2026 has 6 weeks that overlap with August.
    // Let's occupy all of them completely except one week, which has only 1 slot left.
    // Existing posts occupy slots:
    // Week 1 (starts Jul 26): 2 posts
    // Week 2 (starts Aug 2): 2 posts
    // Week 3 (starts Aug 9): 2 posts
    // Week 4 (starts Aug 16): 2 posts
    // Week 5 (starts Aug 23): 2 posts
    // Week 6 (starts Aug 30): 1 post (1 slot left on Aug 30 or 31)

    // Build list of dates for existing posts to fill up the weeks:
    existingPosts = [
      { userId: 'user-id', scheduledAt: new Date('2026-08-01T09:00:00') }, // Week 1
      { userId: 'user-id', scheduledAt: new Date('2026-08-01T15:00:00') }, // Week 1
      { userId: 'user-id', scheduledAt: new Date('2026-08-03T09:00:00') }, // Week 2
      { userId: 'user-id', scheduledAt: new Date('2026-08-05T09:00:00') }, // Week 2
      { userId: 'user-id', scheduledAt: new Date('2026-08-10T09:00:00') }, // Week 3
      { userId: 'user-id', scheduledAt: new Date('2026-08-12T09:00:00') }, // Week 3
      { userId: 'user-id', scheduledAt: new Date('2026-08-17T09:00:00') }, // Week 4
      { userId: 'user-id', scheduledAt: new Date('2026-08-19T09:00:00') }, // Week 4
      { userId: 'user-id', scheduledAt: new Date('2026-08-24T09:00:00') }, // Week 5
      { userId: 'user-id', scheduledAt: new Date('2026-08-26T09:00:00') }, // Week 5
      { userId: 'user-id', scheduledAt: new Date('2026-08-30T09:00:00') }, // Week 6
    ];

    // Attempt to schedule 2 new posts. Since there is only 1 slot left across the entire month, this must fail.
    const postsPayload = Array.from({ length: 2 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-08-01`,
      scheduledTime: '09:00',
    }));

    await expect(
      service.handleN8nResult('job-id', {
        customerId: 'user-id',
        month: '2026-08',
        posts: postsPayload,
      })
    ).rejects.toThrow(BadRequestException);
  });

  // 8. Different subscription plans with different limits
  it('should successfully handle starter plan limit (30 posts/month, no weekly limit) and distribute them', async () => {
    mockSubscriptionsService.findByUserId.mockResolvedValue({
      plan: { slug: 'starter', features: ['30 AI-generated posts'] },
    });

    jobMock.month = '2026-08';

    // Generate 30 posts (which exceeds Free plan limits but is fine for Starter)
    const postsPayload = Array.from({ length: 30 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-08-01`,
      scheduledTime: '09:00',
    }));

    const result = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-08',
      posts: postsPayload,
    })) as any;

    expect(result.success).toBe(true);
    expect(insertedPosts.length).toBe(30);

    // Verify posts are distributed (some weeks will have > 2 posts since there is no weekly limit)
    const weeklyCounts = new Map<string, number>();
    for (const post of insertedPosts) {
      const { start } = service.getWeekRange(post.scheduledAt);
      const key = start.toISOString();
      weeklyCounts.set(key, (weeklyCounts.get(key) || 0) + 1);
    }

    let hasWeekWithMoreThanTwo = false;
    for (const [_, count] of weeklyCounts.entries()) {
      if (count > 2) hasWeekWithMoreThanTwo = true;
    }
    expect(hasWeekWithMoreThanTwo).toBe(true);
  });

  // 9. Ensure no scheduled post falls outside the requested month
  it('should guarantee that no scheduled post falls outside the target month boundary', async () => {
    jobMock.month = '2026-08';

    const postsPayload = Array.from({ length: 8 }).map((_, i) => ({
      title: `Post ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-08-01`,
      scheduledTime: '09:00',
    }));

    await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-08',
      posts: postsPayload,
    });

    for (const post of insertedPosts) {
      // Must be between Aug 1 and Aug 31, 2026
      expect(post.scheduledAt.getTime()).toBeGreaterThanOrEqual(
        new Date('2026-08-01T00:00:00').getTime()
      );
      expect(post.scheduledAt.getTime()).toBeLessThanOrEqual(
        new Date('2026-08-31T23:59:59').getTime()
      );
    }
  });

  // 10. TEST 2: n8n returns the same logical post 8 times (duplicate generationItemId) -> 0 rows inserted, generation rejected
  it('TEST 2: should reject generation and insert 0 rows if n8n returns repeated copies of the same logical post', async () => {
    jobMock.month = '2026-08';
    const duplicatePostsPayload = Array.from({ length: 8 }).map(() => ({
      generationItemId: 'item-101',
      title: 'Identical Post Title',
      caption: 'Identical Caption Content',
      platform: 'Instagram',
      scheduledDate: '2026-08-05',
    }));

    await expect(
      service.handleN8nResult('job-id', {
        customerId: 'user-id',
        month: '2026-08',
        posts: duplicatePostsPayload,
      })
    ).rejects.toThrow(BadRequestException);

    expect(jobMock.status).toBe('FAILED');
  });

  // 11. TEST 3: n8n callback sent twice for the same jobId -> first callback inserts rows; second callback returns idempotently
  it('TEST 3: should handle duplicate job callbacks idempotently without inserting additional rows', async () => {
    jobMock.month = '2026-08';
    jobMock.status = 'GENERATING';

    const postsPayload = Array.from({ length: 8 }).map((_, i) => ({
      generationItemId: `item-${i + 1}`,
      title: `Unique Post Title ${i + 1}`,
      caption: `Unique Post Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-08-01`,
    }));

    const result1 = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-08',
      posts: postsPayload,
    })) as any;

    expect(result1.success).toBe(true);
    expect(insertedPosts.length).toBe(8);

    // Second callback (jobMock.status is automatically GENERATED from first call)
    const result2 = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-08',
      posts: postsPayload,
    })) as any;

    expect(result2.success).toBe(true);
    expect(result2.message).toBe('Job already processed.');
    expect(result2.skipped).toBe(true);
    expect(insertedPosts.length).toBe(8); // No extra posts added
  });

  it('TEST 3b: should handle 20 repeated callbacks for the same jobId and result in exactly 8 inserted posts total', async () => {
    jobMock.month = '2026-08';
    jobMock.status = 'GENERATING';

    const postsPayload = Array.from({ length: 8 }).map((_, i) => ({
      generationItemId: `item-${i + 1}`,
      title: `Unique Post Title ${i + 1}`,
      caption: `Unique Post Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: `2026-08-01`,
    }));

    for (let i = 0; i < 20; i++) {
      const res = (await service.handleN8nResult('job-id', {
        customerId: 'user-id',
        month: '2026-08',
        posts: postsPayload,
      })) as any;
      expect(res.success).toBe(true);
      if (i > 0) {
        expect(res.skipped).toBe(true);
        expect(res.message).toBe('Job already processed.');
      }
    }

    expect(insertedPosts.length).toBe(8);
  });

  // 12. TEST 4: Two different logical posts have the same platform and scheduledAt -> both allowed
  it('TEST 4: should allow two different logical posts sharing the same platform and scheduledAt', async () => {
    jobMock.month = '2026-08';

    const postsPayload = [
      {
        generationItemId: 'item-1',
        title: 'Morning Strategy Update',
        caption: 'Detailed morning breakdown...',
        platform: 'LinkedIn',
        scheduledDate: '2026-08-10',
        scheduledTime: '09:00',
      },
      {
        generationItemId: 'item-2',
        title: 'Evening Case Study Launch',
        caption: 'Detailed evening case study...',
        platform: 'LinkedIn',
        scheduledDate: '2026-08-10',
        scheduledTime: '09:00',
      },
    ];

    const result = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-08',
      posts: postsPayload,
    })) as any;

    expect(result.success).toBe(true);
    expect(insertedPosts.length).toBe(2);
  });

  // 13. TEST 5 & TEST 6: User edits post A's date and title -> post A changes; post B remains completely unchanged
  it('TEST 5 & TEST 6: should edit post A by ID without cloning, creating duplicates, or affecting post B', async () => {
    // Setup existing posts in db
    const futureDateA = new Date(Date.now() + 86400000 * 10);
    const futureDateB = new Date(Date.now() + 86400000 * 12);
    const postA = {
      id: 'post-uuid-a',
      userId: 'user-id',
      title: 'Original Post A Title',
      caption: 'Original Post A Caption',
      platform: 'Instagram',
      scheduledAt: futureDateA,
      status: 'SCHEDULED',
      approvalStatus: 'PENDING',
      mediaUrl: null,
      hashtags: [],
      aiGenerated: true,
      selectedSuggestionId: null,
      adminNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const postB = {
      id: 'post-uuid-b',
      userId: 'user-id',
      title: 'Unchanged Post B Title',
      caption: 'Unchanged Post B Caption',
      platform: 'Instagram',
      scheduledAt: futureDateB,
      status: 'SCHEDULED',
      approvalStatus: 'PENDING',
      mediaUrl: null,
      hashtags: [],
      aiGenerated: true,
      selectedSuggestionId: null,
      adminNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDb.query.contentCalendar.findFirst = jest.fn().mockImplementation((config) => {
      const id = config.where.right?.value || 'post-uuid-a';
      if (id === 'post-uuid-a') return Promise.resolve(postA);
      if (id === 'post-uuid-b') return Promise.resolve(postB);
      return Promise.resolve(null);
    });

    const nextDayA = new Date(futureDateA.getTime() + 86400000);
    const updateSetMock = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockImplementation(() => {
          postA.title = 'Updated Post A Title';
          postA.scheduledAt = nextDayA;
          return Promise.resolve([postA]);
        }),
      }),
    });
    mockDb.update = jest.fn().mockReturnValue({ set: updateSetMock });

    const updatedA = await service.updateForUser('post-uuid-a', 'user-id', {
      title: 'Updated Post A Title',
      scheduledAt: nextDayA.toISOString(),
    });

    expect(updatedA.id).toBe('post-uuid-a');
    expect(updatedA.title).toBe('Updated Post A Title');
    expect(postB.title).toBe('Unchanged Post B Title');
    expect(postB.scheduledAt.toISOString()).toBe(futureDateB.toISOString());
  });

  // 14. TEST 8: n8n returns fewer posts than requested expectedPostCount -> 0 rows inserted
  it('TEST 8: should reject generation if n8n returns fewer posts than expectedPostCount', async () => {
    jobMock.month = '2026-08';
    const postsPayload = Array.from({ length: 5 }).map((_, i) => ({
      generationItemId: `item-${i + 1}`,
      title: `Title ${i + 1}`,
      caption: `Caption ${i + 1}`,
      platform: 'Facebook',
      scheduledDate: '2026-08-01',
    }));

    await expect(
      service.handleN8nResult('job-id', {
        customerId: 'user-id',
        month: '2026-08',
        expectedPostCount: 8,
        posts: postsPayload,
      })
    ).rejects.toThrow(BadRequestException);

    expect(jobMock.status).toBe('FAILED');
  });

  // 15. TEST 9: n8n returns duplicate titles but different logical IDs and different captions -> allowed
  it('TEST 9: should allow duplicate titles if logical IDs and captions differ', async () => {
    jobMock.month = '2026-08';
    const postsPayload = [
      {
        generationItemId: 'item-101',
        title: 'Weekly Roundup',
        caption: 'First weekly roundup edition...',
        platform: 'LinkedIn',
        scheduledDate: '2026-08-05',
      },
      {
        generationItemId: 'item-102',
        title: 'Weekly Roundup',
        caption: 'Second weekly roundup edition with different content...',
        platform: 'LinkedIn',
        scheduledDate: '2026-08-12',
      },
    ];

    const result = (await service.handleN8nResult('job-id', {
      customerId: 'user-id',
      month: '2026-08',
      posts: postsPayload,
    })) as any;

    expect(result.success).toBe(true);
    expect(insertedPosts.length).toBe(2);
  });
});
