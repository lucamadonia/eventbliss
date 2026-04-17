-- =====================================================================
-- Booking Reminder Cron — sends reminders 24h before booking_date
-- Runs daily at 08:00 UTC via pg_cron → calls the booking-notify Edge Function
-- =====================================================================

-- Enable pg_cron if not already (Supabase Pro+ projects have it pre-enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: every day at 08:00 UTC
-- The Edge Function fetches bookings where booking_date = tomorrow and sends reminder emails.
SELECT cron.schedule(
  'booking-reminder-daily',
  '0 8 * * *',  -- 08:00 UTC daily
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/booking-notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{"type":"reminder"}'::jsonb
    );
  $$
);

COMMENT ON COLUMN cron.job.jobname IS 'booking-reminder-daily: sends 24h-ahead booking reminders via Edge Function at 08:00 UTC';
