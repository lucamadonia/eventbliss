-- Verknüpfe den Affiliate-Eintrag mit dem existierenden User
UPDATE affiliates 
SET user_id = (SELECT id FROM auth.users WHERE email = 'luca@madonia-freiburg.de')
WHERE email = 'luca@madonia-freiburg.de' AND user_id IS NULL;