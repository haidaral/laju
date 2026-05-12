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

## 2026-05-12 Seventh Slice

Current gate: v0.1 tracker build.

## Completed
- Added server-side auth readiness utility in `app/lib/laju-server-boundary.ts`.
- Added explicit API error helper for missing auth in `app/lib/laju-api-contracts.ts`.
- Replaced generic API stubs with boundary-aware responses for:
  - `GET/POST /api/entries`
  - `POST /api/entries/status`
  - `GET /api/export`
- Added `GET /api/auth-readiness` to safely check env configuration without exposing secret values.
- Responses now surface actionable `missingEnvVars` keys when auth/persistence env is incomplete.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `GET /api/auth-readiness`: returns `configured:false` and missing key names.
- `GET /api/entries`: returns `not_configured` with missing key names.
- `POST /api/entries`: returns `not_configured` with missing key names.

## Next Smallest Ticket
Start real auth and persistence wiring:
1. Install Clerk and Supabase server/client packages.
2. Add Clerk middleware and user identity extraction from Clerk session.
3. Add Supabase repository layer and replace `not_configured` placeholders with real CRUD/export.
4. Run two-user isolation QA for RLS before invite rollout.

## 2026-05-12 Eighth Slice

Current gate: v0.1 tracker build.

## Completed
- Installed auth/data packages:
  - `@clerk/nextjs`
  - `@supabase/supabase-js`
  - `@supabase/ssr`
- Aligned React patch versions for Clerk compatibility:
  - `react` `19.1.4`
  - `react-dom` `19.1.4`
- Added `middleware.ts` with protected-route intent for:
  - `/`
  - `/api/entries*`
  - `/api/export*`
- Added safe middleware bypass when Clerk env keys are missing, so local dev does not crash before configuration.
- Updated `app/layout.tsx` to use `ClerkProvider` only when Clerk publishable key exists.
- Updated API user-context resolver to read Clerk server identity first, then local header fallback for controlled local testing.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `GET /`: 200 after clean restart.
- `GET /api/auth-readiness`: returns `configured:false` + missing key names.
- `GET /api/entries`: returns `not_configured` + missing key names.
- Resolved prior runtime failure: `@clerk/backend: Missing publishableKey`.

## Next Smallest Ticket
Add Supabase repository wiring (still behind auth readiness):
1. Build server-side Supabase client helper.
2. Implement `entries` and `activity_log` read/write functions.
3. Replace API placeholder responses with real DB reads/writes under user scope.
4. Keep current fallback behavior untouched until DB path passes QA.

## 2026-05-12 Ninth Slice (v0.18-v0.19)

Current gate: v0.1 tracker build.

## Completed
- Added Supabase server client helper in `app/lib/laju-supabase.ts`.
- Added repository layer in `app/lib/laju-repository.ts` for:
  - list entries + activity log by user.
  - create entry + created activity log.
  - update entry status + status activity log.
  - build server-side CSV output from DB records.
- Replaced API placeholders with real repository calls:
  - `GET /api/entries`
  - `POST /api/entries`
  - `POST /api/entries/status`
  - `GET /api/export`
- Added request validation and structured API error responses:
  - `validation_error`
  - `server_error`
- Kept auth/env boundary behavior intact:
  - routes still return `not_configured` until required env keys are present.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `GET /api/auth-readiness`: returns expected missing env keys.
- `GET /api/entries`: returns `not_configured` when env is incomplete.
- `POST /api/entries/status`: returns `not_configured` when env is incomplete.

## Next Smallest Ticket
Activate live persistence and close v0.2:
1. Populate Clerk/Supabase env keys in `.env.local`.
2. Verify Clerk user id aligns with Supabase RLS expectation (`auth.uid()` claim mapping).
3. Run signed-in API smoke for create/list/status/export against real Supabase.
4. Connect frontend data mode switch from local storage to API-backed mode.

## 2026-05-12 Tenth Slice (toward v0.25)

Current gate: v0.1 tracker build with backend wiring almost complete.

## Completed
- Added backend CRUD parity routes:
  - `PATCH /api/entries/:entryId`
  - `DELETE /api/entries/:entryId`
- Added settings persistence route:
  - `GET /api/settings`
  - `PUT /api/settings`
- Extended repository layer to support:
  - entry detail update.
  - entry delete with activity log event.
  - user settings fetch/upsert.
- Added frontend cloud/local sync indicator in sidebar.
- Added frontend cloud settings persistence wiring in Settings panel.
- Added v0.25 QA gate checklist:
  - `ai/Laju-v0.25-QA-Gate.md`

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- New routes respond safely under missing env:
  - `/api/settings` -> `not_configured`
  - `/api/entries/:entryId` PATCH/DELETE -> `not_configured`

## v0.25 Readiness Status
- Implementation scope: largely complete.
- Live invite gate: `BLOCKED` until real env keys + signed-in two-user QA are executed.

