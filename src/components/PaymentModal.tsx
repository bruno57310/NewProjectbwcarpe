import React, { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { X, CreditCard, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PaymentModalProps {
  planId: string;
  planName: string;
  price: number;
  billingInterval: 'month' | 'year' | 'quarter';
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({ planId, planName, price, billingInterval, onClose, onSuccess }: PaymentModalProps) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();

  // Check PayPal configuration on mount
  React.useEffect(() => {
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    console.log('PayPal Configuration Check:', {
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
      hasClientId: !!clientId,
      isValidFormat: clientId && clientId.length > 20,
      environment: import.meta.env.MODE
    });
    
    if (!clientId || clientId === 'test' || clientId.includes('YOUR_REAL')) {
      setError('Configuration PayPal invalide. Veuillez configurer un Client ID PayPal valide.');
    }
  }, []);

  const handlePayPalSuccess = async (details: any) => {
    try {
      setProcessing(true);
      setError(null);

      // Update user subscription
      const subscriptionData = {
        login_id: user?.id,
        tier: planId === 'pro' ? 'pro' : 'enterprise',
        active: true,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + (billingInterval === 'quarter' ? 90 : 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
        cancel_at_period_end: false
      };

      const { error: updateError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'login_id' });

      if (updateError) throw updateError;

      onSuccess();
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError('Erreur lors de la mise à jour de l\'abonnement');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayPalError = (err: any) => {
    console.error('PayPal error:', err);
    setError('Erreur lors du paiement PayPal');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-green-800">
                Paiement sécurisé
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800">{planName}</h3>
            <p className="text-2xl font-bold text-green-600">
              {price}€ / {billingInterval === 'quarter' ? 'trimestre' : 'mois'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
              <div className="text-center ml-4">
                <p className="mt-2 text-sm text-gray-600">Chargement PayPal...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Configuration info */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Info className="w-4 h-4" />
                  <span className="text-sm font-medium">Configuration PayPal</span>
                </div>
                <div className="text-xs text-blue-700">
                  <p>Client ID: {import.meta.env.VITE_PAYPAL_CLIENT_ID ? 
                    `${import.meta.env.VITE_PAYPAL_CLIENT_ID.substring(0, 15)}...` : 
                    'NON CONFIGURÉ'}</p>
                  <p>Environnement: {import.meta.env.MODE}</p>
                  <p>Montant: {price}€</p>
                </div>
              </div>
              
              <PayPalButtons
                style={{
                  layout: "horizontal",
                  color: "gold",
                  shape: "pill",
                  label: "checkout",
                  height: 50,
                  tagline: false
                }}
                forceReRender={[price, planId, billingInterval]}
                createOrder={(data, actions) => {
                  console.log('Creating PayPal order:', { 
                    price, 
                    planName, 
                    billingInterval,
                    userId: user?.id 
                  });
                  
                  return actions.order.create({
                    purchase_units: [{
                      amount: {
                        value: price.toString(),
                        currency_code: "EUR"
                      },
                      description: `CarpBait Pro ${planName} - ${
                        billingInterval === 'quarter' ? 'Abonnement Trimestriel' : 
                        billingInterval === 'year' ? 'Annuel' : 'Mensuel'
                      }`,
                      custom_id: `${user?.id}-${planId}-${Date.now()}`
                    }],
                    application_context: {
                      brand_name: "CarpBait Pro",
                      locale: "fr-FR",
                      user_action: "PAY_NOW",
                      return_url: window.location.origin + "/dashboard",
                      cancel_url: window.location.origin + "/pricing"
                    }
                  });
                }}
                onApprove={async (data, actions) => {
                  console.log('PayPal payment approved:', data);
                  if (actions.order) {
                    const details = await actions.order.capture();
                    console.log('PayPal payment captured:', details);
                    await handlePayPalSuccess(details);
                  }
                }}
                onError={(err) => {
                  console.error('PayPal error:', err);
                  setError(`Erreur PayPal: ${err.message || 'Erreur inconnue'}`);
                }}
                onCancel={() => {
                  console.log('PayPal payment cancelled');
                  setError('Paiement annulé');
                }}
                disabled={processing}
              />
              
              {processing && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                  <span>Traitement en cours...</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Paiement sécurisé par PayPal</p>
            <p>Vous pouvez annuler votre abonnement à tout moment</p>
            <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 rounded text-xs">
              <div className="flex items-center gap-1 justify-center">
                <ExternalLink className="w-4 h-4 inline mr-1" />
                <span>Si une fenêtre blanche s'ouvre, autorisez les pop-ups pour ce site</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
