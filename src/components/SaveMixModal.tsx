import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import MixLimitExceededModal from './MixLimitExceededModal';

interface SaveMixModalProps {
  mix: Array<{
    flourId: string;
    flourName: string;
    percentage: number;
  }>;
  onSave: (name: string, description: string, tags: string[]) => void;
  onClose: () => void;
  isEdit?: boolean;
  initialName?: string;
  initialDescription?: string;
  initialTags?: string[];
}

function SaveMixModal({
  mix,
  onSave,
  onClose,
  isEdit = false,
  initialName = '',
  initialDescription = '',
  initialTags = []
}: SaveMixModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialTags);
  const [showLimitExceededModal, setShowLimitExceededModal] = useState(false);
  const [userMixes, setUserMixes] = useState<any[]>([]);
  const [mixLimits, setMixLimits] = useState({
    pro_limit: 1,
    enterprise_limit: 20
  });
  const [userSubscription, setUserSubscription] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      // Get user's subscription tier
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('login_id', user.id)
        .maybeSingle();
      
      if (subscriptionError) throw subscriptionError;
      
      const tier = subscriptionData?.tier || 'free';
      setUserSubscription(tier);
      
      // Get user's existing mixes
      const { data: mixesData, error: mixesError } = await supabase
        .from('saved_mixes')
        .select('*')
        .eq('user_id', user.id);
      
      if (mixesError) throw mixesError;
      
      setUserMixes(mixesData || []);
      
      // Get mix limits
      const { data: limitsData, error: limitsError } = await supabase
        .from('mix_limits')
        .select('*');
        
      if (limitsError) throw limitsError;
      
      if (limitsData) {
        const limits = {
          pro_limit: limitsData.find((l: any) => l.tier === 'pro')?.max_mixes || 3,
          enterprise_limit: limitsData.find((l: any) => l.tier === 'enterprise')?.max_mixes || 20
        };
        setMixLimits(limits);
      }
      
      // Get user's bonus slots
      const { data: bonusData, error: bonusError } = await supabase
        .from('mix_bonus_purchases')
        .select('quantity')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expiration_date', 'now()');
        
      if (bonusError) throw bonusError;
      
      const bonusSlots = bonusData ? bonusData.reduce((total: number, bonus: any) => total + bonus.quantity, 0) : 0;
      
      // Check if user has reached their limit
      const mixCount = mixesData?.length || 0;
      let mixLimit = 0;
      
      if (tier === 'pro') {
        mixLimit = limitsData?.find((l: any) => l.tier === 'pro')?.max_mixes || 3;
      } else if (tier === 'enterprise') {
        mixLimit = limitsData?.find((l: any) => l.tier === 'enterprise')?.max_mixes || 20;
      }
                    
      // Add bonus slots to the limit
      mixLimit += bonusSlots;
      
      console.log('Mix limit check:', {
        tier,
        mixCount,
        mixLimit,
        bonusSlots,
        limitsData
      });
      
      // If editing, we're not adding a new mix, so no need to check limits
      if (!isEdit && mixLimit > 0 && mixCount >= mixLimit) {
        setShowLimitExceededModal(true);
        return;
      }
      
      // If we get here, we can save the mix
      onSave(name, description, tags);
    } catch (err) {
      console.error('Error checking mix limits:', err);
      // Proceed with save anyway as a fallback
      onSave(name, description, tags);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleDeleteMix = async (mixId: string) => {
    try {
      const { error } = await supabase
        .from('saved_mixes')
        .delete()
        .eq('id', mixId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      // Update the local state
      setUserMixes(userMixes.filter(mix => mix.id !== mixId));
      
      // Now we can save the new mix
      onSave(name, description, tags);
    } catch (err) {
      console.error('Error deleting mix:', err);
      throw err;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {isEdit ? t('calculator.editMix') : t('calculator.saveMix')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('calculator.mixName')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('calculator.mixDescription')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('calculator.mixTags')}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 p-2 border border-gray-300 rounded-lg"
                  placeholder={t('calculator.addTag')}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600"
                >
                  {t('common.add')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 rounded-full flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {t('calculator.mixComposition')}
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                {mix.map((item) => (
                  <div key={item.flourId} className="flex justify-between mb-1">
                    <span>{item.flourName}</span>
                    <span>{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600"
              >
                {isEdit ? t('common.update') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showLimitExceededModal && userSubscription && (
        <MixLimitExceededModal
          onClose={() => setShowLimitExceededModal(false)}
          onDelete={handleDeleteMix}
          mixes={userMixes}
          currentTier={userSubscription as 'pro' | 'enterprise'}
          mixLimit={userSubscription === 'pro' ? mixLimits.pro_limit : mixLimits.enterprise_limit}
        />
      )}
    </div>
  );
}

export default SaveMixModal;
