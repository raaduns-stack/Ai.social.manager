import { Test, TestingModule } from '@nestjs/testing';
import { DispatchDuePostsJob } from './dispatch-due-posts.job';
import { SchedulingService } from '../scheduling.service';
import { ConfigService } from '@nestjs/config';

describe('DispatchDuePostsJob', () => {
  let job: DispatchDuePostsJob;
  let mockSchedulingService: any;
  let mockConfigService: any;

  const mockWebhookUrl = 'https://n8n.raasocial.io/webhook/publishing/dispatch';

  const mockDuePost1 = {
    scheduledPostId: 'post-123',
    platform: 'Instagram',
    content: 'Hello World!',
    mediaUrl: 'https://media.url/image.jpg',
    socialAccountId: 'social-111',
    calendarPostId: 'cal-999',
    variationId: 'var-888',
    status: 'SCHEDULED',
  };

  const mockDuePost2 = {
    scheduledPostId: 'post-456',
    platform: 'LinkedIn',
    content: 'Professional update',
    mediaUrl: null,
    socialAccountId: 'social-222',
    calendarPostId: 'cal-777',
    variationId: 'var-666',
    status: 'SCHEDULED',
  };

  beforeAll(() => {
    global.fetch = jest.fn();
  });

  beforeEach(async () => {
    mockSchedulingService = {
      findDuePosts: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'n8n.publishingWebhookUrl') {
          return mockWebhookUrl;
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchDuePostsJob,
        {
          provide: SchedulingService,
          useValue: mockSchedulingService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    job = module.get<DispatchDuePostsJob>(DispatchDuePostsJob);
    
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(job).toBeDefined();
  });

  it('should skip dispatching if N8N_PUBLISHING_WEBHOOK_URL is not configured', async () => {
    mockConfigService.get.mockReturnValue(null);

    await job.handleCron();

    expect(mockSchedulingService.findDuePosts).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should query due posts and dispatch them to the configured webhook url', async () => {
    mockSchedulingService.findDuePosts.mockResolvedValue([mockDuePost1, mockDuePost2]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('OK'),
    });

    await job.handleCron();

    expect(mockSchedulingService.findDuePosts).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(2);

    // Assert first post payload
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      mockWebhookUrl,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledPostId: 'post-123',
          platform: 'Instagram',
          content: 'Hello World!',
          mediaUrl: 'https://media.url/image.jpg',
          socialAccountId: 'social-111',
          calendarPostId: 'cal-999',
          variationId: 'var-888',
        }),
      })
    );

    // Assert second post payload
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      mockWebhookUrl,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledPostId: 'post-456',
          platform: 'LinkedIn',
          content: 'Professional update',
          mediaUrl: null,
          socialAccountId: 'social-222',
          calendarPostId: 'cal-777',
          variationId: 'var-666',
        }),
      })
    );
  });

  it('should handle webhook errors gracefully and not stop dispatching other posts', async () => {
    mockSchedulingService.findDuePosts.mockResolvedValue([mockDuePost1, mockDuePost2]);
    
    // First call fails, second succeeds
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Error'),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('OK'),
      });

    await job.handleCron();

    expect(mockSchedulingService.findDuePosts).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
