import { Test, TestingModule } from '@nestjs/testing';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { PlanTierGuard } from '../auth/guards/plan-tiers.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';

describe('SupportController', () => {
  let controller: SupportController;
  let mockSubscriptionsService: any;
  let mockSupportService: any;

  beforeEach(async () => {
    mockSubscriptionsService = {
      findByUserId: jest.fn(),
    };

    mockSupportService = {
      getWhatsappLink: jest.fn().mockReturnValue({ url: 'https://wa.me/123456789' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        { provide: SupportService, useValue: mockSupportService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 'mock-user-id' };
          return true;
        },
      })
      .compile();

    controller = module.get<SupportController>(SupportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('whatsapp-link guard integration', () => {
    it('should throw ForbiddenException (UPGRADE_REQUIRED) for free-tier users', async () => {
      // Mock the subscription service to return a free plan
      mockSubscriptionsService.findByUserId.mockResolvedValue({
        status: 'active',
        plan: { slug: 'free' },
      });

      const guard = new PlanTierGuard(
        { getAllAndOverride: () => ['growth', 'enterprise'] } as any,
        mockSubscriptionsService,
      );

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: { userId: 'free-user-id' } }),
        }),
      } as any;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);

      try {
        await guard.canActivate(mockContext);
      } catch (err) {
        expect(err.getResponse().code).toBe('UPGRADE_REQUIRED');
      }
    });

    it('should grant access to growth-tier users', async () => {
      // Mock the subscription service to return a growth plan
      mockSubscriptionsService.findByUserId.mockResolvedValue({
        status: 'active',
        plan: { slug: 'growth' },
      });

      const guard = new PlanTierGuard(
        { getAllAndOverride: () => ['growth', 'enterprise'] } as any,
        mockSubscriptionsService,
      );

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: { userId: 'growth-user-id' } }),
        }),
      } as any;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);

      const res = controller.getWhatsappLink();
      expect(res).toEqual({ url: 'https://wa.me/123456789' });
    });
  });
});
