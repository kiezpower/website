# MVP Setup Guide — KiezPower Waitlist Infrastructure

## Prerequisites

- [ ] Supabase Dashboard access (https://supabase.com/dashboard/project/xctbktqwpzbnsynofqtu)
- [ ] Supabase Personal Access Token (Settings → API → `service_role` key OR create a PAT)
- [ ] Resend API key (https://resend.com/api-keys)
- [ ] GitHub `gh` CLI authenticated (`gh auth login`)

## Step 1: Run Pending Migrations

The migrations need to be applied in the Supabase Dashboard SQL Editor.

### Migration A — Create email_log table (first migration missing part)

```sql
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

alter table email_log enable row level security;

create policy "Service role full access email_log" on email_log
  for all to service_role using (true) with check (true);

grant all on email_log to service_role;
```

### Migration B — Add double opt-in columns

```sql
alter table waitlist add column if not exists confirmed boolean default false;
alter table waitlist add column if not exists confirmation_token text unique;

create index if not exists waitlist_token_idx on waitlist (confirmation_token);

create policy "Public can confirm via token" on waitlist
  for update to anon
  using (confirmation_token is not null)
  with check (confirmed = true);

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

grant execute on function public.confirm_waitlist_entry(text) to anon, authenticated;
```

### Verify

Run this query to verify all columns exist:
```sql
select column_name, data_type
from information_schema.columns
where table_name = 'waitlist'
order by ordinal_position;
```

Expected: `id`, `email`, `plz`, `role`, `operator`, `source`, `created_at`, `confirmed`, `confirmation_token`, `referrer`

## Step 2: Deploy Edge Function

### Via Supabase CLI (recommended)

```bash
# First, authenticate
supabase login

# Link the project
supabase link --project-ref xctbktqwpzbnsynofqtu

# Deploy the function
supabase functions deploy send-welcome-email --project-ref xctbktqwpzbnsynofqtu
```

### Via Supabase Dashboard

1. Open https://supabase.com/dashboard/project/xctbktqwpzbnsynofqtu/functions
2. Click "Create a new function"
3. Name: `send-welcome-email`
4. Upload the file content from `supabase/functions/send-welcome-email/index.ts`
5. Set environment variables (see Step 3)
6. Deploy

## Step 3: Configure Resend API Key

### Via Supabase CLI

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx --project-ref xctbktqwpzbnsynofqtu
supabase secrets set SUPABASE_URL=https://xctbktqwpzbnsynofqtu.supabase.co --project-ref xctbktqwpzbnsynofqtu
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key> --project-ref xctbktqwpzbnsynofqtu
```

### Via Supabase Dashboard

1. Open https://supabase.com/dashboard/project/xctbktqwpzbnsynofqtu/settings/edge-functions
2. Add secrets:
   - `RESEND_API_KEY` = `re_xxxxxxxxxxxx` (from https://resend.com/api-keys)
   - `SUPABASE_URL` = `https://xctbktqwpzbnsynofqtu.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (from Project Settings → API → service_role key)

## Step 4: Set Up Database Webhook

1. Open https://supabase.com/dashboard/project/xctbktqwpzbnsynofqtu/database/hooks
2. Click "Create a new hook"
3. Configure:
   - **Name**: `Send Welcome Email`
   - **Table**: `waitlist`
   - **Event**: `Insert`
   - **Type**: `HTTP Request`
   - **HTTP Method**: `POST`
   - **URL**: `https://xctbktqwpzbnsynofqtu.functions.supabase.co/send-welcome-email`
   - **Headers**: `Content-Type: application/json`
   - **Auth Method**: `Service Key` (uses the `service_role` key)
4. Click "Confirm"

## Step 5: Configure GitHub Secrets

```bash
gh auth login
gh secret set PUBLIC_SUPABASE_URL --repo kiezpower/website --body "https://xctbktqwpzbnsynofqtu.supabase.co"
gh secret set PUBLIC_SUPABASE_ANON_KEY --repo kiezpower/website --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdGJrdHF3cHpibnN5bm9mcXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODkyNDUsImV4cCI6MjA5NzE2NTI0NX0.ooz9NOtW94AdVgI_2iLSe-pBJJ8q5XWwtKQCheTvZdA"
```

Or in GitHub UI: Settings → Secrets and variables → Actions → New repository secret.

## Verification Checklist

After completing all steps:

- [ ] Run `curl https://xctbktqwpzbnsynofqtu.supabase.co/rest/v1/waitlist?select=confirmed,confirmation_token,referrer` — should return columns (not an error)
- [ ] Submit the waitlist form on the site — check Supabase table `waitlist` for new row
- [ ] Check Supabase Edge Function logs for successful execution
- [ ] Check Resend email logs for sent confirmation email

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20260630_create_waitlist_and_email.sql` | Schema for waitlist + email_log |
| `supabase/migrations/20260630_add_double_optin_columns.sql` | Double opt-in columns + RPC |
| `supabase/functions/send-welcome-email/index.ts` | Edge function to send welcome emails via Resend |
| `supabase/config.toml` | Local Supabase config (already fixed for CLI v2.22.12) |
| `.env.example` | Template for environment variables |
| `.github/workflows/deploy.yml` | GitHub Pages deploy workflow |
