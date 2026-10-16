import type { PlanConfig } from '../types';

/**
 * Subscription plan configuration.
 * Prices are configurable here — not hardcoded throughout the codebase.
 * All prices are in INR. Paise = INR × 100.
 */
export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Starter',
    priceMonthly: 0,
    pricePaise: 0,
    description: 'Perfect for getting started',
    features: [
      '10 free roommate connections',
      'Browse all profiles',
      'Compatibility scoring',
      'Basic filters',
      'Safety center access'
    ],
    connectionsPerMonth: 10,
    highlighted: false
  },
  {
    id: 'monthly',
    name: 'Connect+',
    priceMonthly: 199,
    pricePaise: 19900,
    description: 'Unlimited connections for active seekers',
    features: [
      'Unlimited roommate connections',
      'Priority profile placement',
      'Advanced lifestyle filters',
      'Read receipts in messages',
      'Aadhaar verification badge priority',
      'Cancel anytime'
    ],
    connectionsPerMonth: 'unlimited',
    highlighted: true
  },
  {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 499,
    pricePaise: 49900,
    description: 'Full suite for serious seekers',
    features: [
      'Everything in Connect+',
      'Profile featured in top results',
      'Compatibility insights report',
      'Direct landlord contact on PGs',
      'Priority customer support',
      'Profile verification badge'
    ],
    connectionsPerMonth: 'unlimited',
    highlighted: false
  }
];

export function getPlanById(planId: string): PlanConfig | undefined {
  return SUBSCRIPTION_PLANS.find(p => p.id === planId);
}

/**
 * Checks whether a subscription entitles the user to make new connections.
 * This logic is enforced server-side; this function is for UI display only.
 */
export function canMakeConnectionsWithPlan(
  plan: string,
  status: string
): boolean {
  if (status !== 'active') return false;
  if (plan === 'monthly' || plan === 'premium') return true;
  return false; // 'free' plan uses token balance, not plan entitlement
}
