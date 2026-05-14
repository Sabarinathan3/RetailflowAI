import { SubscriptionPlan } from '@prisma/client';

/**
 * PlanDefinition Interface
 * Defines the metadata, limits, and features for each subscription tier.
 */
export interface PlanDefinition {
  id: SubscriptionPlan;
  name: string;
  price: number;
  interval: 'MONTHLY' | 'YEARLY';
  limits: {
    maxBranches: number;
    maxProducts: number;
    maxUsers: number;
  };
  features: string[];
}

/**
 * Static Plans Configuration
 * Centralized source of truth for all subscription plans.
 */
const PLANS: Record<SubscriptionPlan, PlanDefinition> = {
  FREE: {
    id: 'FREE',
    name: 'Free Starter',
    price: 0,
    interval: 'MONTHLY',
    limits: {
      maxBranches: 1,
      maxProducts: 50,
      maxUsers: 2,
    },
    features: [
      'inventory_management',
      'basic_billing',
      'basic_reports',
    ],
  },
  BASIC: {
    id: 'BASIC',
    name: 'Business Basic',
    price: 999,
    interval: 'MONTHLY',
    limits: {
      maxBranches: 3,
      maxProducts: 1000,
      maxUsers: 5,
    },
    features: [
      'inventory_management',
      'basic_billing',
      'customers_ledger',
      'basic_reports',
      'expense_tracking',
    ],
  },
  PRO: {
    id: 'PRO',
    name: 'Retail Flow Pro',
    price: 2499,
    interval: 'MONTHLY',
    limits: {
      maxBranches: 10,
      maxProducts: 10000,
      maxUsers: 20,
    },
    features: [
      'inventory_management',
      'advanced_billing',
      'customers_ledger',
      'full_analytics',
      'ai_forecast',
      'credit_risk',
      'multi_branch_sync',
    ],
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise AI',
    price: 9999,
    interval: 'MONTHLY',
    limits: {
      maxBranches: 100,
      maxProducts: 100000,
      maxUsers: 1000,
    },
    features: [
      'inventory_management',
      'advanced_billing',
      'customers_ledger',
      'full_analytics',
      'ai_forecast',
      'credit_risk',
      'anomaly_detection',
      'shelf_scan',
      'custom_branding',
      'api_access',
      'dedicated_support',
    ],
  },
};

/**
 * PlansService
 * Handles all logic related to subscription plan metadata and entitlement checking.
 */
export class PlansService {
  /**
   * Returns a list of all available plans.
   */
  getPlans(): PlanDefinition[] {
    return Object.values(PLANS);
  }

  /**
   * Returns details for a specific plan.
   */
  getPlan(plan: SubscriptionPlan): PlanDefinition {
    return PLANS[plan];
  }

  /**
   * Checks if a specific feature is enabled for a given plan.
   */
  isFeatureEnabled(plan: SubscriptionPlan, feature: string): boolean {
    const planDef = PLANS[plan];
    if (!planDef) return false;
    return planDef.features.includes(feature);
  }

  /**
   * Retrieves a specific limit for a given plan.
   */
  getLimit(plan: SubscriptionPlan, limitKey: keyof PlanDefinition['limits']): number {
    const planDef = PLANS[plan];
    return planDef?.limits[limitKey] ?? 0;
  }
}
