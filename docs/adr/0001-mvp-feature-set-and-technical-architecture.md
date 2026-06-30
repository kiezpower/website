# ADR 0001: MVP Feature Set and Technical Architecture

**Status:** Accepted  
**Date:** 2026-06-30  
**Deciders:** CEO (Christian Roessler), Founding Engineer  

## Context

KiezPower aims to achieve **100 verified waitlist signups by August 31, 2026** for local energy communities (Stromsharing) in Mecklenburg-Vorpommern. The marketing foundation exists: 8,200 Astro pSEO pages + B2B outreach to local solar installers. The waitlist captures **email + PLZ + role (Konsument/Produzent/Beides)** into Supabase.

## Decision

### MVP Feature Set (4 Features)

| # | Feature | Description | Acceptance |
|---|---------|-------------|------------|
| 1 | **Waitlist Capture** | Email + PLZ + Role → Supabase `waitlist` table; duplicate prevention; success toast | 100 signups stored by 2026-08-31 |
| 2 | **PLZ → Netzbetreiber Lookup** | Client-side JSON (2.2 MB) maps PLZ → operator (E.DIS, etc.); shows "Dein Netzbetreiber: X" on confirmation | Instant lookup, zero backend latency |
| 3 | **Waitlist Admin Dashboard** | Protected route (`/admin/warteliste`); shows count, filters by PLZ/role/date; CSV export | CEO can monitor daily signup velocity |
| 4 | **Automated Welcome Email** | Supabase Edge Function + Resend; triggers on insert; includes PLZ, role, estimated rollout timeline | 100% delivery, < 5 min latency |

**Out of scope for MVP:** User accounts, login, community matching, P2P trading, payment, Smart Meter integration, mobile app.

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GITHUB PAGES (Static)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Astro 6     │  │  Tailwind    │  │  Vanilla JS (ESM)    │  │
│  │  (SSG)       │  │  (CDN)       │  │  Waitlist Form       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘  │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           ▼                                     │
│                    ┌──────────────┐                              │
│                    │  Supabase    │                              │
│                    │  (PostgreSQL)│                              │
│                    │  waitlist    │                              │
│                    │  table       │                              │
│                    └──────┬───────┘                              │
│                           │                                      │
│                    ┌──────▼───────┐                              │
│                    │  Edge Fn     │                              │
│                    │  (Deno)      │                              │
│                    │  + Resend    │                              │
│                    └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

**Stack Decisions:**

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Astro 6 (SSG) | Already in repo; 8,200 pSEO pages built; zero JS by default |
| Styling | Tailwind via CDN | No build step; matches existing components |
| Database | Supabase (PostgreSQL) | Already configured; Row Level Security; Edge Functions |
| Email | Resend (via Edge Function) | Transactional, generous free tier, simple API |
| Deployment | GitHub Pages | Free, integrated, automatic on push to main |
| Analytics | Plausible (optional) | Privacy-friendly, lightweight, EU-hosted |

**Data Model (Supabase `waitlist` table):**

```sql
create table waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  plz         char(5) not null,
  role        text not null check (role in ('Konsument','Produzent','Beides')),
  operator    text,               -- filled by PLZ lookup (E.DIS, etc.)
  source      text default 'web', -- 'web' | 'b2b' | 'import'
  created_at  timestamptz default now()
);

create index waitlist_plz_idx on waitlist (plz);
create index waitlist_created_idx on waitlist (created_at desc);
```

**PLZ → Operator Lookup:**  
Static JSON (`/src/data/plz_to_operator.json`, 2.2 MB) loaded client-side in WaitlistForm. On submit, the form enriches payload with `operator` before inserting.

**Admin Dashboard:**  
Protected by Supabase Auth (magic link to CEO email). Route `/admin/warteliste` reads from `waitlist` with RLS policy `select * from waitlist where auth.uid() = 'ceo-user-id'`.

### Consequences

**Positive:**
- Zero infrastructure cost (GitHub Pages + Supabase free tier)
- Sub-100ms form submission (Edge Function warm)
- CEO can self-serve analytics via admin dashboard
- Scales to 10k+ signups without architecture change

**Negative / Risks:**
- 2.2 MB JSON loads on waitlist page → mitigate with `defer` + service worker cache
- No user accounts = no re-engagement email sequence (post-MVP)
- GitHub Pages = no server-side redirects (use client-side for `/admin`)

## Validation

Both CEO and Engineer can state MVP scope in one sentence:

> "KiezPower MVP is a static Astro site with a waitlist form that stores email+PLZ+role in Supabase, shows the local grid operator instantly, sends a welcome email via Edge Function, and gives the CEO an admin dashboard to track 100 signups by August 31."

## Next Steps

1. Implement WaitlistForm → Supabase insert (✅ done in `src/components/WaitlistForm.astro`)
2. Add PLZ → operator enrichment in form submit handler
3. Create Supabase Edge Function `send-welcome-email` + Resend integration
4. Build `/admin/warteliste` page with Auth protection
5. Configure GitHub Pages deployment secrets (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`)
6. Load test with 100 concurrent submissions