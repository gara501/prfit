create table public.routine_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text null check (description is null or char_length(description) <= 2000),
  days_at_week integer not null check (days_at_week between 1 and 7),
  effort_metric text not null default 'rir' check (effort_metric in ('rir', 'rpe')),
  definition jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.routine_templates enable row level security;
revoke all on table public.routine_templates from anon;
grant select, insert, update, delete on table public.routine_templates to authenticated;

create policy "trainers manage own routine templates"
on public.routine_templates for all to authenticated
using (trainer_id = (select auth.uid()))
with check (trainer_id = (select auth.uid()));

create index routine_templates_trainer_updated_idx
  on public.routine_templates (trainer_id, updated_at desc);
