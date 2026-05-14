# Laju v4.00 Release Pack

## Scope
- Team operations foundation
- Workflow automation layer
- Integration outbox visibility
- Collaboration metadata persistence path

## Required Quality Gates
1. `npm run lint` passes.
2. `npm run build` passes.
3. `npm run qa:api` passes.
4. `npm run qa:ui` passes.
5. Strict metadata QA passes:
   - `LAJU_QA_STRICT_META=1 npm run qa:api`

## Manual Sign-off Checklist
1. Signed-in end-to-end flow:
   - create/update/status/follow-up/delete
2. Collaboration metadata:
   - assignee/priority/comments persist after reload
3. Cross-user isolation:
   - no data leakage between two users
4. Role controls:
   - viewer write actions blocked
   - owner/admin/member controls behave as expected
5. Reminder automation:
   - preset changes reflected in reminder queue
   - follow-up templates append notes correctly
6. Integration outbox:
   - event generation visible
   - retry single and retry all controls work

## Blocking Conditions
1. `entry_meta` migration not applied.
2. Any 5xx on core CRUD/status/follow-up routes.
3. QA regression in API or UI smoke scripts.

## Release Decision
- `GO` only when all quality gates + manual sign-off are complete.
- Otherwise `NO-GO` with blocker log in `ai/Laju-Build-Status.md`.

