import React from 'react';
import { Mail, Phone, Heart, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Donation() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/"
          className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
          title={t('common.back')}
        >
          <Home className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-green-800 flex items-center gap-2">
          {t('donation.title')} <Heart className="w-6 h-6 text-red-500" />
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 space-y-6">
          {/* French Version */}
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{t('donation.readingTime')}</p>
            <p className="text-gray-700">
              {t('donation.paragraph1')}
            </p>
            <p className="text-gray-700">
              {t('donation.paragraph2')}
            </p>
            <p className="text-gray-700">
              {t('donation.paragraph3')}
            </p>
            <p className="text-gray-700">
              {t('donation.paragraph4')}
              <a href="https://www.rodoliver.com/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                https://www.rodoliver.com/
              </a>
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800">
                {t('donation.warningBox')}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                {t('donation.infoBox')}
              </p>
            </div>
          </div>

          <hr className="my-8 border-gray-200" />

          {/* English Version */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-green-800">{t('donation.title')}</h2>
            <p className="text-sm text-gray-500">{t('donation.readingTime')}</p>
            <p className="text-gray-700">
              {t('donation.paragraph1')}
            </p>
            <p className="text-gray-700">
              {t('donation.paragraph2')}
            </p>
            <p className="text-gray-700">
              {t('donation.paragraph3')}
            </p>
            <p className="text-gray-700">
              {t('donation.paragraph4')}
              <a href="https://www.rodoliver.com/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                https://www.rodoliver.com/
              </a>
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800">
                {t('donation.warningBox')}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                {t('donation.infoBox')}
              </p>
            </div>
          </div>

          {/* PayPal Donation Button */}
          <div className="flex justify-center mt-8">
            <a
              href="https://www.paypal.com/donate/?business=bruno.wendling%40orange.fr&no_recurring=0&currency_code=EUR"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 text-white px-8 py-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Faire un don avec PayPal
            </a>
          </div>

          {/* Contact Information */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className="text-gray-600 mb-4">Date : 04/09/2025</p>
            <div className="space-y-2">
              <h3 className="font-semibold text-green-800">{t('donation.developerInfo')}</h3>
              <p className="text-gray-700">{t('donation.developerName')}</p>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <a href="mailto:bruno_wendling@orange.fr" className="hover:text-green-600">
                  bruno_wendling@orange.fr
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <a href="tel:0033672563384" className="hover:text-green-600">
                  0033 672 563 384
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-8">
            {t('donation.thanks')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Donation;
