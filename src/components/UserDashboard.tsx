import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase'; 
import { CreditCard, Database, Home, Check, Database as TableIcon, Image as ImageIcon, Type, ChevronUp, ChevronDown, Users, Plus, Send } from 'lucide-react';
import type { Subscription } from '../types/subscription';
import SubscriptionManager from './SubscriptionManager';
import SavedMixes from './SavedMixes';
import ImageManager from './ImageManager';
import TableAnalyzer from './TableAnalyzer';
import PrivateCatalogManager from './PrivateCatalogManager';
import PublicCatalogManager from './PublicCatalogManager';
import EnterpriseCatalogManager from './EnterpriseCatalogManager';
import BannerManager from './BannerManager';
import TextWindowManager from './TextWindowManager';
import ClickableImageWindowManager from './ClickableImageWindowManager';
import SavedMixesManager from './SavedMixesManager'; 
import MixBonusManager from './MixBonusManager';
import { trackPageView } from '../lib/loops';
import PutIdsPanel from './PutIdsPanel';

function UserDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, subscriptionTier } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showTableAnalyzer, setShowTableAnalyzer] = useState(false);

  // State for collapsible sections - all closed by default
  const [openSections, setOpenSections] = useState({
    textWindows: false,
    bannerManagement: false,
    clickableImageWindows: false,
    enterpriseTools: false,
    privateCatalog: false,
    publicCatalog: false,
    enterpriseCatalog: false,
    imageManager: false, 
    subscriptionManager: false,
    savedMixes: false,
    savedMixesManager: false,
    mixBonusManager: false,
    putIdsPanel: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    if (user) {
      // Track page view
      trackPageView(user.id, 'dashboard');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('login_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setSubscription(data);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const isAdmin = user?.email === 'bruno_wendling@orange.fr';
  const effectiveTier = subscriptionTier || subscription?.tier || 'free';
  const isEnterprise = effectiveTier === 'enterprise';
  const isPro = effectiveTier === 'pro' || isEnterprise;

  return (
    <div className="max-w-[90rem] mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
          title="Retour à l'accueil"
        >
          <Home className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-green-800">Mon Espace</h1>
      </div>

      {/* Success Message */}
      {location.state?.message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {location.state.message}
        </div>
      )}


      {/* User's Subscription Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Mon Abonnement {subscription?.tier ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1) : 'Free'}
              </h3>
              <p className="text-sm text-gray-600">
                {subscription?.active
                  ? `Valide jusqu'au ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : 'Inactif'}
              </p>
            </div>
          </div>
          <Link
            to="/pricing"
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Gérer mon abonnement
          </Link>
        </div>
      </div>

      {/* Mix Bonus Manager - For all users */}
      {isPro && ( 
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Plus className="w-6 h-6 text-blue-700" />
              </div>
              <h2 className="text-xl font-semibold text-blue-800">
                Packs Bonus de Mixes
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('mixBonusManager')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.mixBonusManager ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.mixBonusManager && <MixBonusManager />}
        </div>
      )}

      {/* PutIds Panel - Only for bruno_wendling@orange.fr */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Send className="w-6 h-6 text-blue-700" />
              </div>
              <h2 className="text-xl font-semibold text-blue-800">
                PutIds Panel
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('putIdsPanel')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.putIdsPanel ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.putIdsPanel && <PutIdsPanel />}
        </div>
      )}

      {/* Saved Mixes Manager - Only for bruno_wendling@orange.fr */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className="w-6 h-6 text-green-700" />
              </div>
              <h2 className="text-xl font-semibold text-green-800">
                Gestion des Mixes Sauvegardés
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('savedMixesManager')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.savedMixesManager ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.savedMixesManager && <SavedMixesManager />}
        </div>
      )}

      {/* Clickable Image Window Management - Only for bruno_wendling@orange.fr */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <ImageIcon className="w-6 h-6 text-purple-700" />
              </div>
              <h2 className="text-xl font-semibold text-purple-800">
                Gestion des Fenêtres Image Cliquables
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('clickableImageWindows')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.clickableImageWindows ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.clickableImageWindows && <ClickableImageWindowManager />}
        </div>
      )}

      {/* Text Window Management - Only for bruno_wendling@orange.fr */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Type className="w-6 h-6 text-purple-700" />
              </div>
              <h2 className="text-xl font-semibold text-purple-800">
                Gestion des Fenêtres Texte
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('textWindows')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.textWindows ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.textWindows && <TextWindowManager />}
        </div>
      )}

      {/* Banner Management - Only for bruno_wendling@orange.fr */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ImageIcon className="w-6 h-6 text-blue-700" />
              </div>
              <h2 className="text-xl font-semibold text-blue-800">
                Gestion des Bannières
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('bannerManagement')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.bannerManagement ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.bannerManagement && <BannerManager />}
        </div>
      )}

      {/* Public Catalog Management - Only for bruno_wendling@orange.fr */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Database className="w-6 h-6 text-green-700" />
              </div>
              <h2 className="text-xl font-semibold text-green-800">
                Gestion du Catalogue Public
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('publicCatalog')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.publicCatalog ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.publicCatalog && <PublicCatalogManager />}
        </div>
      )}

      {/* Enterprise Catalog Management - Only for bruno_wendling@orange.fr */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Database className="w-6 h-6 text-purple-700" />
              </div>
              <h2 className="text-xl font-semibold text-purple-800">
                Gestion du Catalogue Enterprise
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('enterpriseCatalog')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.enterpriseCatalog ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.enterpriseCatalog && <EnterpriseCatalogManager />}
        </div>
      )}

      {/* Enterprise Features */}
      {isEnterprise && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <TableIcon className="w-6 h-6 text-purple-700" />
              </div>
              <h2 className="text-xl font-semibold text-purple-800">
                Outils Enterprise
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('enterpriseTools')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.enterpriseTools ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.enterpriseTools && (
            <div className="space-y-8">
              <button
                onClick={() => setShowTableAnalyzer(true)}
                className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Database className="w-6 h-6 text-purple-700" />
                <div className="text-left">
                  <h3 className="font-semibold text-purple-800">Table Analyzer</h3>
                  <p className="text-sm text-purple-600">Analyser et gérer les données des tables</p>
                </div>
              </button>

              {/* Private Catalog Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-purple-800">Gestion du Catalogue Privé</h3>
                  <button 
                    onClick={() => toggleSection('privateCatalog')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {openSections.privateCatalog ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
                {openSections.privateCatalog && <PrivateCatalogManager />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Manager Section - Only for bruno_wendling@orange.fr */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <ImageIcon className="w-6 h-6 text-green-700" />
              </div>
              <h2 className="text-xl font-semibold text-green-800">
                Gestion des Images
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('imageManager')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.imageManager ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.imageManager && <ImageManager />}
        </div>
      )}

      {/* Admin Section */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Database className="w-6 h-6 text-purple-700" />
              </div>
              <h2 className="text-xl font-semibold text-purple-800">
                Gestion des Abonnements
              </h2>
            </div>
            <button 
              onClick={() => toggleSection('subscriptionManager')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {openSections.subscriptionManager ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          {openSections.subscriptionManager && <SubscriptionManager />}
        </div>
      )}

      {/* Saved Mixes */}
      {subscription && subscription.tier !== 'free' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-800">
              Mes Mix Sauvegardés
            </h2>
            <div className="flex items-center gap-4">
              <Link
                to="/calculator"
                className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Créer un nouveau mix
              </Link>
              <button 
                onClick={() => toggleSection('savedMixes')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                {openSections.savedMixes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {openSections.savedMixes && <SavedMixes />}
        </div>
      )}

      {/* Table Analyzer Modal */}
      {showTableAnalyzer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-green-800">Table Analyzer</h2>
                <button
                  onClick={() => setShowTableAnalyzer(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <TableAnalyzer onDataChange={() => {}} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
