---
name: laju-supabase-architect
description: Use when designing, reviewing, or implementing Laju Supabase schema, Clerk user mapping, RLS policies, storage buckets, migrations, database queries, or data safety.
---

# Laju Supabase Architect

## Purpose
Keep Laju data safe, simple, and migration-friendly while supporting invite-only multi-user usage from day one.

## MVP Tables
- `entries`
- `activity_log`
- `reminders`
- `user_settings`

## Later Tables
- `profiles`
- `documents`
- `pro_pilots` or `subscriptions`
- `teams`

## Identity Rule
Clerk owns authentication. Supabase rows must store `user_id` as the Clerk user ID unless the implementation introduces a verified mapping layer.

## RLS Rule
Every user-owned table must enforce read/write access where row `user_id` matches the authenticated user. Never ship a table without explicit RLS review.

## Migration Workflow
1. Name the behavior change.
2. Define table/column/index/policy changes.
3. Add migration.
4. Add seed or fixture data if needed.
5. Test CRUD and cross-user isolation.
6. Document rollback risk.

## Storage
- Resumes, portfolios, and generated documents go to Supabase Storage after Phase 5.
- Storage paths must include `user_id`.
- Private buckets by default.

## Output Format
- `Schema change`
- `RLS policy`
- `Query/API impact`
- `Migration steps`
- `Test plan`
- `Rollback note`

## Guardrails
- No public buckets for user documents.
- No profile, resume, or AI output storage before the user has consent and deletion path.
- No two-way sync until conflict behavior is designed.
