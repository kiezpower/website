-- Migration: Create demo_requests table and demo_email_log table

-- Demo requests from B2B partners / Netzbetreiber
create table if not exists demo_requests (
  id          uuid primary key default gen_random_uuid(),
  company     text not null,
  email       text not null,
  message     text,
  source      text default 'web',
  created_at  timestamptz default now()
);

create index if not exists demo_requests_email_idx on demo_requests (email);
create index if not exists demo_requests_created_idx on demo_requests (created_at desc);

-- Email log for demo request confirmations
create table if not exists demo_email_log (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  company     text not null,
  message     text,
  resend_id   text,
  status      text not null check (status in ('sent','failed','pending')),
  error_msg   text,
  created_at  timestamptz default now()
);

create index if not exists demo_email_log_email_idx on demo_email_log (email);
create index if not exists demo_email_log_created_idx on demo_email_log (created_at desc);

-- Enable RLS
alter table demo_requests enable row level security;
alter table demo_email_log enable row level security;

-- Public can insert demo requests
create policy "Public can insert demo_requests" on demo_requests
  for insert to anon with check (true);

-- Service role has full access
create policy "Service role full access demo_requests" on demo_requests
  for all to service_role using (true) with check (true);

create policy "Service role full access demo_email_log" on demo_email_log
  for all to service_role using (true) with check (true);

-- Grant permissions
grant all on demo_requests to anon, authenticated, service_role;
grant all on demo_email_log to service_role;

-- NOTE: After running this migration, set up a Database Webhook in the Supabase Dashboard:
--   Table: demo_requests
--   Event: INSERT
--   Edge Function: send-demo-email
--   HTTP Payload: { "record": <record> }
