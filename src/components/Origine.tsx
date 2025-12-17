import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Home, Edit2, Save, X, Image as ImageIcon, Youtube } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface OrigineContent {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function Origine() {
  const [content, setContent] = useState<OrigineContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('origine_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setContent(data);
        setEditedContent(data.content);
        setEditedTitle(data.title);
      } else {
        // If no content exists, create default content
        const defaultContent = {
          title: "L'origine d'un logiciel pour la fabrication d'appâts carpe : partage, écologie et transmission",
          content: `<h2>Introduction</h2>
<p>L'univers de la pêche à la carpe a connu ces dernières années une profonde évolution. Jadis centrée sur des pratiques traditionnelles et le secret 
des recettes jalousement gardées, elle est aujourd'hui marquée par une ouverture progressive vers la compréhension, le partage et l'innovation. 
Cette transformation est au cœur de la création d'un logiciel inédit, dédié à la conception d'appâts pour la carpe. 
Un projet personnel mûri à travers l'expérience, les convictions écologiques, et la volonté de démocratiser un savoir jusqu'ici restreint. 
Cet article est une immersion dans les origines et les raisons qui ont donné naissance à cette initiative, en résonance directe avec la vidéo de la chaîne YouTube de 
Rod Oliver Carp Baits(<a href="https://www.youtube.com/watch?v=c_U70IYXC4I&t=1040s" target="_blank">https://www.youtube.com/watch?v=c_U70IYXC4I&t=1040s</a>), qui a éveillé une motivation profonde et durable.</p>

<h2>1. Une vidéo révélatrice : du constat à l'action</h2>
<p>Dans la vidéo de Rod Oliver Carp Baits, le ton est franc, la critique honnête : le marché de la pêche est saturé de promesses marketing, de recettes toutes faites, 
et de produits parfois inadaptés. On y perçoit une frustration, celle de nombreux pêcheurs passionnés, face à un manque d'accès à l'information réelle et transparente. 
Cette vidéo a résonné comme un appel à sortir du modèle consommateur passif pour redevenir acteur de sa passion.</p>

<p>Le logiciel est né de cette envie : permettre à chaque pêcheur, amateur comme professionnel, de comprendre ce qu'il met dans ses bouillettes, 
de personnaliser ses mélanges, d'adapter ses recettes selon l'environnement, les saisons, le type d'eau ou même les objectifs (amorcage, compétition, session courte ou longue).</p>

<h2>2. Le partage comme fondement</h2>
<p>Au cœur du projet, une valeur essentielle : le partage. Trop souvent, les recettes d'appâts sont gardées secrètes, les connaissances techniques cloisonnées. 
Cette logique a longtemps nourri une forme de concurrence stérile. Or, dans une époque où les communautés en ligne, les blogs, les forums, 
et les réseaux sociaux permettent d'échanger sans frontières, il était temps de créer un outil au service de tous.</p>

<p>Le logiciel devient une plateforme de transmission de savoirs, d'échanges d'idées, d'amélioration continue. 
Il s'adresse autant au débutant qui veut comprendre la fonction des farines qu'au professionnel qui souhaite affiner ses formulations.</p>

<h2>3. Une démarche éco-responsable</h2>
<p>Concevoir un logiciel d'appâts, ce n'est pas seulement optimiser les performances halieutiques. 
C'est aussi s'interroger sur l'impact de ce que nous utilisons. Les farines animales, la surpêche des espèces marines, 
la pollution des eaux : autant de problématiques ignorées par le marketing traditionnel.</p>

<p>Ce logiciel intègre une base de données avec les caractéristiques nutritionnelles, écologiques et fonctionnelles de chaque farine. 
L'utilisateur peut ainsi choisir des alternatives végétales locales, réduire la part de farines controversées, et concevoir des bouillettes plus respectueuses de l'environnement aquatique.</p>

<div class="my-4">
  <img src="https://storage.cloud.google.com/bwcarpe-buckets/Originebwcarpe.png" alt="Graphique circulaire montrant la répartition type d'un mix végétal vs un mix animal" class="rounded-lg shadow-md max-w-full h-auto" />
  <p class="text-sm text-gray-500 mt-2 italic">Illustration 1 : Un graphique circulaire montrant la répartition type d'un mix végétal vs un mix animal selon les critères écologiques</p>
</div>

<h2>4. La compréhension au service de la performance</h2>
<p>La performance en pêche ne passe pas uniquement par l'achat d'un "bon produit". Elle passe par la compréhension : digestion, attractivité, diffusion, équilibre nutritionnel. 
Le logiciel offre une interface simple, mais documentée, où chaque ingrédient est défini selon ses propriétés biochimiques : 
protéines, enzymes, antinutriments, solubilité, prix, impact écologique, etc.</p>

<div class="my-4">
  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80" alt="Tableau comparatif de plusieurs farines" class="rounded-lg shadow-md max-w-full h-auto" />
  <p class="text-sm text-gray-500 mt-2 italic">Illustration 2 : Tableau comparatif de plusieurs farines avec leurs valeurs nutritionnelles et fonctionnalités (absorption, liaison, solubilité...)</p>
</div>

<h2>5. Une communauté ouverte et éducative</h2>
<p>L'ambition va plus loin : créer un blog communautaire lié au logiciel, où chacun pourra partager ses recettes, commenter, documenter ses essais, 
proposer des alternatives locales, etc. Le logiciel devient alors un support d'apprentissage collectif et non un outil fermé. 
Il s'enrichit au fil des retours de terrain, des expériences individuelles, des recettes de saison.</p>

<div class="my-4">
  <img src="https://images.unsplash.com/photo-1564415900645-55a35c0c6b92?auto=format&fit=crop&q=80" alt="Capture d'écran type d'une fiche recette communautaire" class="rounded-lg shadow-md max-w-full h-auto" />
  <p class="text-sm text-gray-500 mt-2 italic">Illustration 3 : Capture d'écran type d'une fiche recette communautaire dans l'application</p>
</div>

<h2>6. Transmettre un savoir durable</h2>
<p>En tant que concepteur d'appâts, ma responsabilité est aussi de transmettre. Transmettre à ceux qui débutent, 
transmettre aux jeunes générations une passion éthique, respectueuse du vivant, intelligente. Ce logiciel est pensé comme un vecteur de cette mission. 
Il traduit une conviction : celle que la pêche doit évoluer vers plus de pédagogie, de compréhension et de respect des écosystèmes.</p>

<div class="my-4">
  <div class="aspect-w-16 aspect-h-9">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/c_U70IYXC4I" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="rounded-lg shadow-md w-full h-64 md:h-96"></iframe>
  </div>
  <p class="text-sm text-gray-500 mt-2 italic">Vidéo de Rod Oliver Carp Baits qui a inspiré ce projet</p>
</div>

<h2>Conclusion</h2>
<p>La création de ce logiciel s'inscrit dans une dynamique globale : celle d'un retour au bon sens, à la transparence, à l'intelligence collective. 
Il répond à une frustration largement partagée, mais propose une réponse constructive : apprendre, créer, partager, évoluer ensemble. 
Inspiré par la vidéo de Rod Oliver Carp Baits, mais aussi par mes valeurs personnelles – écologie, savoir, transmission – il représente une brique dans l'édifice d'une pêche moderne, 
responsable, ouverte et durable. Un outil pour les pêcheurs, par un pêcheur.</p>

<div class="my-4">
  <img src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&q=80" alt="Infographie montrant les étapes de création d'un mix" class="rounded-lg shadow-md max-w-full h-auto" />
  <p class="text-sm text-gray-500 mt-2 italic">Illustration finale : Infographie montrant les étapes de création d'un mix dans le logiciel – de la sélection des farines à la validation du profil nutritionnel</p>
</div>

<p>Et si l'avenir de la pêche à la carpe passait aussi par l'open-source, la co-construction, et l'envie sincère de comprendre ce que l'on fait ?</p>`
        };

        const { data: newData, error: insertError } = await supabase
          .from('origine_content')
          .insert([defaultContent])
          .select()
          .single();

        if (insertError) throw insertError;
        
        setContent(newData);
        setEditedContent(newData.content);
        setEditedTitle(newData.title);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!content) {
        // Create new content
        const { error } = await supabase
          .from('origine_content')
          .insert([{
            title: editedTitle,
            content: editedContent
          }]);
        
        if (error) throw error;
      } else {
        // Update existing content
        const { error } = await supabase
          .from('origine_content')
          .update({
            title: editedTitle,
            content: editedContent
          })
          .eq('id', content.id);
        
        if (error) throw error;
      }
      
      // Refresh content
      await fetchContent();
      setIsEditing(false);
      setSuccess('Contenu sauvegardé avec succès');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving content:', err);
      setError('Erreur lors de la sauvegarde du contenu');
    }
  };

  const handleInsertImage = () => {
    const imageUrl = prompt('Entrez l\'URL de l\'image:');
    if (!imageUrl) return;
    
    const imageAlt = prompt('Entrez une description pour l\'image (alt text):');
    const imageHtml = `
<div class="my-4">
  <img src="${imageUrl}" alt="${imageAlt || ''}" class="rounded-lg shadow-md max-w-full h-auto" />
  <p class="text-sm text-gray-500 mt-2 italic">Description: ${imageAlt || 'Image'}</p>
</div>`;
    
    setEditedContent(prev => prev + imageHtml);
  };

  const handleInsertVideo = () => {
    const videoUrl = prompt('Entrez l\'URL de la vidéo YouTube (format: https://www.youtube.com/watch?v=XXXX):');
    if (!videoUrl) return;
    
    // Extract video ID from YouTube URL
    const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
    
    if (!videoId) {
      alert('URL YouTube invalide. Veuillez entrer une URL au format: https://www.youtube.com/watch?v=XXXX');
      return;
    }
    
    const videoTitle = prompt('Entrez un titre pour la vidéo:');
    const videoHtml = `
<div class="my-4">
  <div class="aspect-w-16 aspect-h-9">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="${videoTitle || 'YouTube video'}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="rounded-lg shadow-md w-full h-64 md:h-96"></iframe>
  </div>
  <p class="text-sm text-gray-500 mt-2 italic">${videoTitle || 'Vidéo YouTube'}</p>
</div>`;
    
    setEditedContent(prev => prev + videoHtml);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
            title="Retour à l'accueil"
          >
            <Home className="w-5 h-5" />
          </Link>
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-3xl font-bold text-green-800 border-b-2 border-green-500 focus:outline-none bg-transparent w-full"
            />
          ) : (
            <h1 className="text-3xl font-bold text-green-800">
              {content?.title || "L'origine du projet"}
            </h1>
          )}
        </div>
        {isAdmin && (
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleInsertImage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Insérer image
                </button>
                <button
                  onClick={handleInsertVideo}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                  Insérer vidéo
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(content?.content || '');
                    setEditedTitle(content?.title || '');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-8">
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-[600px] p-4 border border-gray-300 rounded-lg font-mono text-sm"
          />
        ) : (
          <article className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content?.content || '' }} />
          </article>
        )}
      </div>
    </div>
  );
}

export default Origine;
