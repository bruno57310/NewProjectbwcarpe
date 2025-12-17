import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Fish, Calculator, Book, User, CreditCard, Menu, X, Crown, Heart, Lock, Database, History, BarChart2, GitMerge, FileText, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const [showCalculatorDropdown, setShowCalculatorDropdown] = useState(false);
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);
  const [showEnterpriseDropdown, setShowEnterpriseDropdown] = useState(false);
  const [showPublicDropdown, setShowPublicDropdown] = useState(false);
  const [showBlogDropdown, setShowBlogDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [subscription, setSubscription] = useState<{ tier: string } | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      const fetchSubscription = async () => {
        const { data } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('login_id', user.id)
          .maybeSingle();

        setSubscription(data);
      };

      fetchSubscription();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.warn('Error during sign out:', error);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleCatalogClick = () => {
    setShowCatalogDropdown(!showCatalogDropdown);
    setShowCalculatorDropdown(false);
    setShowInfoDropdown(false);
    setShowEnterpriseDropdown(false);
    setShowPublicDropdown(false);
    setShowBlogDropdown(false);
    setShowAccountDropdown(false);
  };

  const handleCalculatorClick = () => {
    setShowCalculatorDropdown(!showCalculatorDropdown);
    setShowCatalogDropdown(false);
    setShowInfoDropdown(false);
    setShowEnterpriseDropdown(false);
    setShowPublicDropdown(false);
    setShowBlogDropdown(false);
    setShowAccountDropdown(false);
  };

  const handleInfoClick = () => {
    setShowInfoDropdown(!showInfoDropdown);
    setShowCatalogDropdown(false);
    setShowCalculatorDropdown(false);
    setShowEnterpriseDropdown(false);
    setShowPublicDropdown(false);
    setShowBlogDropdown(false);
    setShowAccountDropdown(false);
  };

  const handleEnterpriseClick = () => {
    setShowEnterpriseDropdown(!showEnterpriseDropdown);
    setShowCatalogDropdown(false);
    setShowCalculatorDropdown(false);
    setShowInfoDropdown(false);
    setShowPublicDropdown(false);
    setShowBlogDropdown(false);
    setShowAccountDropdown(false);
  };

  const handlePublicClick = () => {
    setShowPublicDropdown(!showPublicDropdown);
    setShowCatalogDropdown(false);
    setShowCalculatorDropdown(false);
    setShowInfoDropdown(false);
    setShowEnterpriseDropdown(false);
    setShowBlogDropdown(false);
    setShowAccountDropdown(false);
  };

  const handleBlogClick = () => {
    setShowBlogDropdown(!showBlogDropdown);
    setShowCatalogDropdown(false);
    setShowCalculatorDropdown(false);
    setShowInfoDropdown(false);
    setShowEnterpriseDropdown(false);
    setShowPublicDropdown(false);
    setShowAccountDropdown(false);
  };

  const handleCatalogSelect = () => {
    setShowCatalogDropdown(false);
    closeMenu();
  };

  const handleCalculatorSelect = () => {
    setShowCalculatorDropdown(false);
    closeMenu();
  };

  const handleInfoSelect = () => {
    setShowInfoDropdown(false);
    closeMenu();
  };

  const handleEnterpriseSelect = () => {
    setShowEnterpriseDropdown(false);
    closeMenu();
  };

  const handlePublicSelect = () => {
    setShowPublicDropdown(false);
    closeMenu();
  };

  const handleBlogSelect = () => {
    setShowBlogDropdown(false);
    closeMenu();
  };

  const getCatalogOptions = () => {
    if (!user || subscription?.tier === 'free') {
      return [
        { to: '/catalog', icon: Book, label: t('navigation.demoCatalog') }
      ];
    }

    const options = [
      { to: '/catalog', icon: Book, label: t('navigation.publicCatalog') }
    ];

    if (subscription?.tier === 'enterprise') {
      options.push(
        { to: '/catalog/enterprise', icon: Crown, label: t('navigation.enterpriseCatalog') },
        { to: '/catalog/private', icon: Lock, label: t('navigation.privateCatalog') }
      );
    }

    return options;
  };

  const getCalculatorOptions = () => {
    const options = [
      { to: '/calculator', icon: Calculator, label: t('calculator.title') }
    ];

    options.push(
      { to: '/calculator/combine', icon: GitMerge, label: t('calculator.mixCombiner.title') }
    );

    return options;
  };

  const getInfoOptions = () => {
    return [
      { to: '/user-guide', icon: History, label: 'Guide Utilisateur' },
      { to: '/origine', icon: History, label: 'Origine du Projet' }
    ];
  };

  const getEnterpriseOptions = () => {
    return [
      { to: '/anti-nutrient-contributions', icon: BarChart2, label: 'Contributions Anti-Nutriments' },
      { to: '/private-anti-nutrient-contributions', icon: BarChart2, label: 'Contributions Anti-Nutriments Privées' },
      { to: '/enzyme-contributions', icon: BarChart2, label: 'Contributions Enzymes' },
      { to: '/private-enzyme-contributions', icon: BarChart2, label: 'Contributions Enzymes Privées' }
    ];
  };

  const getPublicOptions = () => {
    return [
      { to: '/public-anti-nutrient-contributions', icon: BarChart2, label: 'Public Contributions Anti-Nutriments' },
      { to: '/public-enzyme-contributions', icon: BarChart2, label: 'Public Contributions Enzymes' }
    ];
  };

  const getBlogOptions = () => {
    return [
      { to: '/blog', icon: FileText, label: 'View Blog' },
      ...(isAdmin ? [{ to: '/blog-admin', icon: FileText, label: 'Admin Blog' }] : [])
    ];
  };

  const isEnterprise = subscription?.tier === 'enterprise';
  const isPro = subscription?.tier === 'pro' || isEnterprise;
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  return (
    <nav className="bg-green-800 text-white shadow-lg relative z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <Fish className="w-8 h-8" />
            <span className="text-xl font-semibold hidden sm:inline">CarpBait Pro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Catalog Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center space-x-1 hover:text-green-200"
                onClick={handleCatalogClick}
              >
                <Book className="w-5 h-5" />
                <span>{t('navigation.catalogs')}</span>
                <svg className={`w-4 h-4 transition-transform ${showCatalogDropdown ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {showCatalogDropdown && (
                <div 
                  className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                >
                  {getCatalogOptions().map(({ to, icon: Icon, label }) => (
                    <Link 
                      key={to}
                      to={to}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-green-50"
                      onClick={handleCatalogSelect}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Calculator Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center space-x-1 hover:text-green-200"
                onClick={handleCalculatorClick}
              >
                <Calculator className="w-5 h-5" />
                <span>{t('common.calculator')}</span>
                <svg className={`w-4 h-4 transition-transform ${showCalculatorDropdown ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {showCalculatorDropdown && (
                <div 
                  className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                >
                  {getCalculatorOptions().map(({ to, icon: Icon, label }) => (
                    <Link 
                      key={to}
                      to={to}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-green-50"
                      onClick={handleCalculatorSelect}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Blog Access Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center space-x-1 hover:text-green-200"
                onClick={handleBlogClick}
              >
                <FileText className="w-5 h-5" />
                <span>Blog Access</span>
                <svg className={`w-4 h-4 transition-transform ${showBlogDropdown ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {showBlogDropdown && (
                <div 
                  className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                >
                  {getBlogOptions().map(({ to, icon: Icon, label }) => (
                    <Link 
                      key={to}
                      to={to}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-green-50"
                      onClick={handleBlogSelect}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Info Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center space-x-1 hover:text-green-200"
                onClick={handleInfoClick}
              >
                <History className="w-5 h-5" />
                <span>Informations</span>
                <svg className={`w-4 h-4 transition-transform ${showInfoDropdown ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {showInfoDropdown && (
                <div 
                  className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                >
                  {getInfoOptions().map(({ to, icon: Icon, label }) => (
                    <Link 
                      key={to}
                      to={to}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-green-50"
                      onClick={handleInfoSelect}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Enterprise Dropdown - Only for Enterprise users */}
            {isEnterprise && (
              <div className="relative">
                <button 
                  className="flex items-center space-x-1 hover:text-green-200"
                  onClick={handleEnterpriseClick}
                >
                  <Crown className="w-5 h-5" />
                  <span>Enterprise</span>
                  <svg className={`w-4 h-4 transition-transform ${showEnterpriseDropdown ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                
                {showEnterpriseDropdown && (
                  <div 
                    className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50"
                  >
                    {getEnterpriseOptions().map(({ to, icon: Icon, label }) => (
                      <Link 
                        key={to}
                        to={to}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-green-50"
                        onClick={handleEnterpriseSelect}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Public Dropdown - Only for Pro and Enterprise users */}
            {isPro && (
              <div className="relative">
                <button 
                  className="flex items-center space-x-1 hover:text-green-200"
                  onClick={handlePublicClick}
                >
                  <BarChart2 className="w-5 h-5" />
                  <span>Public</span>
                  <svg className={`w-4 h-4 transition-transform ${showPublicDropdown ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                
                {showPublicDropdown && (
                  <div 
                    className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50"
                  >
                    {getPublicOptions().map(({ to, icon: Icon, label }) => (
                      <Link 
                        key={to}
                        to={to}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-green-50"
                        onClick={handlePublicSelect}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Link 
              to="/pricing"
              className="flex items-center space-x-1 hover:text-green-200"
            >
              <CreditCard className="w-5 h-5" />
              <span>{t('common.pricing')}</span>
            </Link>

            <Link 
              to="/donation"
              className="flex items-center space-x-1 hover:text-green-200"
            >
              <Heart className="w-5 h-5 text-red-300" />
              <span>{t('navigation.needDonation')}</span>
            </Link>

            <Link 
              to="/shared-mixes"
              className="flex items-center space-x-1 hover:text-green-200"
            >
              <Share2 className="w-5 h-5" />
              <span>Mixes Partagés</span>
            </Link>

            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button 
                    className="flex items-center space-x-1 hover:text-green-200"
                    onClick={() => {
                      setShowAccountDropdown(!showAccountDropdown);
                      setShowCatalogDropdown(false);
                      setShowCalculatorDropdown(false);
                      setShowInfoDropdown(false);
                      setShowEnterpriseDropdown(false);
                      setShowPublicDropdown(false);
                      setShowBlogDropdown(false);
                    }}
                  >
                    <User className="w-5 h-5" />
                    <span>{t('common.myAccount')}</span>
                    <svg className={`w-4 h-4 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  {showAccountDropdown && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50"
                    >
                      <Link 
                        to="/dashboard"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-green-50"
                        onClick={() => setShowAccountDropdown(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Tableau de bord</span>
                      </Link>
                      {isAdmin && (
                        <Link 
                          to="/paypal-management"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-green-50"
                          onClick={() => setShowAccountDropdown(false)}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>PayPal Management</span>
                        </Link>
                      )}
                      {isAdmin && (
                        <Link 
                          to="/flour-category-management"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-green-50"
                          onClick={() => setShowAccountDropdown(false)}
                        >
                          <Database className="w-4 h-4" />
                          <span>Gestion des Farines et Catégories</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSignOut}
                    className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    {t('common.logout')}
                  </button>
                  <span className="text-sm text-green-200">
                    {user.email} | Tier: {subscription?.tier || 'null'}
                  </span>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                state={{ from: location.pathname }}
                className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors"
              >
                {t('common.login')}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            {getCatalogOptions().map(({ to, icon: Icon, label }) => (
              <Link 
                key={to}
                to={to}
                className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
                onClick={handleCatalogSelect}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
            
            {getCalculatorOptions().map(({ to, icon: Icon, label }) => (
              <Link 
                key={to}
                to={to}
                className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
                onClick={handleCalculatorSelect}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}

            {/* Blog Access Options */}
            {getBlogOptions().map(({ to, icon: Icon, label }) => (
              <Link 
                key={to}
                to={to}
                className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
                onClick={handleBlogSelect}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}

            {getInfoOptions().map(({ to, icon: Icon, label }) => (
              <Link 
                key={to}
                to={to}
                className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
                onClick={handleInfoSelect}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}

            {/* Public Options - Only for Pro and Enterprise users */}
            {isPro && (
              <>
                {getPublicOptions().map(({ to, icon: Icon, label }) => (
                  <Link 
                    key={to}
                    to={to}
                    className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
                    onClick={closeMenu}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                ))}
              </>
            )}

            <Link 
              to="/pricing"
              className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
              onClick={closeMenu}
            >
              <CreditCard className="w-5 h-5" />
              <span>{t('common.pricing')}</span>
            </Link>

            <Link 
              to="/donation"
              className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
              onClick={closeMenu}
            >
              <Heart className="w-5 h-5 text-red-300" />
              <span>{t('navigation.needDonation')}</span>
            </Link>

            <Link 
              to="/shared-mixes"
              className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
              onClick={closeMenu}
            >
              <Share2 className="w-5 h-5" />
              <span>Mixes Partagés</span>
            </Link>

            <div className="px-2 py-2">
              <LanguageSwitcher />
            </div>

            {isEnterprise && (
              <>
                {getEnterpriseOptions().map(({ to, icon: Icon, label }) => (
                  <Link 
                    key={to}
                    to={to}
                    className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
                    onClick={closeMenu}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                ))}
              </>
            )}

            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
                  onClick={closeMenu}
                >
                  <User className="w-5 h-5" />
                  <span>{t('common.myAccount')}</span>
                </Link>
                {user?.email === 'bruno_wendling@orange.fr' && (
                  <Link 
                    to="/flour-category-management" 
                    className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
                    onClick={closeMenu}
                  >
                    <Database className="w-5 h-5" />
                    <span>Gestion des Farines et Catégories</span>
                  </Link>
                )}
                <div className="space-y-2 px-2">
                  <button
                    onClick={() => {
                      handleSignOut();
                      closeMenu();
                    }}
                    className="w-full text-left py-2 rounded hover:bg-green-700"
                    type="button"
                  >
                    {t('common.logout')}
                  </button>
                  <div className="text-sm text-green-200 py-2">
                    {user.email} | Tier: {subscription?.tier || 'null'}
                  </div>
                </div>
                {user?.email === 'bruno_wendling@orange.fr' && (
                  <Link to="/paypal-management" className="flex items-center space-x-1 hover:text-green-200">
                    <CreditCard className="w-5 h-5" />
                    <span>PayPal Management</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  state={{ from: location.pathname }}
                  className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-green-700"
                  onClick={closeMenu}
                >
                  <User className="w-5 h-5" />
                  <span>{t('common.login')}</span>
                </Link>
                {user?.email === 'bruno_wendling@orange.fr' && (
                  <Link to="/flour-category-management" className="flex items-center space-x-1 hover:text-green-200">
                    <Database className="w-5 h-5" />
                    <span>Gestion des Farines et Catégories</span>
                  </Link>
                )}
                {user?.email === 'bruno_wendling@orange.fr' && (
                  <Link to="/paypal-management" className="flex items-center space-x-1 hover:text-green-200">
                    <CreditCard className="w-5 h-5" />
                    <span>PayPal Management</span>
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
