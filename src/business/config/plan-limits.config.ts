import { SubscriptionPlan } from '../entities/business.entity';

// -1 significa ILIMITADO
export const PLAN_LIMITS = {
  [SubscriptionPlan.LITE]: {
    maxUsers: 1,
    maxProducts: 50,
    maxTransactions: 0,
  },
  [SubscriptionPlan.STARTER]: {
    maxUsers: 2,
    maxProducts: 200,
    maxTransactions: 300,
  },
  [SubscriptionPlan.PRO]: {
    maxUsers: 5,
    maxProducts: -1,
    maxTransactions: 2000,
  },
  [SubscriptionPlan.BUSINESS]: {
    maxUsers: 15,
    maxProducts: -1,
    maxTransactions: -1,
  },
  [SubscriptionPlan.ZENITH]: {
    maxUsers: -1,
    maxProducts: -1,
    maxTransactions: -1,
  },
};