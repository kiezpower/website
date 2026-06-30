-- Migration: Create waitlist table and email_log table
-- Run this in Supabase SQL Editor

-- Waitlist table
create table if not exists waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  plz         char(5) not null,
  role        text not null check (role in ('Konsument','Produzent','Beides')),
  operator    text,
  source      text default 'web',
  created_at  timestamptz default now()
);

create index if not exists waitlist_plz_idx on waitlist (plz);
create index if not exists waitlist_created_idx on waitlist (created_at desc);

-- Email log table for audit trail
create table if not exists email_log (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  plz         char(5) not null,
  role        text not null,
  operator    text,
  resend_id   text,
  status      text not null check (status in ('sent','failed','pending')),
  error_msg   text,
  created_at  timestamptz default now()
);

create index if not exists email_log_email_idx on email_log (email);
create index if not exists email_log_created_idx on email_log (created_at desc);

-- Enable RLS
alter table waitlist enable row level security;
alter table email_log enable row level security;

-- Public can insert into waitlist (for the form)
create policy "Public can insert waitlist" on waitlist
  for insert to anon with check (true);

-- Public can read own waitlist entry (by email)
create policy "Public can read own waitlist" on waitlist
  for select to anon using (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Service role has full access
create policy "Service role full access waitlist" on waitlist
  for all to service_role using (true) with check (true);

create policy "Service role full access email_log" on email_log
  for all to service_role using (true) with check (true);

-- Function to trigger welcome email
create or replace function public.trigger_welcome_email()
returns trigger language plpgsql as $$
begin
  -- Insert into email_log with pending status
  insert into email_log (email, plz, role, operator, status)
  values (new.email, new.plz, new.role, new.operator, 'pending');

  -- Call Edge Function via pg_net (if available) or use Supabase Realtime
  -- For now, we'll use a simple approach: the Edge Function can be called via
  -- a cron job or we use Supabase's database webhooks
  -- This is a placeholder - actual invocation happens via Supabase Dashboard > Database > Webhooks
  return new;
end $$;

-- Trigger on waitlist insert
drop trigger if exists trigger_welcome_email on waitlist;
create trigger trigger_welcome_email
  after insert on waitlist
  for each row execute function public.trigger_welcome_email();

-- Grant permissions
grant usage on schema public to anon, authenticated, service_role;
grant all on waitlist to anon, authenticated, service_role;
grant all on email_log to service_role;