## Remaining to fully close v0.25
1. Set valid Clerk/Supabase env in `.env.local`.
2. Verify Clerk user id mapping vs Supabase RLS claim.
3. Execute two-user QA matrix in `ai/Laju-v0.25-QA-Gate.md`.
4. Fix any discovered auth/RLS edge cases before invite rollout.

## 2026-05-12 Eleventh Slice (v0.25 gate closeout)

Current gate: v0.25 API-level invite readiness.

## Completed
- Set and activated Clerk + Supabase env in local runtime.
- Confirmed auth readiness endpoint reports configured state.
- Fixed middleware for local API QA header pass-through on `/api/*`.
- Added robust not-found behavior for cross-user mutations:
  - `PATCH/DELETE /api/entries/:entryId` now returns `404` when entry is outside user scope.
- Completed live two-user API QA pass for:
  - create/list/update/status/delete.
  - settings put/get.
  - CSV export.
  - cross-user isolation checks.
- Updated `ai/Laju-v0.25-QA-Gate.md` with PASS evidence.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- Live API QA run:
  - create A/B: `201`.
  - update/status/delete own record: `200`.
  - cross-user patch/delete: `404`.
  - settings persistence and user separation: `200`.
  - export per user: `200`.
  - list isolation: `200` with separated datasets.

## Status
- v0.25 implementation + API QA gate: `PASS`.
- Remaining non-code operational follow-up:
  - run UI-sign-in manual smoke with real Clerk session.
  - rotate exposed secrets after this setup session.

## 2026-05-12 Twelfth Slice (v0.26-v0.30 rollout)

Current gate: v0.26-v0.30 implementation pass before full QA rerun.

## Completed
- Upgraded frontend ID handling for local and cloud entries:
  - `Entry.id` and `ActivityLog` IDs now support `number | string`.
- Added auth-aware frontend controls:
  - topbar sign-in button when signed out.
  - Clerk user menu when signed in.
  - explicit “Sign in required” panel when cloud sync is available.
- Added cloud-first data behavior:
  - load entries/activity from `/api/entries` when signed in and backend is ready.
  - keep local demo fallback when cloud is unavailable or signed out.
  - only persist browser-local state in local mode.
- Wired cloud actions from UI:
  - create entry -> `POST /api/entries`
  - update details -> `PATCH /api/entries/:entryId`
  - update status -> `POST /api/entries/status`
  - delete entry -> `DELETE /api/entries/:entryId`
  - follow-up -> new `POST /api/entries/follow-up`
- Added new route:
  - `app/api/entries/follow-up/route.ts`
- Tightened middleware behavior:
  - local API header bypass only in non-production mode.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- Live API smoke:
  - create entry: `201`
  - follow-up endpoint: `200`
  - delete entry: `200`

## Next
Run full end-to-end QA again for v0.26-v0.30:
1. Signed-in browser flow checks on localhost.
2. Two-user API isolation regression.
3. Settings + reminder behavior consistency in cloud mode.

## 2026-05-12 Thirteenth Slice (v0.31-v0.40 readiness scaffolding)

Current gate: v0.31-v0.40 implementation before full QA rerun.

## Completed
- Improved cloud-mode UX state handling:
  - cloud mode now activates when backend is configured.
  - sign-in-required panel shows clearly for signed-out users.
  - cloud data loading/error panel added for signed-in users.
- Added service health endpoint:
  - `GET /api/health` reports auth readiness + DB reachability.
- Added launch readiness checklist:
  - `ai/Laju-v0.40-Launch-Checklist.md`
- Added non-functional release hardening notes into build status cadence.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `GET /api/health`: available for operational checks.

## Remaining
Full QA rerun (browser + API) to validate v0.26-v0.40 end-to-end behavior under real sign-in flow.

## 2026-05-12 Fourteenth Slice (v0.41-v0.45 QA hardening start)

Current gate: v0.41-v0.45 reliability pass.

## Completed
- Added in-app operation notices for cloud actions:
  - create entry
  - update entry
  - update status
  - follow-up
  - save settings
  - delete entry
- Added explicit error notices on non-OK cloud API responses for core write actions.
- Added stricter client-side create-entry validation (minimum title/company length).
- Added on-demand cloud health check control in Settings using `GET /api/health`.
- Added health status messaging states:
  - idle
  - loading
  - ok
  - error
- Added shared notice styling + disabled-button UX states in global styles.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- Build route manifest includes `/api/health` and all entry/settings routes without type errors.

## Next
1. v0.46-v0.50: signed-in browser QA pass and regression checklist execution.
2. Add reproducible QA script for API regression matrix.
3. Close MVP-hardening recommendation gate at v0.50.

## 2026-05-12 Fifteenth Slice (v0.46-v0.50 regression automation)

Current gate: v0.46-v0.50 automated regression baseline.

## Completed
- Added API regression runner:
  - `scripts/qa-api.mjs`
  - covers health, create, status update, follow-up, cross-user protection, settings, export, and delete.
- Added npm script:
  - `npm run qa:api`
