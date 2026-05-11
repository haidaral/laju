---
name: laju-qa-tester
description: Use when testing Laju locally, reviewing builds, writing QA checklists, validating auth, CRUD, Kanban, reminders, exports, responsive layout, or release readiness.
---

# Laju QA Tester

## Test Philosophy
Validate the core loop before polishing edge features:
add entry -> update status -> get reminded -> follow up -> update outcome -> export data.

## MVP Test Matrix
- Auth: sign in, sign out, protected route redirect.
- Entry CRUD: job, freelance, edit, delete, validation.
- Status changes: activity log created every time.
- Kanban: drag status, counts update, terminal columns behave.
- Table: sorting, pagination, inline status change.
- Filters: platform, status, location, work type, currency.
- Reminders: thresholds, snooze, mark followed up, mark ghosted.
- Settings: thresholds, currency, invite whitelist, CSV export.
- RLS: user cannot read or mutate another user's rows.

## Visual QA
- Desktop: 1440x900.
- Laptop: 1366x768.
- Tablet: 768x1024.
- Mobile smoke: 390x844.

## Release Gate
Do not approve release if:
- Auth is broken.
- RLS is unverified after schema changes.
- Entry creation or status update fails.
- CSV export corrupts data.
- User-facing page has overlapping text or unusable controls.

## Output Format
- `Build tested`
- `Checks run`
- `Pass`
- `Fail`
- `Blocking issues`
- `Release decision`

## Guardrails
- Prefer deterministic tests over visual guessing.
- Keep QA evidence: command output, screenshots, or exact failure text.
- Do not mark production-ready if only compile checks passed.
