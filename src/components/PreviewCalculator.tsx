import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, PieChart, Calculator, Save } from 'lucide-react';

function PreviewCalculator() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-green-700" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            Calculateur de Mix Premium
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Créez et analysez vos mélanges en temps réel avec notre calculateur intelligent.
          </p>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-4">
                  <Calculator className="w-8 h-8 text-green-700" />
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Calcul en Temps Réel</h3>
                <p className="text-gray-600 text-sm">Visualisez instantanément les propriétés de votre mélange.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-4">
                  <PieChart className="w-8 h-8 text-green-700" />
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Analyses Détaillées</h3>
                <p className="text-gray-600 text-sm">Obtenez des graphiques et statistiques complets.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-4">
                  <Save className="w-8 h-8 text-green-700" />
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Sauvegarde des Mix</h3>
                <p className="text-gray-600 text-sm">Enregistrez vos recettes favorites.</p>
              </div>
            </div>
            <Link
              to="/auth"
              className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Se connecter pour accéder
            </Link>
          </div>
        </div>
        <div className="bg-gray-50 border-t border-gray-100 p-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm filter blur-sm">
              <div className="h-8 bg-gray-200 rounded mb-4" />
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm filter blur-sm">
              <div className="h-48 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-green-800 mb-4">Fonctionnalités du Calculateur Premium</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <PieChart className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Analyse Nutritionnelle Complète</h4>
                <p className="text-gray-600 text-sm">Visualisez les valeurs précises de protéines, lipides, glucides et plus encore.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Calculator className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Valeurs Anti-nutriments Précises</h4>
                <p className="text-gray-600 text-sm">Accédez aux valeurs numériques exactes des anti-nutriments pour chaque farine et mélange.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Save className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Sauvegarde Illimitée</h4>
                <p className="text-gray-600 text-sm">Enregistrez autant de mélanges que vous le souhaitez avec des descriptions détaillées.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Lock className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Accès au Catalogue Complet</h4>
                <p className="text-gray-600 text-sm">Utilisez toutes les farines de notre catalogue avec leurs valeurs numériques précises.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewCalculator;
