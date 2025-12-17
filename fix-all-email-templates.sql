-- Script pour corriger TOUS les templates d'email Supabase
-- À exécuter directement sur votre base de données Supabase (api.bwcarpe.com)
-- Via psql, pgAdmin, ou l'interface SQL de Supabase Studio

-- =====================================================
-- 1. VOIR LES TEMPLATES ACTUELS
-- =====================================================
SELECT id, name, subject FROM auth.email_templates;

-- =====================================================
-- 2. CORRIGER LE TEMPLATE DE CONFIRMATION (SIGNUP)
-- =====================================================
-- C'est celui qui est utilisé pour confirmer l'inscription
UPDATE auth.email_templates
SET
  subject = 'Confirm Your Email',
  body = '<h2>Bienvenue sur BW Carpe !</h2>
<p>Merci de vous être inscrit. Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
<p><a href="https://bwcarpe.com/auth/callback?token={{ .Token }}&type=signup">Confirmer mon email</a></p>
<p>Ce lien expire dans 24 heures.</p>
<p>Si vous n''avez pas créé de compte, vous pouvez ignorer cet email.</p>'
WHERE name = 'confirmation' OR name = 'confirm' OR name = 'signup';

-- =====================================================
-- 3. CORRIGER LE TEMPLATE DE RÉCUPÉRATION (PASSWORD RESET)
-- =====================================================
UPDATE auth.email_templates
SET
  subject = 'Réinitialiser votre mot de passe',
  body = '<h2>Réinitialisation du mot de passe</h2>
<p>Vous avez demandé à réinitialiser votre mot de passe.</p>
<p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
<p><a href="https://bwcarpe.com/reset-password?code={{ .Token }}">Réinitialiser mon mot de passe</a></p>
<p>Ce lien expire dans 1 heure.</p>
<p>Si vous n''avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>'
WHERE name = 'recovery';

-- =====================================================
-- 4. CORRIGER LE TEMPLATE D'INVITATION (SI EXISTE)
-- =====================================================
UPDATE auth.email_templates
SET
  body = REPLACE(body, 'https://api.bwcarpe.com', 'https://bwcarpe.com')
WHERE name = 'invite' OR name = 'invitation';

-- =====================================================
-- 5. CORRIGER LE TEMPLATE DE CHANGEMENT D'EMAIL (SI EXISTE)
-- =====================================================
UPDATE auth.email_templates
SET
  body = '<h2>Confirmer votre nouvel email</h2>
<p>Vous avez demandé à changer votre adresse email.</p>
<p>Cliquez sur le lien ci-dessous pour confirmer votre nouvel email :</p>
<p><a href="https://bwcarpe.com/auth/callback?token={{ .Token }}&type=email_change">Confirmer le changement</a></p>'
WHERE name = 'email_change';

-- =====================================================
-- 6. CORRIGER LE TEMPLATE DE MAGIC LINK (SI UTILISÉ)
-- =====================================================
UPDATE auth.email_templates
SET
  body = REPLACE(body, 'https://api.bwcarpe.com', 'https://bwcarpe.com')
WHERE name = 'magic_link';

-- =====================================================
-- 7. VÉRIFIER LES MODIFICATIONS
-- =====================================================
SELECT
  name,
  subject,
  CASE
    WHEN body LIKE '%bwcarpe.com%' AND body NOT LIKE '%api.bwcarpe.com%' THEN '✅ Correct'
    WHEN body LIKE '%api.bwcarpe.com%' THEN '❌ Contient encore api.bwcarpe.com'
    ELSE '⚠️ Vérifier manuellement'
  END as status,
  LEFT(body, 100) as body_preview
FROM auth.email_templates
ORDER BY name;

-- =====================================================
-- 8. SI LA TABLE N'EXISTE PAS, UTILISER auth.config
-- =====================================================
-- Certaines versions de Supabase utilisent auth.config au lieu de auth.email_templates
-- Dans ce cas, exécutez ceci :

/*
-- Voir la config actuelle
SELECT * FROM auth.config WHERE parameter = 'mailer_urlpaths_confirmation';
SELECT * FROM auth.config WHERE parameter = 'mailer_urlpaths_recovery';

-- Mettre à jour
UPDATE auth.config
SET value = '"https://bwcarpe.com/auth/callback"'
WHERE parameter = 'mailer_urlpaths_confirmation';

UPDATE auth.config
SET value = '"https://bwcarpe.com/reset-password"'
WHERE parameter = 'mailer_urlpaths_recovery';
*/
