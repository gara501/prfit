-- Policy DDL needs a short ACCESS EXCLUSIVE lock. Avoid waiting behind a
-- long-lived API request and retry the migration during a quieter window.
set local lock_timeout = '10s';
set local statement_timeout = '60s';

drop policy if exists "trainers manage own routine templates"
on public.routine_templates;

create policy "active trainers select own routine templates"
on public.routine_templates
for select
to authenticated
using (
  trainer_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'trainer'
      and is_active = true
  )
);

create policy "active trainers insert own routine templates"
on public.routine_templates
for insert
to authenticated
with check (
  trainer_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'trainer'
      and is_active = true
  )
);

create policy "active trainers update own routine templates"
on public.routine_templates
for update
to authenticated
using (
  trainer_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'trainer'
      and is_active = true
  )
)
with check (
  trainer_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'trainer'
      and is_active = true
  )
);

create policy "active trainers delete own routine templates"
on public.routine_templates
for delete
to authenticated
using (
  trainer_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'trainer'
      and is_active = true
  )
);
