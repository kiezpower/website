-- Migration: Public RPC to expose the total waitlist signup count
-- RLS only allows selecting a caller's own row (by email), so a security
-- definer function is needed to surface an aggregate count without exposing
-- any waitlist rows/PII to anonymous visitors.

create or replace function public.get_waitlist_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from waitlist;
$$;

grant execute on function public.get_waitlist_count() to anon, authenticated;
