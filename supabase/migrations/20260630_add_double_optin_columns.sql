-- Migration: Add double opt-in columns + referrer to waitlist table
-- Run this in Supabase SQL Editor

-- Add referrer column (used for referral tracking)
alter table waitlist add column if not exists referrer text;

-- Add confirmation columns
alter table waitlist add column if not exists confirmed boolean default false;
alter table waitlist add column if not exists confirmation_token text unique;

-- Create index for token lookup
create index if not exists waitlist_token_idx on waitlist (confirmation_token);

-- Update RLS policy: public can update confirmed status via token
create policy "Public can confirm via token" on waitlist
  for update to anon
  using (confirmation_token is not null)
  with check (confirmed = true);

-- Function to confirm waitlist entry by token
create or replace function public.confirm_waitlist_entry(token text)
returns boolean language plpgsql as $$
declare
  updated_count integer;
begin
  update waitlist
  set confirmed = true
  where confirmation_token = token
    and confirmed = false
  returning 1 into updated_count;

  return updated_count > 0;
end $$;

-- Grant execute permission
grant execute on function public.confirm_waitlist_entry(text) to anon, authenticated;
