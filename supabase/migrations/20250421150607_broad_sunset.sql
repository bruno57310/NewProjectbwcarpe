/*
  # Add initial blog posts and categories

  1. Changes
    - Insert initial blog posts from mock data
    - Ensure categories exist
    - Set up proper relationships between posts and categories
    
  2. Security
    - No changes to RLS policies
    - Uses existing security model
*/

-- First, ensure categories exist
INSERT INTO blog_categories (name, slug, description)
VALUES 
  ('L''appât parfait', 'perfect-bait', 'Articles sur la conception d''appâts parfaits pour la pêche à la carpe'),
  ('Conception d''un mix', 'mix-design', 'Guides et conseils pour créer des mélanges optimaux'),
  ('Calculateur', 'calculator', 'Tutoriels et astuces pour utiliser le calculateur de mix'),
  ('Abonnements', 'subscriptions', 'Informations sur les différents plans d''abonnement')
ON CONFLICT (slug) DO NOTHING;

-- Get admin user ID
DO $$ 
DECLARE
  admin_id uuid;
BEGIN
  -- Get the admin user ID
  SELECT id INTO admin_id FROM auth.users WHERE email = 'bruno_wendling@orange.fr' LIMIT 1;
  
  -- If admin user exists, insert blog posts
  IF admin_id IS NOT NULL THEN
    -- Insert blog posts
    INSERT INTO blog_posts (
      title,
      slug,
      content,
      excerpt,
      author_id,
      category_id,
      tags,
      image_url,
      published,
      featured,
      views_count,
      likes_count,
      created_at,
      updated_at,
      published_at
    )
    VALUES
    (
      'L''appât parfait pour la carpe en été',
      'appat-parfait-carpe-ete',
      '<p>Lorsque les températures montent, les carpes deviennent plus actives et leur métabolisme s''accélère. C''est le moment idéal pour utiliser des appâts riches en protéines et facilement digestibles.</p>
      <p>Les farines de poisson comme la LT94 sont particulièrement efficaces, mais attention à ne pas en abuser car elles peuvent rapidement saturer le spot. Un mix équilibré contenant 30% de farine de poisson, 50% de farines végétales (maïs, soja) et 20% de compléments (graines de chanvre, robin red) donnera d''excellents résultats.</p>
      <p>N''oubliez pas d''adapter la taille de vos bouillettes en fonction de la pression de pêche. Sur les spots très fréquentés, les petites bouillettes de 10-12mm peuvent faire la différence.</p>
      <p>La température de l''eau joue également un rôle crucial dans le choix de vos appâts. Lorsque l''eau dépasse les 20°C, les carpes sont très actives et recherchent activement leur nourriture. C''est le moment d''utiliser des appâts fortement attractifs avec des acides aminés libres qui diffusent rapidement.</p>
      <p>Voici quelques conseils supplémentaires pour optimiser vos appâts en été :</p>
      <ul>
        <li>Privilégiez les bouillettes à dissolution rapide pour une attractivité immédiate</li>
        <li>Utilisez des boosters et des dips pour renforcer l''attractivité</li>
        <li>N''hésitez pas à ajouter des extraits de fruits sucrés comme la fraise ou la banane</li>
        <li>Réduisez la quantité d''amorçage par rapport au printemps ou à l''automne</li>
        <li>Pensez à ajouter des enzymes digestives pour faciliter l''assimilation</li>
      </ul>
      <p>En suivant ces conseils et en utilisant notre calculateur pour optimiser vos mélanges, vous maximiserez vos chances de réussite lors de vos sessions estivales.</p>',
      'Découvrez comment adapter vos appâts pour la pêche estivale et maximiser vos chances de captures.',
      admin_id,
      (SELECT id FROM blog_categories WHERE slug = 'perfect-bait'),
      ARRAY['été', 'protéines', 'bouillettes'],
      'https://images.unsplash.com/photo-1564415900645-55a35c0c6b92?auto=format&fit=crop&q=80',
      true,
      true,
      24,
      24,
      '2025-04-10T14:30:00Z',
      '2025-04-10T14:30:00Z',
      '2025-04-10T14:30:00Z'
    ),
    (
      'Conception d''un mix équilibré pour toutes saisons',
      'conception-mix-equilibre-toutes-saisons',
      '<p>Un mix polyvalent est essentiel pour tout carpiste qui souhaite être efficace tout au long de l''année. La clé réside dans l''équilibre entre les différentes farines et leurs propriétés.</p>
      <p>Pour créer un mix équilibré, commencez par une base de 40% de farines de céréales (blé, maïs, riz) qui apporteront les glucides nécessaires et assureront une bonne tenue. Ajoutez ensuite 30% de protéines (farines de poisson, insectes ou végétales) pour l''attractivité. Complétez avec 20% de farines oléagineuses (soja, chanvre) et 10% d''additifs (épices, poudres d''attractants).</p>
      <p>Utilisez notre calculateur pour affiner les proportions en fonction des propriétés spécifiques de chaque farine. N''oubliez pas que la digestibilité est un facteur crucial pour maintenir les carpes sur votre spot.</p>
      <p>L''avantage d''un mix équilibré est qu''il peut être facilement adapté aux conditions spécifiques en ajustant simplement quelques composants ou en ajoutant des additifs saisonniers. Par exemple, en hiver, vous pourriez augmenter légèrement la proportion de farines hautement digestibles et réduire les éléments plus complexes.</p>
      <p>Voici quelques combinaisons éprouvées pour un mix de base :</p>
      <ul>
        <li>25% farine de maïs + 15% farine de riz + 20% farine de poisson LT94 + 15% farine de soja + 15% farine de chanvre + 10% additifs</li>
        <li>30% semoule de blé + 10% farine d''avoine + 25% farine de crevette + 15% farine de lupin + 10% farine de chanvre + 10% additifs</li>
      </ul>
      <p>Ces proportions peuvent être ajustées en fonction de vos préférences et des conditions de pêche. L''important est de maintenir un équilibre entre les différentes catégories de farines pour assurer à la fois attractivité, valeur nutritive et digestibilité.</p>',
      'Apprenez à créer un mix de base adaptable à toutes les conditions de pêche tout au long de l''année.',
      admin_id,
      (SELECT id FROM blog_categories WHERE slug = 'mix-design'),
      ARRAY['mix', 'équilibre', 'toutes saisons'],
      'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&q=80',
      true,
      false,
      18,
      18,
      '2025-04-05T10:15:00Z',
      '2025-04-06T08:45:00Z',
      '2025-04-05T10:15:00Z'
    ),
    (
      'Optimiser vos mélanges avec notre calculateur',
      'optimiser-melanges-calculateur',
      '<p>Le calculateur de CarpBait Pro est un outil puissant qui vous permet d''analyser précisément la composition nutritionnelle et les propriétés mécaniques de vos mélanges.</p>
      <p>Pour tirer le meilleur parti de cet outil, commencez par définir clairement vos objectifs : recherchez-vous un appât très attractif pour une session courte ou plutôt un mix nutritif pour un amorçage de longue durée ? Ensuite, sélectionnez vos farines en fonction de leurs propriétés spécifiques.</p>
      <p>Le calculateur vous montrera instantanément les valeurs nutritionnelles (protéines, lipides, glucides), la composition protéique détaillée, les propriétés enzymatiques et même les niveaux d''anti-nutriments. Vous pourrez ainsi ajuster les proportions jusqu''à obtenir le mix parfait pour vos conditions de pêche.</p>
      <p>N''hésitez pas à sauvegarder vos créations pour les retrouver facilement lors de vos prochaines sessions.</p>
      <p>Voici comment utiliser efficacement le calculateur :</p>
      <ol>
        <li>Commencez par sélectionner le catalogue approprié (public, enterprise ou privé selon votre abonnement)</li>
        <li>Ajoutez les farines une par une en les sélectionnant dans la liste déroulante</li>
        <li>Ajustez les pourcentages à l''aide des curseurs jusqu''à atteindre un total de 100%</li>
        <li>Analysez les graphiques et les données nutritionnelles qui s''affichent en temps réel</li>
        <li>Portez une attention particulière aux valeurs de protéines, à la composition enzymatique et aux anti-nutriments</li>
        <li>Une fois satisfait de votre mélange, donnez-lui un nom et sauvegardez-le</li>
      </ol>
      <p>Le calculateur vous permet également de comparer différents mélanges côte à côte, ce qui est particulièrement utile pour comprendre l''impact de certaines modifications sur les propriétés globales de votre appât.</p>
      <p>Avec un peu de pratique, vous serez capable de créer des mélanges parfaitement adaptés à chaque situation de pêche, maximisant ainsi vos chances de succès sur les bords de l''eau.</p>',
      'Découvrez comment utiliser efficacement notre calculateur pour créer des mélanges parfaitement adaptés à vos besoins.',
      admin_id,
      (SELECT id FROM blog_categories WHERE slug = 'calculator'),
      ARRAY['calculateur', 'optimisation', 'analyse'],
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80',
      true,
      false,
      32,
      32,
      '2025-04-01T16:20:00Z',
      '2025-04-01T16:20:00Z',
      '2025-04-01T16:20:00Z'
    ),
    (
      'Pourquoi choisir un abonnement Enterprise ?',
      'pourquoi-choisir-abonnement-enterprise',
      '<p>L''abonnement Enterprise de CarpBait Pro offre des fonctionnalités avancées qui transformeront votre approche de la préparation d''appâts pour la pêche à la carpe.</p>
      <p>Avec l''accès au catalogue complet de farines, incluant plus de 100 références détaillées, vous pourrez explorer des combinaisons infinies. La possibilité de créer votre propre catalogue privé est particulièrement utile pour les pêcheurs qui développent leurs propres mélanges secrets.</p>
      <p>L''analyse avancée des propriétés enzymatiques et des anti-nutriments vous permettra de comprendre précisément comment vos appâts interagissent avec l''environnement aquatique et le système digestif des carpes. Ces informations sont cruciales pour maximiser l''efficacité de vos bouillettes en fonction des conditions spécifiques de pêche.</p>
      <p>De plus, l''abonnement Enterprise vous donne accès à des outils d''exportation et d''importation de données, parfaits pour les professionnels qui souhaitent intégrer ces informations dans leurs propres systèmes.</p>
      <p>Voici un aperçu détaillé des fonctionnalités exclusives de l''abonnement Enterprise :</p>
      <ul>
        <li><strong>Catalogue privé</strong> : Créez et gérez votre propre base de données de farines et de mélanges</li>
        <li><strong>Analyse avancée</strong> : Accédez à des données détaillées sur les propriétés enzymatiques et les anti-nutriments</li>
        <li><strong>Export/Import</strong> : Transférez facilement vos données entre différents systèmes</li>
        <li><strong>Partage sécurisé</strong> : Partagez vos recettes avec des collaborateurs spécifiques sans les rendre publiques</li>
        <li><strong>Support prioritaire</strong> : Bénéficiez d''une assistance dédiée pour toutes vos questions</li>
      </ul>
      <p>L''investissement dans un abonnement Enterprise est rapidement rentabilisé par l''efficacité accrue de vos sessions de pêche et la possibilité de développer des appâts véritablement personnalisés et optimisés.</p>
      <p>N''hésitez pas à profiter de notre offre d''essai de 7 jours pour explorer toutes ces fonctionnalités avant de vous engager.</p>',
      'Découvrez les avantages exclusifs de l''abonnement Enterprise et comment il peut révolutionner votre approche des appâts.',
      admin_id,
      (SELECT id FROM blog_categories WHERE slug = 'subscriptions'),
      ARRAY['abonnement', 'enterprise', 'fonctionnalités premium'],
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80',
      true,
      false,
      15,
      15,
      '2025-03-25T09:45:00Z',
      '2025-03-26T11:30:00Z',
      '2025-03-25T09:45:00Z'
    );
  END IF;
END $$;
