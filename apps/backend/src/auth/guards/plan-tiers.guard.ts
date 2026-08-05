import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { PLAN_TIERS_KEY } from '../decorators/plan-tiers.decorator';

@Injectable()
export class PlanTierGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTiers = this.reflector.getAllAndOverride<string[]>(PLAN_TIERS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTiers || requiredTiers.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // populated by JwtAuthGuard

    if (!user || !user.userId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'UPGRADE_REQUIRED',
        message: 'Authentication required to check subscription plan.',
      });
    }

    try {
      // Live DB query for active subscription
      const subscription = await this.subscriptionsService.findByUserId(user.userId);
      
      // If the subscription is not 'active', reject access
      if (!subscription || subscription.status !== 'active') {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          code: 'UPGRADE_REQUIRED',
          message: 'An active subscription is required to access this resource.',
        });
      }

      // Check if plan slug is allowed
      const planSlug = subscription.plan?.slug;
      if (!planSlug || !requiredTiers.includes(planSlug)) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          code: 'UPGRADE_REQUIRED',
          message: `This feature requires a higher subscription tier. Allowed plans: ${requiredTiers.join(', ')}`,
        });
      }

      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        code: 'UPGRADE_REQUIRED',
        message: err.message || 'No active subscription found. Upgrade is required.',
      });
    }
  }
}
