import { SubscriptionPlan } from '../entities/business.entity';
export const PLAN_PRICES = {
  [SubscriptionPlan.LITE]: 99,
  [SubscriptionPlan.STARTER]: 299,
  [SubscriptionPlan.PRO]: 599,
  [SubscriptionPlan.BUSINESS]: 999,
  [SubscriptionPlan.ZENITH]: 1499, // Tu plan VIP
};

// -1 significa ILIMITADO
export const PLAN_LIMITS = {
  [SubscriptionPlan.LITE]: {
    maxUsers: 1,
    maxCashRegisters: 0,
    maxProducts: 50,
    maxTransactions: 0,
  },
  [SubscriptionPlan.STARTER]: {
    maxUsers: 2,
    maxCashRegisters: 1,
    maxProducts: 100,
    maxTransactions: 300,
  },
  [SubscriptionPlan.PRO]: {
    maxUsers: 5,
    maxCashRegisters: 3,
    maxProducts: -1,
    maxTransactions: 2000,
  },
  [SubscriptionPlan.BUSINESS]: {
    maxUsers: 15,
    maxCashRegisters: 7,
    maxProducts: -1,
    maxTransactions: -1,
  },
  [SubscriptionPlan.ZENITH]: {
    maxUsers: 15,//passed
    maxCashRegisters: 15,//passed
    maxProducts: 15,//passed
    maxTransactions: 300,//passed
    maxBranch: 3,

  },
};