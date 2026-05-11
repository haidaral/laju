-- Laju v0.1 persistence contract.
-- Clerk owns auth. API routes should pass Clerk user IDs into `user_id`.

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('job', 'freelance')),
  title text not null,
  company text not null,
  platform text not null default 'Direct',
  url text,
  status text not null,
  currency text not null default 'IDR' check (currency in ('IDR', 'USD')),
  value text,
  location text,
  work_type text not null default 'Remote' check (work_type in ('Remote', 'Hybrid', 'Onsite')),
  notes text not null default '',
  jd_text text,
  fit_score jsonb,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id text not null,
  action text not null check (action in ('created', 'status_change', 'followed_up', 'ghosted', 'note_added', 'score_generated', 'deleted')),
  old_status text,
  new_status text,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  entry_id uuid not null references public.entries(id) on delete cascade,
  snoozed_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id text primary key,
  job_reminder_days integer not null default 14 check (job_reminder_days between 1 and 60),
  freelance_reminder_days integer not null default 7 check (freelance_reminder_days between 1 and 60),
  currency text not null default 'IDR' check (currency in ('IDR', 'USD')),
  ai_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists entries_user_type_status_idx on public.entries(user_id, type, status);
create index if not exists entries_user_last_updated_idx on public.entries(user_id, last_updated);
create index if not exists activity_log_entry_created_idx on public.activity_log(entry_id, created_at desc);
create index if not exists reminders_user_entry_idx on public.reminders(user_id, entry_id);

alter table public.entries enable row level security;
alter table public.activity_log enable row level security;
alter table public.reminders enable row level security;
alter table public.user_settings enable row level security;

-- These policies assume Supabase JWT subject is the same as Clerk user_id.
-- If Clerk uses a custom claim instead, update `auth.uid()::text` to that claim.
create policy "entries are user scoped" on public.entries
  for all using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

create policy "activity log is user scoped" on public.activity_log
  for all using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

create policy "reminders are user scoped" on public.reminders
  for all using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

create policy "settings are user scoped" on public.user_settings
  for all using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);
