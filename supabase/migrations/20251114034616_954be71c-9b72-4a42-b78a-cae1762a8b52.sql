-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the invoice reminder function to run daily at 9 AM
SELECT cron.schedule(
  'daily-invoice-reminders',
  '0 9 * * *', -- Run at 9 AM every day
  $$
  SELECT
    net.http_post(
      url:='https://vcfivflbzdhbdktpkklg.supabase.co/functions/v1/send-invoice-reminder',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZml2ZmxiemRoYmRrdHBra2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTU3MTMsImV4cCI6MjA3ODM3MTcxM30.mk7A5x2hCJZdjyJXg5kDZ_wgh4yn8ZD5bKSk1BOZEds"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);