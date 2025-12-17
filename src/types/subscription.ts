import { User } from '@supabase/supabase-js';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  active: boolean;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  yearlyPrice?: number;
  interval: 'month' | 'year' | 'quarter';
  features: string[];
  highlighted?: boolean;
}
