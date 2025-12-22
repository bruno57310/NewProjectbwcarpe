import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Book, Calculator, UserPlus, ChevronRight, Fish, Scale, Brain, Home, Heart, FileText, Download } from 'lucide-react';
import Banner from './Banner';
import TextWindow from './TextWindow';
import ClickableImageWindow from './ClickableImageWindow';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { trackPageView } from '../lib/loops';

function LandingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Ensure clean URL parameters
    const currentParams = new URLSearchParams(searchParams);
    if (currentParams.toString()) {
      const cleanParams = new URLSearchParams();
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Tracking logic remains unchanged
    if (user) {
      trackPageView(user.id, 'landing_page');
    } else {
      trackPageView('anonymous', 'landing_page');
    }
  }, [user, searchParams]);

  return (
    <div className="space-y-20 relative">
      {/* Clickable Image Window at the top */}
      <div className="relative min-h-[200px]">
        <ClickableImageWindow page="home" />
      </div>

      {/* Text Windows */}
      <div className="relative min-h-[200px]">
        <TextWindow page="home" />
      </div>

      {/* Banner Section */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <Banner placement="home" index={0} />
        </div>
        <div className="flex-1">
          <Banner placement="home" index={1} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="mx-auto max-w-4xl">
          <img 
            src={t('landing.hero.imgsrc')}
            alt={t('landing.hero.imgalt')}
            className="w-full h-[400px] object-cover rounded-2xl shadow-xl"
          />
        </div>
        <h1 className="text-5xl font-bold text-green-800">
          {t('landing.hero.title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('landing.hero.subtitle')}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/"
            className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            {t('common.home')}
          </Link>
          <Link
            to="/catalog"
            className="bg-white text-green-700 border-2 border-green-700 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
            onClick={() => {
              if (user) {
                trackPageView(user.id, 'catalog_from_landing');
              }
            }}
          >
            <Book className="w-5 h-5" />
            {t('landing.hero.exploreCatalog')}
          </Link>
          <Link
            to="/calculator"
            className="bg-white text-green-700 border-2 border-green-700 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
            onClick={() => {
              if (user) {
                trackPageView(user.id, 'calculator_from_landing');
              }
            }}
          >
            <Calculator className="w-5 h-5" />
            {t('landing.hero.calculateMix')}
          </Link>
          <Link
            to="/user-guide"
            className="bg-white text-green-700 border-2 border-green-700 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
            onClick={() => {
              if (user) {
                trackPageView(user.id, 'user_guide_from_landing');
              }
            }}
          >
            <FileText className="w-5 h-5" />
            Guide Utilisateur
          </Link>
        </div>
      </section>

      {/* Donation Section */}
      <section className="bg-gradient-to-br from-red-50 to-pink-50 -mx-4 px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Heart className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">
            {t('landing.donation.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('landing.donation.description')}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/donation"
              className="bg-red-500 text-white px-8 py-4 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              onClick={() => {
                if (user) {
                  trackPageView(user.id, 'donation_from_landing');
                }
              }}
            >
              <Heart className="w-5 h-5" />
              {t('landing.donation.button')}
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            {t('landing.donation.benefits')}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon={<Book className="w-8 h-8" />}
          title={t('landing.features.catalog.title')}
          description={t('landing.features.catalog.description')}
        />
        <FeatureCard
          icon={<Calculator className="w-8 h-8" />}
          title={t('landing.features.calculator.title')}
          description={t('landing.features.calculator.description')}
        />
        <FeatureCard
          icon={<UserPlus className="w-8 h-8" />}
          title={t('landing.features.personal.title')}
          description={t('landing.features.personal.description')}
        />
      </section>

      {/* How It Works Section */}
      <section className="bg-green-50 -mx-4 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-green-800 text-center mb-12">
            {t('landing.howItWorks.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number={1}
              icon={<Fish className="w-6 h-6" />}
              title={t('landing.howItWorks.step1.title')}
              description={t('landing.howItWorks.step1.description')}
            />
            <Step
              number={2}
              icon={<Scale className="w-6 h-6" />}
              title={t('landing.howItWorks.step2.title')}
              description={t('landing.howItWorks.step2.description')}
            />
            <Step
              number={3}
              icon={<Brain className="w-6 h-6" />}
              title={t('landing.howItWorks.step3.title')}
              description={t('landing.howItWorks.step3.description')}
            />
          </div>
        </div>
      </section>

      {/* User Guide Download Section */}
      <section className="bg-blue-50 -mx-4 px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">
            Guide Utilisateur
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Téléchargez notre guide utilisateur complet pour découvrir toutes les fonctionnalités de CarpBait Pro et optimiser votre expérience.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/user-guide"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              onClick={() => {
                if (user) {
                  trackPageView(user.id, 'user_guide_from_section');
                }
              }}
            >
              <FileText className="w-5 h-5" />
              Consulter le guide
            </Link>
            <Link
              to="/origine"
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
              onClick={() => {
                if (user) {
                  trackPageView(user.id, 'origine_from_landing');
                }
              }}
            >
              <FileText className="w-5 h-5" />
              Origine du Projet
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6">
        <h2 className="text-3xl font-bold text-green-800">
          {t('landing.cta.title')}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {t('landing.cta.description')}
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 bg-green-700 text-white px-8 py-4 rounded-lg hover:bg-green-600 transition-colors"
          onClick={() => {
            if (user) {
              trackPageView(user.id, 'auth_from_cta');
            } else {
              trackPageView('anonymous', 'auth_from_cta');
            }
          }}
        >
          {t('landing.cta.button')}
          <ChevronRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="text-green-700 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-green-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, icon, title, description }: { number: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center">
        {number}
      </div>
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <div className="text-green-700">{icon}</div>
          <h3 className="font-semibold text-green-800">{title}</h3>
        </div>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default LandingPage;
