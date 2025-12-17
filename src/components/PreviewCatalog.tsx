import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Filter, Search, Star } from 'lucide-react';

function PreviewCatalog() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-green-700" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            Accédez au Catalogue Complet
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Découvrez notre catalogue détaillé de plus de 20 farines avec leurs propriétés nutritionnelles, mécaniques et leurs conseils d'utilisation.
          </p>

          {/* Sample Catalog Preview */}
          <div className="mb-12">
            <img 
              src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80"
              alt="Aperçu du catalogue de farines" 
              className="rounded-lg shadow-xl mb-4 mx-auto max-w-2xl"
            />
            <p className="text-sm text-gray-600 italic">
              Notre catalogue complet vous donne accès à une base de données détaillée de farines pour la pêche à la carpe, 
              avec des informations précises sur leur composition, leurs propriétés et leurs utilisations recommandées.
            </p>
          </div>

          {/* Sample Flour Details Preview */}
          <div className="mb-12">
            <img 
              src="https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80"
              alt="Exemple de détails d'une farine" 
              className="rounded-lg shadow-xl mb-4 mx-auto max-w-2xl"
            />
            <p className="text-sm text-gray-600 italic">
              Pour chaque farine, accédez à des informations détaillées incluant la composition protéique, 
              les propriétés mécaniques, les valeurs nutritionnelles et des conseils d'utilisation spécifiques.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-4">
                  <Search className="w-8 h-8 text-green-700" />
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Recherche Avancée</h3>
                <p className="text-gray-600 text-sm">Trouvez rapidement les farines qui correspondent à vos besoins.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-4">
                  <Filter className="w-8 h-8 text-green-700" />
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Filtres Détaillés</h3>
                <p className="text-gray-600 text-sm">Filtrez par catégorie, propriétés et caractéristiques.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-center mb-4">
                  <Star className="w-8 h-8 text-green-700" />
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Valeurs Numériques Précises</h3>
                <p className="text-gray-600 text-sm">Accédez aux valeurs exactes des anti-nutriments et autres propriétés.</p>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm filter blur-sm">
                <div className="h-32 bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-green-800 mb-4">Fonctionnalités du Catalogue Premium</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Search className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Catalogue Complet</h4>
                <p className="text-gray-600 text-sm">Accédez à plus de 20 farines avec descriptions détaillées et propriétés complètes.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Filter className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Filtres Avancés</h4>
                <p className="text-gray-600 text-sm">Filtrez par propriétés spécifiques pour trouver exactement ce que vous cherchez.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Star className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Valeurs Anti-nutriments Précises</h4>
                <p className="text-gray-600 text-sm">Visualisez les valeurs numériques exactes des anti-nutriments pour chaque farine.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Lock className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Données Scientifiques</h4>
                <p className="text-gray-600 text-sm">Accédez à des informations précises basées sur des analyses scientifiques.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewCatalog;
