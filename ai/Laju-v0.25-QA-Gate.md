# Laju v0.25 QA Gate

## Objective
Close the invite-ready gate with explicit pass/fail checks for auth, data isolation, CRUD behavior, and export correctness.

## Preconditions
- `.env.local` has valid Clerk and Supabase keys.
- Supabase migration `001_laju_v01_schema.sql` is applied.
- At least two test users are available in Clerk.

## Test Matrix

1. User A sign-in baseline
- Sign in as User A.
- Create one job entry and one freelance entry.
- Update status on one entry.
- Update notes/title on one entry.
- Delete one entry.
- Export CSV.

Pass criteria:
- All operations return success codes.
- Activity log rows exist for create, status change, update, delete.
- CSV includes only User A records.

2. User B isolation
- Sign out User A, sign in User B.
- Verify User A entries are not visible.
- Create one entry as User B.
- Export CSV as User B.

Pass criteria:
- User B sees only User B records.
- CSV includes only User B records.

3. Cross-user security check
- As User B, call API with User A entry id for patch/delete.

Pass criteria:
- API denies access or returns not found under user scope.
- No mutation occurs to User A records.

4. Settings persistence
- For User A, change reminder thresholds and currency.
- Reload app and fetch settings again.

Pass criteria:
- Saved settings are returned consistently for the same user.
- User B sees independent settings values.

## Required Endpoints in Scope
- `GET /api/auth-readiness`
- `GET /api/entries`
- `POST /api/entries`
- `PATCH /api/entries/:entryId`
- `DELETE /api/entries/:entryId`
- `POST /api/entries/status`
- `GET /api/export`
- `GET /api/settings`
- `PUT /api/settings`

## Final Gate Result
- `PASS`: all tests above pass with no cross-user leakage.
- `BLOCKED`: env keys missing or migration not applied.
- `FAIL`: any leakage, unauthorized write, or data-loss issue.
