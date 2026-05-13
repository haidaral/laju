# Laju v2.00 Release Gate

## Product Scope
1. Fast intake:
   - Quick capture
   - CSV import with duplicate mode
2. Personal productivity:
   - Saved pipeline views
   - Bulk status updates
3. Collaboration:
   - Assignee
   - Priority
   - Comment thread + global comment search
4. Operations:
   - Health checks with timestamp
   - Reminder queue + snooze

## Quality Gates
1. `npm run lint` passes.
2. `npm run build` passes (or documented machine/runtime blocker with mitigation).
3. `npm run qa:api` passes.
4. `npm run qa:ui` passes.

## Manual RC Checklist
1. Signed-in create/edit/delete/status/follow-up flow.
2. Import sample CSV with:
   - `Skip duplicates`
   - `Allow duplicates`
3. Save and load at least two pipeline views.
4. Add entry comments, then validate search in Settings.
5. Switch role to `viewer` and verify write-block behavior.

## Operational Notes
1. If local Next runtime is unstable:
   - stop node process
   - delete `.next`
   - restart dev server
2. Record blocker evidence in `ai/Laju-Build-Status.md`.

## Release Sign-off
1. Product sign-off.
2. Engineering sign-off.
3. Tag release candidate `v2.0.0-rc.1`.
4. Promote to `v2.0.0` after final smoke.
