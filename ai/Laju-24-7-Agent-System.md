# Laju 24/7 Agent System

## Objective
Build Laju continuously without letting automation create product chaos, security risk, or fake progress.

## Operating Model
Use skills as reusable judgment modules and agents as execution roles.

```text
Build Captain
  -> Product Manager skill decides the next validated task
  -> Engineering Agent implements a scoped slice
  -> QA Agent verifies the core loop
  -> Release Manager prepares deploy decision
  -> Human approves risky actions
```

## Agent Roster

| Agent | Main Job | Human Approval Needed For |
|---|---|---|
| Build Captain | Daily coordination and next-ticket selection | Scope changes, production deploy |
| Engineering Agent | Implements scoped product tickets | Migrations, auth/RLS changes, secrets |
| QA Agent | Tests build and release readiness | Production release signoff |
| Growth Agent | Drafts content and interview assets | Public posts, email sends |
| Ops Agent | Watches health, errors, metrics, blockers | Incidents, billing, data issues |

## Daily Loop
1. Ops Agent checks repository, build status, errors, and validation metrics.
2. Build Captain decides the next smallest task tied to the current PRD gate.
3. Engineering Agent implements the task.
4. QA Agent tests the changed behavior and core loop.
5. Release Manager prepares release notes and rollback note.
6. Human approves deploy or sends it back for fixes.

## Weekly Loop
1. Product Manager reviews validation metrics against the current gate.
2. Growth Agent summarizes user feedback and drafts next outreach.
3. Build Captain updates the build queue.
4. Release Manager prepares a weekly changelog.

## Current Priority Order
1. Build v0.1 tracker.
2. Validate founder usage.
3. Validate invite cohort.
4. Pilot profile and AI scoring.
5. Validate paid intent.
6. Add Stripe.
7. Scale public growth.

## Safe Automation
- Create issues or task lists.
- Draft docs, changelog, help pages, and content.
- Run tests and builds.
- Produce daily status.
- Generate QA checklists.
- Summarize feedback.

## Human Approval Required
- Production deploy.
- Database migration on real user data.
- RLS/auth changes.
- Billing/Stripe changes.
- Public posts or email sends.
- AI cost limit changes.
- Deleting user data.

## First 7 Days Plan

| Day | Focus | Output |
|---|---|---|
| 1 | Repo scaffold and project setup | Next.js skeleton, app shell plan |
| 2 | Auth and database foundation | Clerk/Supabase wiring, MVP schema |
| 3 | Entry CRUD | Add/edit/delete entries, activity log |
| 4 | Pipeline views | Jobs/freelance Kanban and table |
| 5 | Reminders and settings | Stale logic, thresholds, CSV export |
| 6 | Polish and QA | Empty states, loading, validation, core loop test |
| 7 | Invite-ready release | Landing/help/changelog, release notes |

## Build Ticket Template
```markdown
## Ticket
Name:
Phase:
Gate:

## User outcome

## Scope

## Out of scope

## Files/modules likely touched

## Acceptance criteria

## QA checks

## Approval needed
```

## Daily Status Template
```markdown
## Laju Daily Build Status
Date:
Current gate:

## Done

## Blocked

## Next smallest task

## QA result

## Needs human approval
```