- Confirmed known local Next.js dev chunk instability remains an environmental risk, not a route-logic defect.
- Revalidated QA after clean restart cycle (`Stop dev -> delete .next -> restart dev`).

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run qa:api`: passed (against `http://localhost:3000`).
- `GET /api/health`: `200`.

## Notes
- Initial `qa:api` run failed due to local Next dev corruption (`Cannot find module ... webpack-runtime.js`).
- After clean restart cycle, `qa:api` passed end-to-end.

## Next
1. Begin v0.51-v0.60: reminder pipeline improvements + activity filtering/search + export range/filter options.
2. Run signed-in manual browser QA and capture pass evidence for v0.50 hardening gate.

## 2026-05-12 Sixteenth Slice (v0.51-v0.60 operator UX)

Current gate: v0.51-v0.60 operator experience improvements.

## Completed
- Added filtered CSV export in Settings:
  - type filter (`all/job/freelance`)
  - status filter
  - date range (`from/to`)
  - export selection count preview
- Added cloud export query support in API:
  - `GET /api/export?type=&status=&from=&to=`
- Updated repository export function to apply server-side filters before CSV generation.
- Added activity log search/filter in Settings:
  - action filter
  - free-text search over note/action
  - empty-result message

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run qa:api`: passed after clean dev restart cycle.
- `GET /api/health`: `200`.

## Notes
- Initial QA run failed due to recurring local Next dev cache/runtime corruption (`webpack-runtime`/`.next` cache ENOENT). This is environmental and resolved with the established clean restart cycle.

## Next
1. v0.61-v0.70: agent-run monitoring panel + automation retry/failure surfacing.
2. Execute signed-in browser QA for new export and activity filtering behavior.

## 2026-05-12 Seventeenth Slice (v0.61-v0.70 reminder scheduling + ops snapshot)

Current gate: v0.61-v0.70 operations and reminder maturity.

## Completed
- Added reminder snooze system in app state:
  - supports snooze windows (3d, 7d) from reminder queue.
  - excludes snoozed items from active stale queue until snooze date passes.
  - local state persistence for `snoozedUntilMap` in browser mode.
  - activity log events for `snoozed` and `unsnoozed`.
- Added ops snapshot panel in Settings:
  - cloud data status.
  - needs-attention count.
  - snoozed reminder count.
- Added responsive ops panel styling.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run qa:api`: passed after clean local restart cycle.
- `GET /api/health`: `200`.

## Notes
- Recurring local Next.js dev cache/runtime chunk corruption remains present and can produce transient `500` for API routes during QA runs; clean restart cycle continues to resolve.

## Next
1. v0.71-v0.80: multi-workspace data model + saved views + bulk actions.
2. v0.81-v0.90: permission hardening and audit-log enforcement.
3. v0.91-v1.00: launch QA, runbooks, and release-candidate gate.

## 2026-05-12 Eighteenth Slice (v0.71-v0.80 table operations)

Current gate: v0.71-v0.80 operator productivity.

## Completed
- Added table-mode multi-select bulk operations in pipeline view:
  - row-level checkboxes
  - bulk status target selector
  - apply status to selected rows
  - clear selected rows
- Added bulk-update completion notice and selection reset behavior after apply.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run qa:api`: passed after clean local restart cycle.
- `GET /api/health`: `200`.

## Notes
- Local Next.js cache/runtime instability still appears intermittently and was handled using the established restart cycle.

## Next
1. v0.81-v0.90: enforce role boundaries and add audit hardening.
2. v0.91-v1.00: full QA gate, runbooks, and release-candidate sign-off.

## 2026-05-12 Nineteenth Slice (v0.81-v0.90 role boundaries)

Current gate: v0.81-v0.90 access and control hardening.

## Completed
- Added in-app role selector (`owner/member/viewer`).
- Added write-protection enforcement for `viewer` role across:
  - add entry
  - update status
  - follow-up
  - edit/delete entry
  - settings save
  - mode reset and local reset controls
- Added role persistence in local state payload.
- Added role visibility in Settings for operational clarity.

## Verified
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run qa:api`: passed after clean local restart cycle.
- `GET /api/health`: `200`.

## Notes
- Next dev runtime/cache instability remains an environment-level issue and still requires occasional clean restart during QA.

## Next
1. v0.91-v1.00: finalize runbooks/checklists + complete manual signed-in browser QA + release-candidate sign-off.

## 2026-05-12 Twentieth Slice (v0.91-v1.00 release gate prep)

Current gate: v0.91-v1.00 release candidate.

## Completed
- Added v1 release-candidate checklist:
  - `ai/Laju-v1.00-Release-Candidate.md`
- Captured final QA coverage expectations for:
  - functional flows
  - access control
  - API regression
  - operational readiness
  - release sign-off

## Verified
- Checklist file added and aligned to current implemented feature set through v0.90.

## Remaining to declare `v1.0`
1. Execute full signed-in browser manual QA against checklist and capture evidence.
2. Confirm final release sign-offs and tag `v1.0.0`.
