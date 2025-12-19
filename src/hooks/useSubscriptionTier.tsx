// src/hooks/useSubscriptionTier.tsx (updated)
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface DiagnosticData {
  profileLookupStages: string[];
  subscriptionCreationLog: string[];
  finalTier?: string;
  errors: Record<string, any>;
  rawDbResponse?: any;
}

export const useSubscriptionTier = (user: User | null) => {
  const [tier, setTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticData>({ 
    profileLookupStages: [],
    subscriptionCreationLog: [],
    errors: {}
  });

  // Email normalization utility
  const normalizeEmailForQuery = (email: string) => {
    return email
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9@._-]/g, '');
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const resolveSubscriptionTier = async () => {
      setLoading(true);
      const diagnosticData: DiagnosticData = { 
        profileLookupStages: [],
        subscriptionCreationLog: [],
        errors: {},
        rawDbResponse: null
      };

      try {
        // [1] PROFILE RESOLUTION (existing logic)
        // ... (keep existing profile lookup stages)

        // [2] SUBSCRIPTION VERIFICATION
        diagnosticData.profileLookupStages.push('Subscription lookup started');
        const { data: subscriptionData, error: subscriptionError, count } = await supabase
          .from('subscriptions')
          .select('tier', { count: 'exact' })
          .eq('login_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        diagnosticData.rawDbResponse = {
          url: `https://api.bwcarpe.com/rest/v1/subscriptions?select=tier&login_id=eq.${user.id}`,
          response: subscriptionData
        };

        console.log('🔍 Subscription verification:', {
          userId: user.id,
          rowCount: count,
          data: subscriptionData,
          error: subscriptionError
        });

        // [3] EMERGENCY SUBSCRIPTION CREATION
        if (!subscriptionData?.length) {
          diagnosticData.subscriptionCreationLog.push('⚠️ No subscription found - initiating emergency creation');
          
          const { error: createError, data: newSub } = await supabase
            .from('subscriptions')
            .insert([{
              login_id: user.id,
              tier: 'free',
              active: true
            }])
            .select('tier')
            .single();

          if (createError) {
            diagnosticData.subscriptionCreationLog.push(`❌ Creation failed: ${createError.message}`);
            diagnosticData.errors.subscriptionCreation = createError;
            
            // Verify RLS policies
            const { data: rlsDebug } = await supabase.rpc('debug_rls_policies', {
              table_name: 'subscriptions'
            });
            diagnosticData.errors.rlsPolicies = rlsDebug;
          } else {
            diagnosticData.subscriptionCreationLog.push('✅ Emergency subscription created');
            setTier(newSub.tier);
            diagnosticData.finalTier = `${newSub.tier} (emergency)`;
          }
        } else {
          setTier(subscriptionData[0].tier);
          diagnosticData.finalTier = subscriptionData[0].tier;
        }

        setDiagnostics(diagnosticData);
      } catch (error) {
        console.error('Subscription resolution failed:', error);
        setDiagnostics({
          ...diagnosticData,
          errors: {
            fatal: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    resolveSubscriptionTier();
  }, [user]);

  return { tier, loading, diagnostics };
};
