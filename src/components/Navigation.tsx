import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Fish, Calculator, Book, User, CreditCard, Menu, X, Crown, Heart, Lock, Database, History, BarChart2, GitMerge, FileText, Share2, Eye, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useSubscriptionTier } from '../hooks/useSubscriptionTier';

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const [showCalculatorDropdown, setShowCalculatorDropdown] = useState(false);
  const [showBlogDropdown, setShowBlogDropdown] = useState(false);
  const { user, signOut, subscriptionTier } = useAuth();
  const { tier: hookTier, loading: tierLoading } = useSubscriptionTier(user);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Tier resolution logic
  const effectiveTier = subscriptionTier || hookTier || 'free';
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  // Close mobile menu
  const closeMenu = () => setIsMenuOpen(false);

  // Handle logout
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Catalog options based on tier
  const getCatalogOptions = () => {
    const options = [
      { to: '/catalog', icon: Book, label: t('navigation.publicCatalog') }
    ];

    if (effectiveTier === 'enterprise') {
      options.push(
        { to: '/catalog/enterprise', icon: Crown, label: t('navigation.enterpriseCatalog') },
        { to: '/catalog/private', icon: Lock, label: t('navigation.privateCatalog') }
      );
    }

    return options;
  };

  // Improved dropdown hover handling
  const dropdownWrapperClass = "relative group";
  const dropdownContentClass = "absolute top-full left-0 mt-1 w-64 bg-green-800 rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200";

  return (
    <nav className="bg-green-900 text-white shadow-lg relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Language Switcher */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Fish className="w-8 h-8 text-green-300" />
              <span className="text-xl font-bold">CarpBait Pro</span>
            </Link>
            
            {/* Language Toggle - Desktop */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Catalog Dropdown - Fixed hover behavior */}
            <div className={dropdownWrapperClass}>
              <button className="flex items-center space-x-1 hover:text-green-300 transition-colors">
                <Book className="w-5 h-5" />
                <span>{t('navigation.catalog')}</span>
              </button>
              
              <div className={dropdownContentClass}>
                {getCatalogOptions().map((option, index) => (
                  <Link
                    key={index}
                    to={option.to}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-green-700"
                  >
                    <option.icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Calculator Dropdown - Fixed hover behavior */}
            <div className={dropdownWrapperClass}>
              <button className="flex items-center space-x-1 hover:text-green-300 transition-colors">
                <Calculator className="w-5 h-5" />
                <span>{t('navigation.calculator')}</span>
              </button>
              
              <div className={dropdownContentClass}>
                <Link
                  to="/calculator"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-green-700"
                >
                  <GitMerge className="w-4 h-4" />
                  <span>{t('navigation.mixCalculator')}</span>
                </Link>
                <Link
                  to="/calculator/combine"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-green-700"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t('navigation.combineMixes')}</span>
                </Link>
              </div>
            </div>

            {/* Blog Dropdown - Fixed hover behavior */}
            <div className={dropdownWrapperClass}>
              <button className="flex items-center space-x-1 hover:text-green-300 transition-colors">
                <FileText className="w-5 h-5" />
                <span>{t('navigation.blog')}</span>
              </button>
              
              <div className={dropdownContentClass}>
                <Link
                  to="/blog"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-green-700"
                >
                  <Eye className="w-4 h-4" />
                  <span>{t('navigation.viewBlog')}</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/blog-admin"
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-green-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{t('navigation.adminBlog')}</span>
                  </Link>
                )}
              </div>
            </div>

            <Link to="/pricing" className="hover:text-green-300 transition-colors">
              {t('navigation.pricing')}
            </Link>

            {/* Account Section */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className={dropdownWrapperClass}>
                  <button className="flex items-center space-x-1 hover:text-green-300 transition-colors">
                    <User className="w-5 h-5" />
                    <span>{user.email}</span>
                  </button>

                  <div className={`${dropdownContentClass} right-0 left-auto`}>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 hover:bg-green-700"
                    >
                      {t('navigation.dashboard')}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 hover:bg-green-700"
                    >
                      {t('common.logout')}
                    </button>
                    <div className="px-4 py-2 text-sm text-green-200 border-t border-green-700 mt-2">
                      {tierLoading ? (
                        <span>{t('common.loading')}...</span>
                      ) : (
                        <span>{t('navigation.tier')}: {effectiveTier}</span>
                      )}
                    </div>
                  </div>
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
            className="md:hidden p-2 rounded-lg hover:bg-green-800 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-green-800 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            {/* Language Toggle - Mobile */}
            <div className="mb-4 flex justify-center">
              <LanguageSwitcher />
            </div>

            {/* Catalog Dropdown */}
            <div className="mb-4">
              <button 
                onClick={() => setShowCatalogDropdown(!showCatalogDropdown)}
                className="flex items-center justify-between w-full py-2"
              >
                <span className="flex items-center space-x-2">
                  <Book className="w-5 h-5" />
                  <span>{t('navigation.catalog')}</span>
                </span>
                {showCatalogDropdown ? '▲' : '▼'}
              </button>
              
              {showCatalogDropdown && (
                <div className="ml-4 mt-2 space-y-2">
                  {getCatalogOptions().map((option, index) => (
                    <Link
                      key={index}
                      to={option.to}
                      className="block py-2 px-4 rounded hover:bg-green-700"
                      onClick={closeMenu}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Calculator Dropdown */}
            <div className="mb-4">
              <button 
                onClick={() => setShowCalculatorDropdown(!showCalculatorDropdown)}
                className="flex items-center justify-between w-full py-2"
              >
                <span className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5" />
                  <span>{t('navigation.calculator')}</span>
                </span>
                {showCalculatorDropdown ? '▲' : '▼'}
              </button>
              
              {showCalculatorDropdown && (
                <div className="ml-4 mt-2 space-y-2">
                  <Link
                    to="/calculator"
                    className="block py-2 px-4 rounded hover:bg-green-700"
                    onClick={closeMenu}
                  >
                    {t('navigation.mixCalculator')}
                  </Link>
                  <Link
                    to="/calculator/combine"
                    className="block py-2 px-4 rounded hover:bg-green-700"
                    onClick={closeMenu}
                  >
                    {t('navigation.combineMixes')}
                  </Link>
                </div>
              )}
            </div>

            {/* Blog Dropdown */}
            <div className="mb-4">
              <button 
                onClick={() => setShowBlogDropdown(!showBlogDropdown)}
                className="flex items-center justify-between w-full py-2"
              >
                <span className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>{t('navigation.blog')}</span>
                </span>
                {showBlogDropdown ? '▲' : '▼'}
              </button>
              
              {showBlogDropdown && (
                <div className="ml-4 mt-2 space-y-2">
                  <Link
                    to="/blog"
                    className="block py-2 px-4 rounded hover:bg-green-700"
                    onClick={closeMenu}
                  >
                    {t('navigation.viewBlog')}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/blog-admin"
                      className="block py-2 px-4 rounded hover:bg-green-700"
                      onClick={closeMenu}
                    >
                      {t('navigation.adminBlog')}
                    </Link>
                  )}
                </div>
              )}
            </div>

            <Link 
              to="/pricing" 
              className="block py-2 px-4 rounded hover:bg-green-700"
              onClick={closeMenu}
            >
              {t('navigation.pricing')}
            </Link>

            {/* Mobile Account Section */}
            {user ? (
              <div className="mt-4 pt-4 border-t border-green-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-green-200">
                    {user.email} | {t('navigation.tier')}:{' '}
                    {tierLoading ? t('common.loading') : effectiveTier}
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  className="block py-2 px-4 rounded hover:bg-green-700"
                  onClick={closeMenu}
                >
                  {t('navigation.dashboard')}
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    closeMenu();
                  }}
                  className="w-full text-left py-2 px-4 rounded hover:bg-green-700"
                >
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                state={{ from: location.pathname }}
                className="block mt-4 bg-green-700 text-center py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                onClick={closeMenu}
              >
                {t('common.login')}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navigation;
