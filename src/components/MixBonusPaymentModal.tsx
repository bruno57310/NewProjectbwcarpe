import React, { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { X, CreditCard, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MixBonusPaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function MixBonusPaymentModal({ onClose, onSuccess }: MixBonusPaymentModalProps) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const { user } = useAuth();

  const plans = {
    monthly: { price: 4, duration: '1 mois' },
    yearly: { price: 40, duration: '1 an' }
  };

  const handlePayPalSuccess = async (details: any) => {
    try {
      setProcessing(true);
      setError(null);

      // Add bonus purchase record
      const bonusData = {
        user_id: user?.id,
        quantity: 5,
        amount_paid: plans[selectedPlan].price,
        purchase_date: new Date().toISOString(),
        expiration_date: new Date(
          Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
        is_active: true
      };

      const { error: insertError } = await supabase
        .from('mix_bonus_purchases')
        .insert([bonusData]);

      if (insertError) throw insertError;

      onSuccess();
    } catch (err) {
      console.error('Error recording bonus purchase:', err);
      setError('Erreur lors de l\'enregistrement de l\'achat');
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
              <CreditCard className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-blue-800">
                Pack Bonus de Mixes
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Choisissez votre pack
            </h3>
            
            <div className="space-y-3">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="plan"
                  value="monthly"
                  checked={selectedPlan === 'monthly'}
                  onChange={(e) => setSelectedPlan(e.target.value as 'monthly' | 'yearly')}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Pack Mensuel</p>
                      <p className="text-sm text-gray-600">5 emplacements supplémentaires</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">4€</p>
                      <p className="text-xs text-gray-500">par mois</p>
                    </div>
                  </div>
                </div>
              </label>

              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedPlan === 'yearly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="plan"
                  value="yearly"
                  checked={selectedPlan === 'yearly'}
                  onChange={(e) => setSelectedPlan(e.target.value as 'monthly' | 'yearly')}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Pack Annuel</p>
                      <p className="text-sm text-gray-600">5 emplacements supplémentaires</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Économisez 17%
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">40€</p>
                      <p className="text-xs text-gray-500">par an</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <PayPalButtons
                style={{
                  layout: "vertical",
                  color: "blue",
                  shape: "rect",
                  label: "paypal"
                }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [{
                      amount: {
                        value: plans[selectedPlan].price.toString(),
                        currency_code: "EUR"
                      },
                      description: `Pack Bonus Mixes - ${plans[selectedPlan].duration}`
                    }]
                  });
                }}
                onApprove={async (data, actions) => {
                  if (actions.order) {
                    const details = await actions.order.capture();
                    await handlePayPalSuccess(details);
                  }
                }}
                onError={handlePayPalError}
                disabled={processing}
              />
              
              {processing && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span>Traitement en cours...</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Valable pendant {plans[selectedPlan].duration}</span>
            </div>
            <p>Paiement sécurisé par PayPal</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MixBonusPaymentModal;
