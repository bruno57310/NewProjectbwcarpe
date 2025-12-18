// src/hooks/useSubscriptionTier.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface DiagnosticData {
  profileLookupStages: string[];
  finalTier?: string;
  subscriptionError?: any;
  profileError?: any;
}

export const useSubscriptionTier = (user: User | null) => {
  const [tier, setTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticData>({ profileLookupStages: [] });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const resolveSubscriptionTier = async () => {
      setLoading(true);
      const diagnosticData: DiagnosticData = { profileLookupStages: [] };

      try {
        // Profile lookup stages
        diagnosticData.profileLookupStages.push('Stage 1: Exact email match');
        let { data: exactMatchProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!exactMatchProfile) {
          diagnosticData.profileLookupStages.push('Stage 2: Case-insensitive match');
          const { data: ciMatchProfiles } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', user.email!);

          if (ciMatchProfiles?.length === 1) {
            exactMatchProfile = ciMatchProfiles[0];
          }
        }

        if (!exactMatchProfile) {
          diagnosticData.profileLookupStages.push('Stage 3: RPC lookup');
          // Encode email for special characters
          const encodedEmail = encodeURIComponent(user.email);
          const { data: rpcResult } = await supabase.rpc('get_auth_user_by_email', {
            p_email: encodedEmail
          });

          if (rpcResult) {
            exactMatchProfile = { id: rpcResult };
          }
        }

        if (!exactMatchProfile) {
          diagnosticData.profileLookupStages.push('Stage 4: Emergency profile creation');
          try {
            const { data: newProfile, error: profileError } = await supabase
              .from('profiles')
              .insert([{ 
                email: user.email,
                auth_id: user.id  // Critical for RLS policy matching
              }])
              .select('id')
              .single();

            if (profileError) {
              console.error('🚨 Profile creation failed:', {
                errorCode: profileError.code,
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint,
                email: user.email,
                authId: user.id
              });
              throw new Error(`Profile creation blocked by RLS: ${profileError.message}`);
            }
            
            exactMatchProfile = newProfile;
            diagnosticData.profileLookupStages.push('✅ Emergency profile created successfully');
          } catch (error) {
            diagnosticData.profileLookupStages.push('❌ FATAL: Profile creation failed');
            throw error;
          }
        }

        // Subscription lookup
        const { data: subscriptionData, error: subscriptionError, count } = await supabase
          .from('subscriptions')
          .select('tier', { count: 'exact' })
          .eq('login_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        console.log('🔍 Subscription lookup results:', {
          userId: user.id,
          rowCount: count,
          data: subscriptionData,
          error: subscriptionError
        });

        if (subscriptionError) {
          diagnosticData.subscriptionError = {
            message: subscriptionError.message,
            details: subscriptionError.details,
            hint: subscriptionError.hint,
            code: subscriptionError.code
          };
          throw subscriptionError;
        }

        const activeTier = subscriptionData?.[0]?.tier || 'free';
        diagnosticData.finalTier = activeTier;

        setTier(activeTier);
        setDiagnostics(diagnosticData);
      } catch (error) {
        console.error('Subscription tier resolution failed:', error);
        setDiagnostics({
          ...diagnosticData,
          profileError: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setLoading(false);
      }
    };

    resolveSubscriptionTier();
  }, [user]);

  return { tier, loading, diagnostics };
};
