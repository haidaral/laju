# Laju Automation Registry

## Active Automations

| Automation | ID | Cadence | Purpose |
|---|---|---|---|
| Laju Daily Build Captain | `laju-daily-build-captain` | Every 24 hours | Daily command-center status, blockers, next task, QA status |
| Laju Weekly Product Gate Review | `laju-weekly-product-gate-review` | Weekly Monday | PRD gate alignment, scope risk, decisions, next tickets |
| Laju Weekly Growth Drafts | `laju-weekly-growth-drafts` | Weekly Friday | LinkedIn draft, invite DM, interview questions, changelog/help suggestions |

## Automation Boundaries

These automations may:
- Inspect local workspace files.
- Inspect git status.
- Review PRD, skill files, and agent specs.
- Produce recommendations, status reports, drafts, and task lists.

These automations must not:
- Deploy production.
- Send public posts, emails, or DMs.
- Change billing or Stripe settings.
- Delete user data.
- Run live user-data migrations.
- Expose secrets.
- Claim unbuilt features are shipped.

## Human Approval Required

Human approval is required before:
- Production deploy.
- Auth or RLS changes.
- Database migration on real user data.
- Billing/Stripe changes.
- Public launch or content publishing.
- Email or DM sending.
- AI cost limit changes.

## Intended Operating Flow

1. Daily Build Captain reports current state and next smallest task.
2. User chooses or approves execution.
3. Codex runs the Engineering Agent behavior in the active thread.
4. QA Agent behavior verifies the build.
5. Release Manager behavior prepares release notes and rollback notes.
6. Human approves any risky production action.
