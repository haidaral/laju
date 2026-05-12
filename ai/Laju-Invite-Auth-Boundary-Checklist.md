# Laju Invite-Ready Auth Boundary Checklist

## Purpose
Prepare minimum auth and persistence wiring for invite readiness without expanding scope beyond the v0.1 tracker gate.

## In Scope
- Verify required environment variables exist without printing secrets.
- Wire Clerk auth protection for app and API routes.
- Replace local API `501 not_configured` stubs with user-scoped handlers.
- Validate Supabase row-level isolation with two test users.

## Out Of Scope
- AI scoring, profile parsing, or resume generation.
- Stripe or billing workflows.
- Public growth automation and outbound messaging.
- New product surfaces unrelated to tracker retention.

## Preconditions
- `.env.local` contains:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Supabase migration `001_laju_v01_schema.sql` is applied.

## Implementation Checklist
1. Add Clerk middleware and protect dashboard/API routes.
2. Add Supabase server client and user-scoped repository functions.
3. Update:
   - `GET /api/entries`
   - `POST /api/entries`
   - `POST /api/entries/status`
   - `GET /api/export`
4. Keep local storage fallback only for explicit demo mode.
5. Add minimal error states for unauthenticated and misconfigured env.

## QA Checklist
- User A cannot read or modify User B entries.
- CSV export returns only current user records.
- Activity log records status changes and follow-ups per user.
- Dashboard still works in local demo mode when auth is not configured.

## Exit Criteria
- Invite tester can sign in, add/update/delete entries, and export CSV.
- RLS isolation passes for two users.
- No new non-tracker scope is shipped in this slice.
