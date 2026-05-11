---
name: laju-release-manager
description: Use when preparing Laju releases, deploy readiness checks, migration reviews, changelog entries, rollback plans, production verification, or release notes.
---

# Laju Release Manager

## Purpose
Make every release boring, traceable, and reversible.

## Release Checklist
1. Confirm branch and changed files.
2. Run lint/type/build checks.
3. Run relevant tests.
4. Check migrations and RLS policy changes.
5. Verify env vars are present without printing secrets.
6. Prepare changelog entry.
7. Note rollback path.
8. Require human approval for production deploy.

## Release Types
- `local`: verified locally only.
- `preview`: deployed to preview URL.
- `production`: live user-facing deploy.

## Blocking Conditions
- Failed build.
- Unverified auth/RLS after auth or database changes.
- Missing required env vars.
- Unknown migration rollback risk.
- No QA evidence for the core loop.

## Output Format
- `Release type`
- `Changes`
- `Checks`
- `Risks`
- `Rollback`
- `Decision`

## Guardrails
- Do not deploy production automatically.
- Do not print secrets.
- Do not hide partial failures behind "looks good".
