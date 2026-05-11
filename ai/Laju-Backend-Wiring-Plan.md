# Laju Backend Wiring Plan

## Current State
The app uses browser-local persistence for v0.1 prototype validation. The data model, API contracts, and Supabase schema now exist, but Clerk/Supabase are not wired because credentials are not configured in this workspace.

## Environment Contract
Use `.env.example` as the variable list. Do not commit real secrets.

Required for auth/persistence:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional later:
- `ANTHROPIC_API_KEY`

## Wiring Order
1. Configure Clerk app and Google OAuth.
2. Configure Supabase project.
3. Run `supabase/migrations/001_laju_v01_schema.sql`.
4. Add Supabase server client.
5. Add Clerk auth helper to API routes.
6. Replace 501 route stubs:
   - `GET /api/entries`
   - `POST /api/entries`
   - `POST /api/entries/status`
   - `GET /api/export`
7. Replace localStorage adapter with API-backed adapter.
8. Run RLS isolation test before invite users.

## Safety Checks
- Verify secrets exist without printing values.
- Verify RLS with two test users.
- Verify activity log writes on every status change.
- Verify CSV export only includes current user data.
- Keep localStorage fallback for demo/dev only.
