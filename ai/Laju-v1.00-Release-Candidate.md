# Laju v1.00 Release Candidate Checklist

## Functional QA
1. Signed-in create, edit, status move, follow-up, delete all pass.
2. Reminder queue actions pass:
   - follow-up
   - snooze 3d
   - snooze 7d
3. Table bulk status updates pass across at least 3 selected entries.
4. Settings persistence and cloud health check pass.
5. Filtered export pass:
   - type filter
   - status filter
   - date-range filter

## Access Control QA
1. `owner` can perform all write actions.
2. `member` can perform all write actions.
3. `viewer` cannot perform write actions and receives clear error notices.

## API Regression
1. `npm run qa:api` passes.
2. Cross-user mutation protection still returns `404`.
3. `/api/health` returns `auth.configured=true` and `db.ok=true`.

## Operational Readiness
1. `npm run lint` passes.
2. `npm run build` passes.
3. Known local Next dev cache bug workaround documented:
   - stop dev process
   - delete `.next`
   - restart dev server

## Release Sign-off
1. Product sign-off for v1.00 scope.
2. Engineering sign-off with QA evidence links.
3. Tag and announce `v1.0.0-rc.1` then `v1.0.0`.
