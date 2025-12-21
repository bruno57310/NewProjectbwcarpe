import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export const useSubscriptionTier = (user: User | null) => {
  const [tier, setTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching subscription for user:', user.email);
        
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('login_id', user.id)
          .single();

        console.log('📦 Subscription data response:', {
          data: subscriptionData,
          error: error?.message
        });

        if (error) throw error;
        
        if (subscriptionData) {
          console.log('✅ Resolved tier:', subscriptionData.tier);
          setTier(subscriptionData.tier);
        } else {
          console.warn('⚠️ No subscription found, defaulting to free');
          setTier('free');
        }
      } catch (error) {
        console.error('❌ Subscription fetch error:', error);
        setTier('free');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  return { tier, loading };
};
