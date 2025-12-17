import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Download, Book, Calculator, Database, User, CreditCard, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function UserGuide() {
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
        <h1 className="text-3xl font-bold text-green-800">
          Guide Utilisateur CarpBait Pro
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-green-800">CarpBait Pro</h2>
            <p className="text-gray-600">Version 1.0 - Avril 2025</p>
          </div>
          <a 
            href="/user-guide.pdf" 
            download
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download className="w-5 h-5" />
            Télécharger le PDF
          </a>
        </div>

        <div className="prose max-w-none">
          <h2>Table des matières</h2>
          <ol>
            <li><a href="#introduction">Introduction</a></li>
            <li><a href="#getting-started">Démarrage</a></li>
            <li><a href="#catalog">Catalogue des farines</a></li>
            <li><a href="#calculator">Calculateur de mix</a></li>
            <li><a href="#account">Gestion du compte</a></li>
            <li><a href="#subscriptions">Abonnements</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ol>

          <h2 id="introduction">1. Introduction</h2>
          <p>
            CarpBait Pro est une application web dédiée aux pêcheurs de carpe qui souhaitent optimiser 
            leurs appâts. Elle offre un catalogue détaillé de farines avec leurs propriétés nutritionnelles 
            et mécaniques, ainsi qu'un calculateur intelligent pour créer des mélanges parfaitement équilibrés.
          </p>
          <p>
            Que vous soyez un pêcheur amateur ou un professionnel exigeant, CarpBait Pro vous fournit 
            les outils nécessaires pour comprendre et améliorer vos appâts, maximisant ainsi vos chances 
            de succès lors de vos sessions de pêche.
          </p>

          <h2 id="getting-started">2. Démarrage</h2>
          <h3>Inscription et connexion</h3>
          <p>
            Pour profiter pleinement de CarpBait Pro, commencez par créer un compte :
          </p>
          <ol>
            <li>Cliquez sur "Connexion" dans le menu de navigation</li>
            <li>Sélectionnez "S'inscrire" si vous n'avez pas encore de compte</li>
            <li>Entrez votre adresse email et créez un mot de passe</li>
            <li>Validez votre inscription</li>
          </ol>
          <p>
            Une fois inscrit, vous pouvez vous connecter à tout moment en utilisant vos identifiants.
          </p>

          <h3>Navigation dans l'application</h3>
          <p>
            L'interface de CarpBait Pro est intuitive et organisée en plusieurs sections principales :
          </p>
          <ul>
            <li><strong>Accueil</strong> : Présentation générale et accès rapide aux fonctionnalités</li>
            <li><strong>Catalogues</strong> : Accès aux différents catalogues de farines</li>
            <li><strong>Calculateur</strong> : Outil de création et d'analyse de mélanges</li>
            <li><strong>Blog</strong> : Articles et conseils sur les appâts et techniques de pêche</li>
            <li><strong>Abonnements</strong> : Informations sur les différentes formules disponibles</li>
            <li><strong>Mon Espace</strong> : Gestion de votre compte et de vos mélanges sauvegardés</li>
          </ul>

          <h2 id="catalog">3. Catalogue des farines</h2>
          <h3>Types de catalogues</h3>
          <p>
            CarpBait Pro propose plusieurs types de catalogues selon votre niveau d'abonnement :
          </p>
          <ul>
            <li><strong>Catalogue Démo</strong> : Version limitée accessible à tous les utilisateurs</li>
            <li><strong>Catalogue Public</strong> : Catalogue complet accessible aux abonnés Pro et Enterprise</li>
            <li><strong>Catalogue Enterprise</strong> : Catalogue avancé avec données supplémentaires (abonnés Enterprise)</li>
            <li><strong>Catalogue Privé</strong> : Votre propre catalogue personnalisé (abonnés Enterprise)</li>
          </ul>

          <h3>Exploration du catalogue</h3>
          <p>
            Dans chaque catalogue, vous pouvez :
          </p>
          <ul>
            <li>Rechercher des farines par nom</li>
            <li>Filtrer par catégorie</li>
            <li>Consulter les détails complets de chaque farine</li>
            <li>Voir les propriétés nutritionnelles, mécaniques et enzymatiques</li>
            <li>Consulter les conseils d'utilisation pour chaque farine</li>
          </ul>

          <h3>Détails des farines</h3>
          <p>
            Pour chaque farine, vous pouvez consulter :
          </p>
          <ul>
            <li><strong>Valeurs nutritionnelles</strong> : Protéines, lipides, glucides, etc.</li>
            <li><strong>Composition protéique</strong> : Albumines, globulines, prolamines, glutélines</li>
            <li><strong>Composition enzymatique</strong> : Amylases, protéases, lipases, phytases</li>
            <li><strong>Anti-nutriments</strong> : Niveaux d'acide phytique, tanins, etc.</li>
            <li><strong>Propriétés mécaniques</strong> : Liaison, collant, absorption d'eau</li>
            <li><strong>Conseils d'utilisation</strong> : Ratio recommandé et astuces</li>
          </ul>

          <h2 id="calculator">4. Calculateur de mix</h2>
          <h3>Principes de base</h3>
          <p>
            Le calculateur de mix vous permet de créer des mélanges personnalisés en combinant différentes 
            farines. Pour chaque mélange, vous pouvez :
          </p>
          <ul>
            <li>Sélectionner les farines à inclure</li>
            <li>Définir le pourcentage de chaque farine (le total doit être de 100%)</li>
            <li>Visualiser en temps réel les propriétés nutritionnelles du mélange</li>
            <li>Analyser la composition protéique et enzymatique</li>
            <li>Évaluer les niveaux d'anti-nutriments</li>
          </ul>

          <h3>Création d'un mix</h3>
          <ol>
            <li>Accédez au calculateur depuis le menu principal</li>
            <li>Sélectionnez le catalogue à utiliser (selon votre abonnement)</li>
            <li>Ajoutez les farines une par une en les sélectionnant dans la liste déroulante</li>
            <li>Ajustez les pourcentages à l'aide des curseurs (le total doit être de 100%)</li>
            <li>Consultez les graphiques et analyses qui s'affichent en temps réel</li>
            <li>Une fois satisfait, cliquez sur "Sauvegarder le mix" pour l'enregistrer</li>
          </ol>

          <h3>Analyse des résultats</h3>
          <p>
            Le calculateur vous fournit plusieurs types d'analyses :
          </p>
          <ul>
            <li><strong>Composition du mix</strong> : Graphique en camembert montrant les proportions</li>
            <li><strong>Valeurs nutritionnelles</strong> : Teneurs en protéines, lipides, glucides, etc.</li>
            <li><strong>Composition enzymatique</strong> : Niveaux des différentes enzymes</li>
            <li><strong>Anti-nutriments</strong> : Évaluation des facteurs anti-nutritionnels</li>
          </ul>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg my-4">
            <p className="font-medium text-green-800">Note sur le calcul des anti-nutriments :</p>
            <p className="text-green-700">
              Les valeurs des anti-nutriments sont calculées selon une méthode de pondération basée sur les pourcentages de chaque farine dans le mélange :
            </p>
            <ol className="list-decimal list-inside text-green-700 ml-4">
              <li>Chaque niveau d'anti-nutriment ('low', 'medium', 'high') est converti en valeur numérique (1, 2, 3)</li>
              <li>Pour chaque anti-nutriment, le système multiplie la valeur numérique par le pourcentage de la farine dans le mix, puis divise par 100</li>
              <li>Ces contributions sont additionnées pour toutes les farines du mélange</li>
              <li>La valeur finale est reconvertie en niveau qualitatif selon ces seuils :
                <ul className="list-disc list-inside ml-4">
                    <li>Si valeur {'>'} 2.5: 'high'</li>
                    <li>Si valeur {'>'} 1.5: 'medium'</li>
                    <li>Sinon: 'low'</li>
                </ul>
              </li>
            </ol>
          </div>

          <h3>Sauvegarde et gestion des mix</h3>
          <p>
            Vous pouvez sauvegarder vos mélanges pour les retrouver facilement :
          </p>
          <ul>
            <li>Donnez un nom à votre mélange</li>
            <li>Ajoutez une description (optionnel)</li>
            <li>Ajoutez des tags pour faciliter la recherche</li>
            <li>Consultez, modifiez ou supprimez vos mélanges sauvegardés depuis votre tableau de bord</li>
          </ul>

          <h2 id="account">5. Gestion du compte</h2>
          <h3>Tableau de bord</h3>
          <p>
            Votre espace personnel vous permet de :
          </p>
          <ul>
            <li>Consulter les informations de votre abonnement</li>
            <li>Gérer vos mélanges sauvegardés</li>
            <li>Accéder aux outils spécifiques à votre niveau d'abonnement</li>
            <li>Modifier vos informations personnelles</li>
          </ul>

          <h3>Fonctionnalités Enterprise</h3>
          <p>
            Les abonnés Enterprise bénéficient d'outils supplémentaires :
          </p>
          <ul>
            <li><strong>Gestion du catalogue privé</strong> : Créez et gérez vos propres farines et catégories</li>
            <li><strong>Table Analyzer</strong> : Outil d'analyse et de gestion des données</li>
            <li><strong>Export/Import CSV</strong> : Transférez facilement vos données</li>
          </ul>

          <h2 id="subscriptions">6. Abonnements</h2>
          <h3>Niveaux d'abonnement</h3>
          <p>
            CarpBait Pro propose trois niveaux d'abonnement :
          </p>
          <ul>
            <li><strong>Gratuit</strong> : Accès limité au catalogue et au calculateur</li>
            <li><strong>Pro</strong> : Accès complet au catalogue public et au calculateur avancé</li>
            <li><strong>Enterprise</strong> : Toutes les fonctionnalités Pro + catalogue privé et outils avancés</li>
          </ul>

          <h3>Gestion de l'abonnement</h3>
          <p>
            Pour gérer votre abonnement :
          </p>
          <ol>
            <li>Accédez à la page "Abonnements" depuis le menu principal</li>
            <li>Consultez les différentes options disponibles</li>
            <li>Sélectionnez le plan qui vous convient</li>
            <li>Suivez les instructions pour finaliser votre abonnement</li>
          </ol>
          <p>
            Vous pouvez modifier ou annuler votre abonnement à tout moment depuis votre espace personnel.
          </p>

          <h2 id="blog">7. Blog</h2>
          <h3>Articles et ressources</h3>
          <p>
            Le blog CarpBait Pro propose des articles sur :
          </p>
          <ul>
            <li>Les techniques de conception d'appâts</li>
            <li>Les conseils saisonniers pour la pêche à la carpe</li>
            <li>Les tutoriels d'utilisation du calculateur</li>
            <li>Les nouveautés et mises à jour de l'application</li>
          </ul>

          <h3>Interaction avec le contenu</h3>
          <p>
            Sur le blog, vous pouvez :
          </p>
          <ul>
            <li>Lire les articles complets</li>
            <li>Laisser des commentaires (nécessite une connexion)</li>
            <li>"Liker" les articles que vous appréciez</li>
            <li>Filtrer les articles par catégorie</li>
            <li>Rechercher des articles spécifiques</li>
          </ul>

          <h2 id="faq">8. FAQ</h2>
          <h3>Questions fréquentes</h3>
          <dl>
            <dt>Comment puis-je modifier mon abonnement ?</dt>
            <dd>
              Vous pouvez modifier votre abonnement à tout moment en vous rendant dans la section "Abonnements" 
              de votre espace personnel. Les changements prendront effet à la prochaine période de facturation.
            </dd>

            <dt>Puis-je exporter mes mélanges sauvegardés ?</dt>
            <dd>
              Les abonnés Enterprise peuvent exporter leurs données au format CSV. Cette fonctionnalité 
              n'est pas disponible pour les autres niveaux d'abonnement.
            </dd>

            <dt>Comment créer mon propre catalogue de farines ?</dt>
            <dd>
              La création d'un catalogue privé est une fonctionnalité réservée aux abonnés Enterprise. 
              Accédez à la section "Outils Enterprise" de votre tableau de bord pour commencer.
            </dd>

            <dt>Les valeurs nutritionnelles sont-elles précises ?</dt>
            <dd>
              Toutes les valeurs nutritionnelles et propriétés des farines sont basées sur des données 
              scientifiques et des analyses de laboratoire. Elles sont aussi précises que possible, mais 
              peuvent varier légèrement selon les lots et les fournisseurs.
            </dd>

            <dt>Comment puis-je contribuer au développement de l'application ?</dt>
            <dd>
              Vous pouvez soutenir le développement de CarpBait Pro en faisant un don via la page "Faire un don" 
              ou en souscrivant à un abonnement payant. Vos retours et suggestions sont également précieux !
            </dd>
          </dl>

          <h3>Support</h3>
          <p>
            Pour toute question ou assistance, n'hésitez pas à contacter notre équipe :
          </p>
          <ul>
            <li>Email : contact@carpbaitpro.com</li>
            <li>Via le formulaire de contact sur notre site</li>
          </ul>
          <p>
            Les abonnés Pro et Enterprise bénéficient d'un support prioritaire.
          </p>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              Merci d'utiliser CarpBait Pro ! Nous espérons que cette application vous aidera à créer 
              des appâts parfaits pour vos sessions de pêche à la carpe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserGuide;
