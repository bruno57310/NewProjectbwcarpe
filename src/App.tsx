import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import LandingPage from './components/LandingPage';
import FlourCatalog from './components/FlourCatalog';
import EnterpriseFlourCatalog from './components/EnterpriseFlourCatalog';
import PrivateCatalog from './components/PrivateCatalog';
import PreviewCatalog from './components/PreviewCatalog';
import MixCalculator from './components/MixCalculator';
import MixCombiner from './components/MixCombiner';
import PreviewCalculator from './components/PreviewCalculator';
import Auth from './components/Auth';
import AuthCallback from './components/AuthCallback';
import VerifyRecovery from './components/VerifyRecovery';
import ResetPassword from './components/ResetPassword';
import ResetPasswordDebug from './components/ResetPasswordDebug';
import SubscriptionDebug from './components/SubscriptionDebug';
import SessionDebug from './components/SessionDebug';
import UserDashboard from './components/UserDashboard';
import Pricing from './components/Pricing';
import SubscriptionManagement from './components/SubscriptionManagement';
import FlourListCSV from './components/FlourListCSV';
import Donation from './components/Donation';
import UserGuide from './components/UserGuide';
import Origine from './components/Origine';
import SavedMixesDebug from './components/SavedMixesDebug';
import AntiNutrientContributionViewer from './components/AntiNutrientContributionViewer';
import PrivateAntiNutrientContributionViewer from './components/PrivateAntiNutrientContributionViewer';
import EnzymeContributionViewer from './components/EnzymeContributionViewer';
import PrivateEnzymeContributionViewer from './components/PrivateEnzymeContributionViewer';
import PublicAntiNutrientContributionViewer from './components/PublicAntiNutrientContributionViewer';
import PublicEnzymeContributionViewer from './components/PublicEnzymeContributionViewer';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost'; 
import BlogAdmin from './components/BlogAdmin';
import SharedMixes from './components/SharedMixes';
import FlourCategoryManagement from './components/FlourCategoryManagement';
import PayPalManagement from './components/PayPalManagement';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

