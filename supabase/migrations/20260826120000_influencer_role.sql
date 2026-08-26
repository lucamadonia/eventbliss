-- =====================================================================
-- Rolle "influencer"
--
-- BEWUSST EINE EIGENE DATEI: Postgres erlaubt nicht, einen mit
-- `ALTER TYPE ... ADD VALUE` hinzugefuegten Enum-Wert in derselben
-- Transaktion auch zu VERWENDEN. Stuende das zusammen mit den Tabellen und
-- ihren Policies in einer Migration, schluege sie beim ersten Lauf fehl.
--
-- Die Rolle verleiht KEIN Premium. Der Zugang eines Influencers kommt aus
-- seinem Abo (subscriptions), nicht aus seiner Rolle — sonst liefe ein
-- Probe-Abo nie ab, weil die Rolle bleibt.
-- =====================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'influencer';
