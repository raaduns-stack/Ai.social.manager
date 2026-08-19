import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtOrN8nAuthGuard } from '../auth/guards/jwt-or-n8n-auth.guard';
import { N8nInternalAuthGuard } from '../auth/guards/n8n-internal-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('CalendarController', () => {
  let controller: CalendarController;
  let service: jest.Mocked<Partial<CalendarService>>;

  const mockPost = {
    id: '37a11f8f-9efc-4464-bd1c-b7cf6bd04b87',
    userId: '1854555a-8acc-47b0-8781-5f0917b504ee',
    title: 'Test Post Title',
    caption: 'Test Caption',
    platform: 'Instagram',
    scheduledAt: new Date(),
    status: 'SCHEDULED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    service = {
      findAllForUser: jest.fn().mockResolvedValue([mockPost]),
      findOneForUser: jest.fn().mockResolvedValue(mockPost),
      findOneById: jest.fn().mockResolvedValue(mockPost),
      getUsageForUser: jest.fn(),
      findUpcomingForUser: jest.fn(),
      findPublishedForUser: jest.fn(),
      createForUser: jest.fn(),
      updateForUser: jest.fn(),
      removeForUser: jest.fn(),
      listCustomers: jest.fn(),
      findAllForAdmin: jest.fn(),
      getApprovalOverview: jest.fn(),
      updateApproval: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: service,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'N8N_INTERNAL_API_KEY' || key === 'n8n.internalApiKey') {
                return 'super_secret_n8n_key_12345';
              }
              return null;
            }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtOrN8nAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(N8nInternalAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CalendarController>(CalendarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should call findOneForUser when user context is present from JWT', async () => {
      const result = await controller.findOne(
        mockPost.id,
        { userId: mockPost.userId },
        undefined,
      );

      expect(service.findOneForUser).toHaveBeenCalledWith(mockPost.id, mockPost.userId);
      expect(result).toEqual(mockPost);
    });

    it('should call findOneForUser when queryUserId is provided (n8n mode)', async () => {
      const result = await controller.findOne(
        mockPost.id,
        undefined,
        mockPost.userId,
      );

      expect(service.findOneForUser).toHaveBeenCalledWith(mockPost.id, mockPost.userId);
      expect(result).toEqual(mockPost);
    });

    it('should call findOneById when neither user JWT nor queryUserId is present', async () => {
      const result = await controller.findOne(
        mockPost.id,
        undefined,
        undefined,
      );

      expect(service.findOneById).toHaveBeenCalledWith(mockPost.id);
      expect(result).toEqual(mockPost);
    });
  });

  describe('findInternal', () => {
    it('should call findOneById for internal n8n request without userId', async () => {
      const result = await controller.findInternal(mockPost.id, undefined);

      expect(service.findOneById).toHaveBeenCalledWith(mockPost.id);
      expect(result).toEqual(mockPost);
    });

    it('should call findOneForUser for internal n8n request with userId', async () => {
      const result = await controller.findInternal(mockPost.id, mockPost.userId);

      expect(service.findOneForUser).toHaveBeenCalledWith(mockPost.id, mockPost.userId);
      expect(result).toEqual(mockPost);
    });
  });

  describe('findAll', () => {
    it('should return all posts for user', async () => {
      const result = await controller.findAll({ userId: mockPost.userId }, 'ALL');

      expect(service.findAllForUser).toHaveBeenCalledWith(mockPost.userId, 'ALL');
      expect(result).toEqual([mockPost]);
    });
  });
});
