# Laju Build Status

## 2026-05-11

Current gate: v0.1 tracker build.

## Completed
- Created Next.js app scaffold.
- Built operational dashboard first screen.
- Added sidebar navigation for Overview, Jobs, Freelance, Reminders, and Settings.
- Added seeded local entries for job and freelance pipelines.
- Added Kanban and table views.
- Added entry drawer for creation and detail review.
- Added reminder queue and follow-up actions.
- Added settings surface with thresholds, invite whitelist placeholder, and CSV export preview.
- Added ESLint, production build, audit-clean dependency setup, and `.gitignore`.
- Started local dev server at `http://localhost:3000`.

## Verified
- `npm audit --omit=dev`: 0 vulnerabilities.
- `npm run lint`: passed.
- `npm run build`: passed.
- Local endpoint: `http://localhost:3000` returns 200.
- Playwright desktop smoke: overview navigation, Jobs Kanban, Add Entry drawer.
- Playwright mobile smoke: brand, Add Entry, Needs attention section visible.

## Not Yet Built
- Clerk authentication.
- Supabase schema/RLS.
- Persistent storage.
- Real activity log table.
- Real CSV download file.
- Drag-and-drop status movement.
- Public landing/help/changelog pages.

## Next Smallest Ticket
Add persistence architecture:
1. Define Supabase SQL schema for `entries`, `activity_log`, `reminders`, and `user_settings`.
2. Add app data layer interfaces.
3. Keep local sample data as fallback until Clerk/Supabase credentials are configured.

## 2026-05-11 Second Slice

Current gate: v0.1 tracker build.

## Completed
- Added reusable Laju data model in `app/lib/laju-data.ts`.
- Added browser localStorage persistence for entries and activity log.
- Added activity events for created, status change, followed up, and ghosted/lost actions.
- Changed recent activity from inferred entry recency to real activity log events.
- Added real CSV download action in Settings.
- Added local activity log view in Settings.
- Added local data reset control.
- Added Supabase v0.1 schema migration contract in `supabase/migrations/001_laju_v01_schema.sql`.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Playwright persistence smoke: status change writes activity, CSV contains changed entry, localStorage survives reload.

## Not Yet Built
- Clerk authentication.
- Supabase client/API wiring.
- Actual remote persistence against Supabase.
- Drag-and-drop status movement.
- Public landing/help/changelog pages.

## Next Smallest Ticket
Wire auth-ready persistence boundary:
1. Add repository functions for entries/activity using a local adapter first.
2. Add API route shape for future Supabase calls.
3. Add `.env.example` with Clerk/Supabase variable names only, no secrets.

## 2026-05-11 Third Slice

Current gate: v0.1 tracker build.

## Completed
- Added `.env.example` with Clerk, Supabase, and later Anthropic variable names only.
- Added typed API contract helpers in `app/lib/laju-api-contracts.ts`.
- Added route stubs for:
  - `GET /api/entries`
  - `POST /api/entries`
  - `POST /api/entries/status`
  - `GET /api/export`
- Added backend wiring plan in `ai/Laju-Backend-Wiring-Plan.md`.
- Restarted local dev server cleanly after stale Next chunk error.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `GET /api/entries`: returns expected `501 not_configured` JSON.
- Playwright smoke after clean restart: local status update, activity log, CSV preview, and localStorage persistence all pass.

## Next Smallest Ticket
Start Clerk/Supabase wiring after credentials are configured:
1. Verify required env vars exist without printing values.
2. Add Supabase server client.
3. Add Clerk auth middleware and protected app routes.
4. Replace `501 not_configured` route stubs with user-scoped API behavior.

## 2026-05-11 Fourth Slice

Current gate: v0.1 tracker build.

## Completed
- Added editable entry detail drawer.
- Added Save Changes flow for title, company/client, platform, location, currency, work type, value, notes, and status.
- Added Delete Entry flow.
- Added Kanban drag-to-stage behavior using native drag/drop.
- Added activity log events for detail updates and deletes.
- Updated Supabase migration action enum to include `deleted`.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- Playwright CRUD/DnD smoke:
  - edit entry title: passed.
  - drag card from Interview to Offering: passed.
  - delete entry: passed.
  - delete activity log visible: passed.

## Next Smallest Ticket
Build invite-ready public surface:
1. Add `/landing`, `/help`, and `/changelog` or route structure that does not block the operational app.
2. Keep root as operational dashboard during v0.1 local build unless auth redirects are added.
3. Add concise public copy that does not overclaim AI features.

## 2026-05-11 Fifth Slice

Current gate: v0.1 tracker build.

## Completed
- Added invite-ready public surface:
  - `/landing`
  - `/help`
  - `/changelog`
- Added shared `PublicShell` component.
- Added public page styling in `app/public-pages.css`.
- Kept `/` as the operational dashboard for local v0.1 use.
- Kept public copy scoped to tracker, reminders, export, and invite phase. AI is described only as later.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- Playwright public route smoke:
  - `/landing`: heading visible.
  - `/help`: heading visible.
  - `/changelog`: heading visible.
  - mobile `/help`: heading visible.
- Restarted dev server after production build to avoid stale `.next` dev chunks.

## Next Smallest Ticket
Add first-run onboarding inside the app:
1. Empty/demo mode controls.
2. Clear sample-data label.
3. First-entry checklist that supports Gate A founder-use validation.

## 2026-05-12 Sixth Slice

Current gate: v0.1 tracker build.

## Completed
- Added first-run onboarding mode controls in Settings:
  - Empty mode for founder validation.
  - Sample data mode for quick demos.
- Persisted onboarding mode in localStorage with entries and activity log.
- Added sidebar mode label so testers can see whether they are in sample or empty mode.
- Added Gate A progress panel for weekly active-day tracking.
- Added first-run checklist for:
  - first entry created.
  - status moved once.
  - follow-up logged.
  - CSV exported.
- Logged CSV exports into the activity log.
- Added card-level Followed Up action so new empty-mode users can complete onboarding without waiting for stale reminders.
- Added invite/auth boundary checklist in `ai/Laju-Invite-Auth-Boundary-Checklist.md`.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Restarted dev server after production build to avoid stale `.next` dev chunks.
- Playwright onboarding smoke:
  - Empty mode starts with 0 entries.
  - First entry can be created.
  - Empty mode and the new entry persist after reload.
  - Status movement logs checklist progress.
  - Followed Up action logs checklist progress.
  - CSV download logs checklist progress.

## Next Smallest Ticket
Wire invite-ready auth boundary when credentials are available:
1. Verify Clerk and Supabase environment variables exist without printing values.
2. Add Clerk middleware and protected tracker routes.
3. Replace API stubs with Supabase user-scoped CRUD/export behavior.
4. Validate RLS with two test users before inviting testers.
