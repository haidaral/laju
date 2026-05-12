# Laju v0.40 Launch Checklist

## Release Candidate Gate
1. `npm run lint` and `npm run build` pass on clean workspace.
2. Local signed-in smoke passes for create, update, status move, follow-up, delete.
3. Two-user API isolation checks pass (`404` on cross-user mutations).
4. Settings and CSV export checks pass for at least two test users.

## Security and Access
1. Rotate Clerk and Supabase secrets used during development sessions.
2. Verify `.env.local` is not tracked by git.
3. Confirm production deployment does not rely on dev-only API header bypass.

## Data and Recovery
1. Confirm Supabase migration baseline exists in target environment.
2. Backup policy confirmed for production schema and data.
3. Rollback plan validated (previous release tag + env rollback).

## Operational Readiness
1. `GET /api/health` returns:
   - auth configured true.
   - db ok true.
2. Known limitations documented for pilot users.
3. Support contact and incident triage path documented.

## Final Sign-off
1. Product sign-off for pilot cohort scope.
2. Engineering sign-off for release candidate.
3. Tag release and announce pilot start window.
