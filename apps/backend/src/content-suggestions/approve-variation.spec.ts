import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ContentSuggestionsController } from './content-suggestions.controller';
import { ContentSuggestionsService } from './content-suggestions.service';
import { DATABASE_CONNECTION } from '../database/database.module';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as schema from '../database/schema';

describe('ContentSuggestionsController (e2e) - Approve Variation', () => {
  let app: INestApplication;
  
  // In-memory test stores
  let contentSuggestionsStore: any[] = [];
  let scheduledPostsStore: any[] = [];
  let socialAccountsStore: any[] = [];
  let contentCalendarStore: any[] = [];

  const mockVariationFixture = {
    id: '92b28e9f-d009-4891-aa67-bf631496bbcd',
    userId: '350ffd6f-f417-4034-ac31-7981296e2ac7',
    postId: '8a290b4f-2b00-4182-a6af-814bf001ed5d',
    title: 'Summer is in Full Swing!',
    type: 'caption',
    content: 'The summer season has officially begun! Follow us for updates on our summer projects, events, and more! #summervibes #TEEshub #SummerVibesOnly',
    hashtags: [],
    approvalStatus: 'PENDING_APPROVAL',
    revisionNotes: null,
    createdAt: new Date('2026-08-20T09:39:31.113Z'),
  };

  const mockCalendarPostFixture = {
    id: '8a290b4f-2b00-4182-a6af-814bf001ed5d',
    userId: '350ffd6f-f417-4034-ac31-7981296e2ac7',
    title: 'Parent Post',
    caption: 'Original post',
    platform: 'Instagram', // Maps to Instagram platform
    status: 'DRAFT',
    scheduledAt: new Date('2026-08-30T10:00:00.000Z'),
  };

  const mockSocialAccountFixture = {
    id: 'social-12345',
    userId: '350ffd6f-f417-4034-ac31-7981296e2ac7',
    platform: 'instagram', // Matches lowercased 'Instagram'
    accountHandle: '@summer_hub',
    status: 'connected',
  };

  beforeEach(async () => {
    // Reset stores
    contentSuggestionsStore = [{ ...mockVariationFixture }];
    scheduledPostsStore = [];
    socialAccountsStore = [{ ...mockSocialAccountFixture }];
    contentCalendarStore = [{ ...mockCalendarPostFixture }];

    const dbMock = {
      query: {
        contentSuggestions: {
          findFirst: jest.fn().mockImplementation((config) => {
            const whereVal = config?.where;
            if (typeof whereVal === 'function') {
              // Simulating basic equal checks for test query
              return Promise.resolve(contentSuggestionsStore[0] || null);
            }
            return Promise.resolve(contentSuggestionsStore[0] || null);
          }),
        },
        contentCalendar: {
          findFirst: jest.fn().mockImplementation(() => {
            return Promise.resolve(contentCalendarStore[0] || null);
          }),
        },
        social_accounts: {
          findFirst: jest.fn().mockImplementation((config) => {
            // Find matched account by userId and platform
            // In the code, the where clause uses:
            // eq(schema.social_accounts.userId, post.userId)
            // eq(schema.social_accounts.platform, normalizedPlatform)
            // We just return socialAccountsStore[0] if it exists
            return Promise.resolve(socialAccountsStore[0] || null);
          }),
        },
        scheduledPosts: {
          findFirst: jest.fn().mockImplementation((config) => {
            // Find matched scheduled post by variationId
            const match = scheduledPostsStore.find(x => x.variationId === mockVariationFixture.id);
            return Promise.resolve(match || null);
          }),
        },
      },
      insert: jest.fn().mockImplementation((table) => {
        return {
          values: jest.fn().mockImplementation((values) => {
            return {
              returning: jest.fn().mockImplementation(() => {
                // If it is a duplicate insert on variationId, reject it
                const duplicate = scheduledPostsStore.some(x => x.variationId === values.variationId);
                if (duplicate) {
                  const error = new Error('Unique constraint violation');
                  (error as any).code = '23505';
                  return Promise.reject(error);
                }
                const newRow = {
                  scheduledPostId: 'scheduled-post-999',
                  ...values,
                };
                scheduledPostsStore.push(newRow);
                return Promise.resolve([newRow]);
              }),
            };
          }),
        };
      }),
      update: jest.fn().mockImplementation((table) => {
        return {
          set: jest.fn().mockImplementation((setValues) => {
            return {
              where: jest.fn().mockImplementation(() => {
                if (table === schema.contentSuggestions && contentSuggestionsStore[0]) {
                  Object.assign(contentSuggestionsStore[0], setValues);
                }
                return Promise.resolve();
              }),
            };
          }),
        };
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContentSuggestionsController],
      providers: [
        ContentSuggestionsService,
        {
          provide: DATABASE_CONNECTION,
          useValue: dbMock,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. First call returns 201 and schedules the post successfully', async () => {
    const response = await request(app.getHttpServer())
      .post(`/content-suggestions/${mockVariationFixture.id}/approve`)
      .send({ scheduledFor: '2026-08-30T10:00:00.000Z' })
      .expect(201);

    expect(response.body).toBeDefined();
    expect(response.body.variationId).toBe(mockVariationFixture.id);
    expect(response.body.socialAccountId).toBe(mockSocialAccountFixture.id);
    expect(scheduledPostsStore.length).toBe(1);
    expect(contentSuggestionsStore[0].approvalStatus).toBe('APPROVED');
  });

  it('2. Second call is idempotent and does not create duplicate scheduled posts', async () => {
    // Perform first approval
    await request(app.getHttpServer())
      .post(`/content-suggestions/${mockVariationFixture.id}/approve`)
      .send({ scheduledFor: '2026-08-30T10:00:00.000Z' })
      .expect(201);

    expect(scheduledPostsStore.length).toBe(1);

    // Perform second approval (simulate re-approve)
    const response = await request(app.getHttpServer())
      .post(`/content-suggestions/${mockVariationFixture.id}/approve`)
      .send({ scheduledFor: '2026-08-30T10:00:00.000Z' })
      .expect(201);

    expect(response.body.variationId).toBe(mockVariationFixture.id);
    // Ensure store only has one record (no duplicate inserted)
    expect(scheduledPostsStore.length).toBe(1);
  });

  it('3. Calling approve when no matching social account exists returns 400', async () => {
    // Clear social account store to simulate no matched social accounts
    socialAccountsStore = [];

    const response = await request(app.getHttpServer())
      .post(`/content-suggestions/${mockVariationFixture.id}/approve`)
      .send({ scheduledFor: '2026-08-30T10:00:00.000Z' })
      .expect(400);

    expect(response.body.message).toContain('No connected social account found');
    expect(scheduledPostsStore.length).toBe(0);
  });
});
