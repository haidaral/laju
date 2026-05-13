# Laju v3.00 to v4.00 Roadmap

## v3.00 - Collaboration Reliability Release

### Goal
Close collaboration durability and safety gaps so daily team usage is dependable.

### Build Tickets
1. Metadata regression QA (`qa:api`)
   - Assert assignee/priority/comments update roundtrip.
   - Assert cross-user metadata mutation is blocked.
2. Signed-in manual QA evidence
   - Capture proof for add/edit/status/follow-up with collaboration metadata.
   - Capture proof that comment search reflects saved cloud metadata.
3. QA artifacts
   - Update build status with pass/fail evidence and blocker notes.
   - Add release gate checklist for v3.0 sign-off.

### Exit Criteria
- `npm run lint`, `npm run build`, `npm run qa:api`, `npm run qa:ui` pass.
- Metadata roundtrip and user isolation are verified.
- Signed-in manual QA checklist is completed.

## v3.10 - v3.30 Team Operations Foundation

### Build Tickets
1. Workspace/team scope model
   - Introduce team/workspace boundary for shared pipelines.
2. Role model expansion
   - owner/admin/member/viewer with route-level enforcement.
3. Assignment operations
   - “My Tasks” and assignee workload view.

### Exit Criteria
- Team scope and role boundaries validated in API + UI tests.

## v3.40 - v3.60 Workflow Automation

### Build Tickets
1. Rule-based reminders
   - Stage-aware inactivity triggers.
2. Action templates
   - One-click follow-up logging patterns.
3. Bulk policy actions
   - Apply snooze/follow-up/status by filter segments.

### Exit Criteria
- Reminder automation behavior is deterministic and auditable.

## v3.70 - v3.90 Integrations Layer

### Build Tickets
1. Adapter layer for non-CSV inputs.
2. Scheduled export profile support.
3. Webhook/event outbox and retry visibility.

### Exit Criteria
- Inbound/outbound integration health is observable and recoverable.

## v4.00 - MVP+ Operating System Milestone

### Build Tickets
1. Production readiness pack
   - runbook, incident protocol, backup/restore checks.
2. End-to-end release workflow
   - repeatable QA + release sign-off sequence.
3. v4 release gate + versioning artifacts.

### Exit Criteria
- Multi-user + automation + integrations are release-stable.
- v4.0.0 is launch-ready with full operational documentation.
