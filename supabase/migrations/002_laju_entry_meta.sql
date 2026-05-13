-- Laju v2.6+ collaboration metadata persistence.

create table if not exists public.entry_meta (
  entry_id uuid primary key references public.entries(id) on delete cascade,
  user_id text not null,
  assignee text not null default '',
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  comments jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists entry_meta_user_idx on public.entry_meta(user_id);

alter table public.entry_meta enable row level security;

create policy "entry meta is user scoped" on public.entry_meta
  for all using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

