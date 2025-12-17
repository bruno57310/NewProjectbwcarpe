import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CreditCard, Check, AlertCircle } from 'lucide-react';
import type { PricingPlan, Subscription } from '../types/subscription';
import { trackSubscription } from '../lib/loops';
import PaymentModal from './PaymentModal';

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    tier: 'free',
    price: 0,
    interval: 'month',
    features: [
      'Accès au catalogue de base',
      'Calculateur de mix simple',
      'Sauvegarde de 3 mix maximum',
      'Support communautaire'
    ]
  },
  {
    id: 'pro',
    name: 'PRO3',
    tier: 'pro',
    price: 30,
    interval: 'quarter',
    features: [
      'Catalogue Public avec détails simplifiés',
      'Calculateur de mix simple',
      'Analyses nutritionnelles sans composition enzymatique',
      'Valeurs Anti-nutriments définies par type',
      'Support fonctionnel'
    ],
    highlighted: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 90,
    interval: 'quarter',
    features: [
      'Tous les catalogues avec détails avancés',
      'API d\'accès aux données',
      'Tableau de bord personnalisé',
      'Support dédié 24/6',
      'Formation personnalisée',
      'Accès anticipé aux nouvelles fonctionnalités'
    ]
  }
];


function SubscriptionManagement() {
  const { planId } = useParams();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [selectedPlan] = useState<PricingPlan | undefined>(
    plans.find(p => p.id === planId)
  );

  useEffect(() => {
    if (!selectedPlan) {
      navigate('/pricing');
      return;
    }

    const fetchCurrentSubscription = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('login_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setCurrentSubscription(data);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Erreur lors de la récupération de l\'abonnement');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentSubscription();
  }, [user, selectedPlan, navigate]);

  const handleSubscribe = async () => {
    if (!user || !selectedPlan) return;

    if (selectedPlan.tier === 'free') {
      // For free plan, update subscription directly
      setProcessing(true);
      setError(null);

      try {
        const subscriptionData = {
          login_id: user.id,
          tier: selectedPlan.tier,
          active: true,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + (billingInterval === 'quarter' ? 90 : billingInterval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000
          ).toISOString(),
          cancel_at_period_end: false
        };

        if (currentSubscription) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update(subscriptionData)
            .eq('login_id', user.id);

          if (updateError) throw updateError;
          
          // Track subscription update
          await trackSubscription(user.id, selectedPlan.tier, 'updated');
        } else {
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert([subscriptionData]);

          if (insertError) throw insertError;
          
          // Track subscription creation
          await trackSubscription(user.id, selectedPlan.tier, 'created');
        }

        await signOut();
        navigate('/auth', { 
          state: { 
            message: 'Votre abonnement a été mis à jour. Veuillez vous reconnecter pour activer les changements.' 
          }
        });
      } catch (err) {
        console.error('Error updating subscription:', err);
        setError('Erreur lors de la mise à jour de l\'abonnement');
      } finally {
        setProcessing(false);
      }
    } else {
      // For paid plans, show payment modal
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    await signOut();
    navigate('/auth', { 
      state: { 
        message: 'Votre abonnement a été mis à jour avec succès. Veuillez vous reconnecter pour activer les changements.' 
      }
    });
  };

  const getPrice = () => {
    if (!selectedPlan || selectedPlan.tier === 'free') return 0;
    return billingInterval === 'year' ? selectedPlan.yearlyPrice || selectedPlan.price : selectedPlan.price;
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!selectedPlan) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-green-800">
            Changer d'abonnement
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {selectedPlan.tier !== 'free' && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-4 py-2 rounded-lg ${
                billingInterval === 'month'
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Trimestriel
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-4 py-2 rounded-lg ${
                billingInterval === 'year'
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Annuel
            </button>
          </div>
        )}

        <div className="mb-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  {selectedPlan.name}
                </h3>
                <p className="text-gray-600">
                  {selectedPlan.price === 0 ? 'Gratuit' : `${selectedPlan.price}€ / trimestre`}
                </p>
              </div>
              {currentSubscription?.tier === selectedPlan.tier && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  Plan actuel
                </span>
              )}
            </div>
            <ul className="space-y-3">
              {selectedPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate('/pricing')}
            className="px-6 py-2 text-gray-700 hover:text-gray-900"
          >
            Annuler
          </button>
          <button
            onClick={handleSubscribe}
            disabled={processing || currentSubscription?.tier === selectedPlan.tier}
            className={`px-6 py-2 rounded-lg text-white ${
              processing || currentSubscription?.tier === selectedPlan.tier
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-700 hover:bg-green-600'
            }`}
          >
            {processing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Traitement...
              </div>
            ) : currentSubscription?.tier === selectedPlan.tier ? (
              'Plan actuel'
            ) : (
              selectedPlan.tier === 'free' ? 'Confirmer le changement' : `Payer ${getPrice()}€`
            )}
          </button>
        </div>
      </div>

      {showPaymentModal && selectedPlan && (
        <PaymentModal
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          price={getPrice()}
          billingInterval={billingInterval}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default SubscriptionManagement;
