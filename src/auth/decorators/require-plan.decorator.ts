import { SetMetadata } from '@nestjs/common';
import { SubscriptionPlan } from '../../business/entities/business.entity';

export const PLAN_KEY = 'plan';
export const RequirePlan = (plan: SubscriptionPlan) => SetMetadata(PLAN_KEY, plan);
