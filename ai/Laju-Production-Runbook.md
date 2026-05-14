# Laju Production Runbook (v4.0)

## 1) Pre-Deploy Checklist
1. Confirm env readiness:
   - Clerk keys present.
   - Supabase URL + service key present.
2. Confirm DB migrations applied:
   - `001_laju_v01_schema.sql`
   - `002_laju_entry_meta.sql`
3. Run quality checks:
   - `npm run lint`
   - `npm run build`
   - `npm run qa:api`
   - `npm run qa:ui`
4. Run strict metadata QA gate:
   - `LAJU_QA_STRICT_META=1 npm run qa:api`

## 2) Deploy Steps
1. Merge `codex/laju-v01-progress` into release branch.
2. Deploy application build.
3. Verify `/api/health` returns auth configured + DB healthy.
4. Smoke signed-in flow:
   - create entry
   - update status
   - follow-up template
   - settings save
   - outbox event visibility

## 3) Post-Deploy Verification
1. Confirm no 5xx spikes in logs.
2. Confirm outbox events are not stuck queued indefinitely.
3. Confirm cross-user isolation with two test users.

## 4) Incident Triage
1. `API 500` on core routes:
   - check `/api/health`
   - check missing env vars
   - check migration state in Supabase
2. Metadata route errors (`/api/entries/:id/meta`):
   - verify `entry_meta` exists
   - verify RLS policy and user scope
3. UI regression:
   - run `npm run qa:ui`
   - compare with last successful release snapshot

## 5) Rollback Criteria
Rollback if any condition holds:
1. Persistent 5xx on create/update/status routes.
2. Cross-user isolation failure.
3. Signed-in core flow cannot complete.

Rollback steps:
1. Revert to last known good release.
2. Re-run health checks.
3. Announce incident summary and ETA for fix.

