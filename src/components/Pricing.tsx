import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, Star, CreditCard, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface PricingPlan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  price: number;
  yearlyPrice?: number;
  interval: 'month' | 'year' | 'quarter';
  features: string[];
  highlighted?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    tier: 'free',
    price: 0,
    interval: 'month',
    features: [
      'Accès au catalogue de démo',
      'Mix Calculator: Pour test de fonctionnalité uniquement',
      'Sauvegarde de mix possible',
      'Pas de Support'
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

function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('login_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: PricingPlan) => {
    if (!user) {
      navigate('/auth', { state: { from: '/pricing' } });
      return;
    }

    // Navigate to subscription management with plan details
    navigate(`/subscribe/${plan.id}`, {
      state: {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        interval: plan.interval
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/"
          className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
          title="Retour à l'accueil"
        >
          <Home className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-gray-600">
            Sélectionnez l'abonnement qui correspond à vos besoins
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
              plan.highlighted ? 'ring-2 ring-green-500 relative' : ''
            }`}
          >
            {plan.highlighted && (
              <div className="bg-green-500 text-white text-center py-2 text-sm font-medium">
                Recommandé
              </div>
            )}
            
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  {plan.tier === 'enterprise' ? (
                    <Crown className="w-12 h-12 text-purple-600" />
                  ) : plan.tier === 'pro' ? (
                    <Star className="w-12 h-12 text-blue-600" />
                  ) : (
                    <CreditCard className="w-12 h-12 text-gray-600" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {plan.price === 0 ? (
                    'Gratuit'
                  ) : (
                    <>
                      {plan.price}€
                      <span className="text-lg text-gray-500 font-normal">
                        /{plan.interval === 'quarter' ? 'trimestre' : plan.interval === 'year' ? 'an' : 'mois'}
                      </span>
                    </>
                  )}
                </div>
                {subscription?.tier === plan.tier && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Plan actuel
                  </span>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(plan)}
                disabled={subscription?.tier === plan.tier}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  subscription?.tier === plan.tier
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : plan.highlighted
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {subscription?.tier === plan.tier 
                  ? 'Plan actuel' 
                  : user 
                    ? 'Choisir ce plan' 
                    : 'Se connecter pour s\'abonner'
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Pricing;
