-- Migration: Fix confirm policy + make confirm function return deterministic boolean

alter table waitlist add column if not exists confirmed boolean default false;
alter table waitlist add column if not exists confirmation_token text unique;

create index if not exists waitlist_token_idx on waitlist (confirmation_token);

drop policy if exists "Public can confirm via token" on waitlist;
create policy "Public can confirm via token" on waitlist
  for update to anon
  using (confirmation_token is not null and confirmed = false)
  with check (confirmed = true);

create or replace function public.confirm_waitlist_entry(token text)
returns boolean
language plpgsql
as $$
begin
  update waitlist
  set confirmed = true
  where confirmation_token = token
    and confirmed = false;

  return found;
end;
$$;

grant execute on function public.confirm_waitlist_entry(text) to anon, authenticated;
