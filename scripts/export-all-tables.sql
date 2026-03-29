-- ============================================
-- SUPABASE FULL DATABASE EXPORT ALS JSON
-- ============================================
-- Kopiere dieses Skript in den Supabase SQL Editor
-- und führe es aus. Das Ergebnis ist ein JSON mit
-- allen Tabellen und deren Daten.
-- ============================================

SELECT jsonb_pretty(jsonb_build_object(
  'export_date', now()::text,
  'project', 'kqsfifsghvrnemfaxpef',

  'responses', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.responses t),
  'settings', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.settings t),
  'events', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.events t),
  'profiles', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.profiles t),
  'participants', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.participants t),
  'expenses', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.expenses t),
  'expense_shares', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.expense_shares t),
  'schedule_activities', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.schedule_activities t),
  'activity_comments', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.activity_comments t),
  'admin_messages', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.admin_messages t),
  'subscriptions', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.subscriptions t),
  'plan_configs', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.plan_configs t),
  'user_roles', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.user_roles t),
  'user_activity_logs', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.user_activity_logs t),
  'user_feedback', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.user_feedback t),
  'ai_usage', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.ai_usage t),
  'ai_credit_adjustments', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.ai_credit_adjustments t),
  'message_templates', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.message_templates t),
  'newsletter_subscribers', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.newsletter_subscribers t),
  'affiliates', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.affiliates t),
  'affiliate_commissions', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.affiliate_commissions t),
  'affiliate_payouts', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.affiliate_payouts t),
  'affiliate_vouchers', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.affiliate_vouchers t),
  'agency_affiliates', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.agency_affiliates t),
  'agency_interactions', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.agency_interactions t),
  'vouchers', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.vouchers t),
  'voucher_redemptions', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM public.voucher_redemptions t)
));
