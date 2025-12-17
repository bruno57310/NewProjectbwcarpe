-- Modifier le template d'email pour utiliser le bon domaine
-- À exécuter sur votre base Supabase (api.bwcarpe.com)

-- 1. Voir le template actuel
SELECT * FROM auth.email_templates WHERE name = 'recovery';

-- 2. Mettre à jour le template pour utiliser bwcarpe.com
UPDATE auth.email_templates
SET
  subject = 'Reset Your Password',
  body = '<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="https://bwcarpe.com/.netlify/functions/supabase-redirect?token={{ .Token }}&type=recovery">Reset Password</a></p>'
WHERE name = 'recovery';

-- 3. Vérifier que c'est bien mis à jour
SELECT * FROM auth.email_templates WHERE name = 'recovery';
