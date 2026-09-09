import { Test, TestingModule } from '@nestjs/testing';
import { AutoApprovePostsJob } from './auto-approve-posts.job';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { ContentSuggestionsService } from '../../content-suggestions/content-suggestions.service';

describe('AutoApprovePostsJob', () => {
  let job: AutoApprovePostsJob;
  let mockDb: any;
  let mockContentSuggestionsService: any;

  beforeEach(async () => {
    mockDb = {
      query: {
        systemSettings: {
          findFirst: jest.fn(),
        },
        contentCalendar: {
          findMany: jest.fn(),
        },
        contentSuggestions: {
          findMany: jest.fn(),
        },
      },
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnValue([]),
    };

    mockContentSuggestionsService = {
      approveVariation: jest.fn().mockResolvedValue({ id: 'scheduled-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoApprovePostsJob,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
        {
          provide: ContentSuggestionsService,
          useValue: mockContentSuggestionsService,
        },
      ],
    }).compile();

    job = module.get<AutoApprovePostsJob>(AutoApprovePostsJob);
  });

  it('should exit early when autoApproveEnabled is false', async () => {
    mockDb.query.systemSettings.findFirst.mockResolvedValue({
      autoApproveEnabled: false,
      autoApproveWindowHours: 24,
    });

    await job.handleCron();

    expect(mockDb.query.contentCalendar.findMany).not.toHaveBeenCalled();
    expect(mockContentSuggestionsService.approveVariation).not.toHaveBeenCalled();
  });

  it('should auto-approve candidate post within window using earliest suggestion and SYSTEM source', async () => {
    const scheduledDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h from now
    mockDb.query.systemSettings.findFirst.mockResolvedValue({
      autoApproveEnabled: true,
      autoApproveWindowHours: 24,
    });

    mockDb.query.contentCalendar.findMany.mockResolvedValue([
      {
        id: 'cal-post-1',
        title: 'Test Post',
        approvalStatus: 'PENDING',
        scheduledAt: scheduledDate,
      },
    ]);

    mockDb.select().from.mockResolvedValue([]); // No existing scheduled_posts

    mockDb.query.contentSuggestions.findMany.mockResolvedValue([
      {
        id: 'sug-1',
        postId: 'cal-post-1',
        title: 'Earliest Suggestion',
        approvalStatus: 'PENDING_APPROVAL',
        createdAt: new Date('2026-09-08T10:00:00Z'),
      },
      {
        id: 'sug-2',
        postId: 'cal-post-1',
        title: 'Later Suggestion',
        approvalStatus: 'PENDING_APPROVAL',
        createdAt: new Date('2026-09-08T11:00:00Z'),
      },
    ]);

    await job.handleCron();

    expect(mockContentSuggestionsService.approveVariation).toHaveBeenCalledWith(
      'sug-1',
      { scheduledFor: scheduledDate.toISOString() },
      'SYSTEM',
    );
  });

  it('should skip post and log warning if post has no pending AI suggestions', async () => {
    mockDb.query.systemSettings.findFirst.mockResolvedValue({
      autoApproveEnabled: true,
      autoApproveWindowHours: 24,
    });

    mockDb.query.contentCalendar.findMany.mockResolvedValue([
      {
        id: 'cal-post-no-sug',
        title: 'Post Without Suggestions',
        approvalStatus: 'PENDING',
        scheduledAt: new Date(),
      },
    ]);

    mockDb.select().from.mockResolvedValue([]);
    mockDb.query.contentSuggestions.findMany.mockResolvedValue([]); // Empty

    await job.handleCron();

    expect(mockContentSuggestionsService.approveVariation).not.toHaveBeenCalled();
  });

  it('should skip post if it already exists in scheduled_posts to prevent double processing', async () => {
    mockDb.query.systemSettings.findFirst.mockResolvedValue({
      autoApproveEnabled: true,
      autoApproveWindowHours: 24,
    });

    mockDb.query.contentCalendar.findMany.mockResolvedValue([
      {
        id: 'cal-post-already-scheduled',
        title: 'Already Scheduled Post',
        approvalStatus: 'PENDING',
        scheduledAt: new Date(),
      },
    ]);

    mockDb.select().from.mockResolvedValue([
      { calendarPostId: 'cal-post-already-scheduled' },
    ]);

    await job.handleCron();

    expect(mockDb.query.contentSuggestions.findMany).not.toHaveBeenCalled();
    expect(mockContentSuggestionsService.approveVariation).not.toHaveBeenCalled();
  });
});
