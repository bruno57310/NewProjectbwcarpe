import React, { useState, useEffect } from 'react';
import { X, CreditCard, Trash2, Mail, Plus, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SavedMix } from '../types/mix';

interface MixLimitExceededModalProps {
  onClose: () => void;
  onDelete: (mixId: string) => Promise<void>;
  mixes: SavedMix[];
  currentTier: 'pro' | 'enterprise';
  mixLimit: number;
}

function MixLimitExceededModal({ 
  onClose, 
  onDelete, 
  mixes, 
  currentTier, 
  mixLimit 
}: MixLimitExceededModalProps) {
  const [selectedMixId, setSelectedMixId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { t } = useTranslation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleDelete = async () => {
    if (!selectedMixId) return;
    
    try {
      setDeleting(true);
      await onDelete(selectedMixId);
      onClose();
    } catch (error) {
      console.error('Error deleting mix:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-semibold text-red-600">
              Limite de mixes atteinte
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Vous avez atteint la limite de {mixLimit} mixes sauvegardés pour votre abonnement {currentTier === 'pro' ? 'Pro' : 'Enterprise'}.
            </p>
            <p className="text-gray-700">
              Pour continuer à sauvegarder de nouveaux mixes, vous pouvez :
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-700 flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5" />
                Supprimer un mix existant
              </h4>
              <div className="max-h-40 overflow-y-auto mb-3">
                {mixes.map(mix => (
                  <div 
                    key={mix.id} 
                    className={`p-2 rounded cursor-pointer ${
                      selectedMixId === mix.id ? 'bg-red-100 border border-red-300' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedMixId(mix.id)}
                  >
                    <p className="font-medium">{mix.name}</p>
                    {mix.description && (
                      <p className="text-sm text-gray-600 truncate">{mix.description}</p>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleDelete}
                disabled={!selectedMixId || deleting}
                className={`w-full py-2 rounded-lg transition-colors ${
                  !selectedMixId || deleting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {deleting ? 'Suppression...' : 'Supprimer le mix sélectionné'}
              </button>
            </div>

            {currentTier === 'pro' && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-700 flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5" />
                  Passer à l'abonnement Enterprise
                </h4>
                <p className="text-sm text-purple-600 mb-3">
                  L'abonnement Enterprise vous permet de sauvegarder jusqu'à {mixLimit * 20} mixes et d'accéder à toutes les fonctionnalités premium.
                </p>
                <Link
                  to="/pricing"
                  className="block w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
                >
                  Voir les abonnements
                </Link>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-700 flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5" />
                Acheter un pack de 5 sauvegardes supplémentaires
              </h4>
              <p className="text-sm text-blue-600 mb-3">
                Pour seulement 4€ par mois ou 40€ par an, obtenez 5 emplacements de sauvegarde supplémentaires.
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Mensuel (4€)
                </button>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 py-2 rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Annuel (40€)
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Calendar className="w-4 h-4" />
                <span>Paiement sécurisé par PayPal</span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-700 flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5" />
                Contacter l'administrateur
              </h4>
              <p className="text-sm text-green-600 mb-3">
                Besoin d'une solution personnalisée ? Contactez l'administrateur pour discuter de vos besoins.
              </p>
              <a
                href="mailto:bruno_wendling@orange.fr"
                className="block w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Contacter l'administrateur
              </a>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            Pour toute question, n'hésitez pas à contacter notre support à bruno_wendling@orange.fr
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <MixBonusPaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default MixLimitExceededModal;
