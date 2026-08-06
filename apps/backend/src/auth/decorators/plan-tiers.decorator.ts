import { SetMetadata } from '@nestjs/common';

export const PLAN_TIERS_KEY = 'allowed_plan_tiers';
export const RequirePlanTiers = (...tiers: string[]) => SetMetadata(PLAN_TIERS_KEY, tiers);
