# Laju v3.00 Manual QA Checklist

## Scope
- Collaboration reliability in signed-in cloud mode.
- Metadata durability and isolation (assignee, priority, comments).

## Preconditions
1. Clerk sign-in works on localhost.
2. Supabase migration `002_laju_entry_meta.sql` is applied to active project.
3. App is running at `http://localhost:3000`.

## Checklist
1. Signed-in create/edit/delete/status/follow-up
   - Create one job entry and one freelance entry.
   - Edit title/company/notes and save.
   - Move status in Kanban and Table.
   - Trigger follow-up and verify notice.
   - Delete one test entry.
2. Collaboration metadata roundtrip
   - Open entry detail.
   - Set assignee and priority.
   - Add at least two comments.
   - Reload page and verify assignee/priority/comments persist.
3. Comment search behavior
   - Open Settings > Comment search.
   - Search by comment text.
   - Search by assignee.
   - Search by priority (`high`, `medium`, `low`).
4. Cross-user isolation (manual)
   - User A creates + annotates entry.
   - User B signs in and confirms User A entry is not visible/editable.
   - User B creates separate entry and metadata.
   - User A confirms User B data is not visible/editable.
5. Viewer guard behavior
   - Switch role to `viewer`.
   - Verify write actions are blocked:
     - Add entry
     - Edit entry
     - Status update
     - Follow-up
     - Settings save
     - Metadata updates

## Evidence Capture
- Screenshot set:
  - entry detail with assignee/priority/comments
  - settings comment search results
  - viewer role blocked action notice
- Record pass/fail in `ai/Laju-Build-Status.md`.

## Release Sign-off
1. Product sign-off.
2. Engineering sign-off.
3. Mark v3.00 QA gate as `PASS`.