function App() {
  const { t } = useTranslation();
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  return (
    <PayPalScriptProvider options={{
      "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
      currency: "EUR",
      intent: "capture"
    }}>
      <Router>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-50 to-stone-100">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Development Banner - z-index 20 */}
          <div className="bg-amber-50 border-b border-amber-200 relative z-20">
            <div className="container mx-auto px-4 py-2 text-center text-amber-800 text-sm font-medium">
              {t('development.banner')}
            </div>
          </div>

          {/* Navigation - z-index 30 */}
          <div className="relative z-30">
            <Navigation />
          </div>

          {/* Main Content - z-index 10 */}
          <main className="container mx-auto px-4 py-4 sm:py-8 relative z-10 flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/donation" element={<Donation />} />
              <Route path="/user-guide" element={<UserGuide />} />
              <Route path="/origine" element={<Origine />} />
              <Route path="/saved-mixes-debug" element={
                <ProtectedRoute>
                  <SavedMixesDebug />
                </ProtectedRoute>
              } />
              <Route path="/flour-list" element={
                <ProtectedRoute requiresSubscription>
                  <FlourListCSV />
                </ProtectedRoute>
              } />
              <Route path="/subscribe/:planId" element={
                <ProtectedRoute>
                  <SubscriptionManagement />
                </ProtectedRoute>
              } />
              <Route path="/catalog" element={
                <ProtectedRoute requiresSubscription>
                  <FlourCatalog />
                </ProtectedRoute>
              } />
              <Route path="/catalog/enterprise" element={
                <ProtectedRoute requiresSubscription>
                  <EnterpriseFlourCatalog />
                </ProtectedRoute>
              } />
              <Route path="/catalog/private" element={
                <ProtectedRoute requiresSubscription>
                  <PrivateCatalog />
                </ProtectedRoute>
              } />
              <Route path="/catalog/preview" element={<PreviewCatalog />} />
              <Route path="/calculator" element={
                <ProtectedRoute requiresSubscription>
                  <MixCalculator />
                </ProtectedRoute>
              } />
              <Route path="/calculator/combine" element={
                <ProtectedRoute requiresSubscription>
                  <MixCombiner />
                </ProtectedRoute>
              } />
              <Route path="/calculator/preview" element={<PreviewCalculator />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/verify-recovery" element={<VerifyRecovery />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/reset-password-debug" element={<ResetPasswordDebug />} />
              <Route path="/session-debug" element={<SessionDebug />} />
              <Route path="/subscription-debug" element={
                <ProtectedRoute>
                  <SubscriptionDebug />
                </ProtectedRoute>
              } />
              <Route path="/auth/confirm" element={<ResetPassword />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:postId" element={<BlogPost />} />
              <Route path="/blog-admin" element={
                <ProtectedRoute>
                  <BlogAdmin />
                </ProtectedRoute>
              } />
              <Route path="/anti-nutrient-contributions" element={
                <ProtectedRoute requiresSubscription>
                  <AntiNutrientContributionViewer />
                </ProtectedRoute>
              } />
              <Route path="/private-anti-nutrient-contributions" element={
                <ProtectedRoute requiresSubscription>
                  <PrivateAntiNutrientContributionViewer />
                </ProtectedRoute>
              } />
              <Route path="/enzyme-contributions" element={
                <ProtectedRoute requiresSubscription>
                  <EnzymeContributionViewer />
                </ProtectedRoute>
              } />
              <Route path="/private-enzyme-contributions" element={
                <ProtectedRoute requiresSubscription>
                  <PrivateEnzymeContributionViewer />
                </ProtectedRoute>
              } />
              <Route path="/public-anti-nutrient-contributions" element={
                <ProtectedRoute requiresSubscription>
                  <PublicAntiNutrientContributionViewer />
                </ProtectedRoute>
              } />
              <Route path="/public-enzyme-contributions" element={
                <ProtectedRoute requiresSubscription>
                  <PublicEnzymeContributionViewer />
                </ProtectedRoute>
              } />
              <Route path="/shared-mixes" element={
                <ProtectedRoute>
                  <SharedMixes />
                </ProtectedRoute>
              } />
              <Route path="/flour-category-management" element={
                <ProtectedRoute>
                  <FlourCategoryManagement />
                </ProtectedRoute>
              } />
              <Route path="/paypal-management" element={
                <ProtectedRoute>
                  <PayPalManagement />
                </ProtectedRoute>
              } />
            </Routes>
          </main>

          {/* Footer Toggle Button */}
          <div className="flex justify-center">
            <button 
              onClick={() => setIsFooterExpanded(!isFooterExpanded)}
              className="bg-green-800 text-white px-4 py-1 rounded-t-lg flex items-center gap-1 z-20 relative"
            >
              {isFooterExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  {t('common.close')}
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  {t('footer.about')}
                </>
              )}
            </button>
          </div>

          {/* Footer - z-index 10 */}
          <footer className={`bg-gradient-to-b from-green-800 to-green-900 text-white py-2 relative z-10 mt-auto transition-all duration-300 ease-in-out ${isFooterExpanded ? 'max-h-[500px]' : 'max-h-[40px] overflow-hidden'}`}>
            <div className="container mx-auto px-4">
              {isFooterExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{t('footer.about')}</h3>
                    <p className="text-green-100 text-sm">
                      {t('footer.aboutText')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <a href="/catalog/preview" className="text-green-100 hover:text-white transition-colors">
                          {t('catalog.title')}
                        </a>
                      </li>
                      <li>
                        <a href="/calculator/preview" className="text-green-100 hover:text-white transition-colors">
                          {t('calculator.title')}
                        </a>
                      </li>
                      <li>
                        <a href="/blog" className="text-green-100 hover:text-white transition-colors">
                          Blog
                        </a>
                      </li>
                      <li>
                        <a href="/pricing" className="text-green-100 hover:text-white transition-colors">
                          {t('common.pricing')}
                        </a>
                      </li>
                      <li>
                        <a href="/user-guide" className="text-green-100 hover:text-white transition-colors">
                          Guide Utilisateur
                        </a>
                      </li>
                      <li>
                        <a href="/origine" className="text-green-100 hover:text-white transition-colors">
                          Origine du Projet
                        </a>
                      </li>
                      <li>
                        <a href="/auth" className="text-green-100 hover:text-white transition-colors">
                          {t('common.myAccount')}
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{t('footer.contact')}</h3>
                    <p className="text-green-100 text-sm">
                      {t('footer.contactText')}
                    </p>
                    <a
                      href="mailto:bruno_wendling@orange.fr"
                      className="inline-block mt-2 text-sm text-white hover:text-green-200 transition-colors"
                    >
                      bruno_wendling@orange.fr
                    </a>
                  </div>
                </div>
              )}
              <div className={`${isFooterExpanded ? 'mt-4 pt-4 border-t border-green-700' : ''} text-center text-sm text-green-200 py-2`}>
                <p>{t('footer.copyright')}</p>
              </div>
            </div>
          </footer>
          </div>
        </AuthProvider>
      </Router>
    </PayPalScriptProvider>

  );
}

export default App;
