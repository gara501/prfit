-- The client must be able to lock their own scheduled row when starting it.
-- A trigger keeps that narrowly scoped: clients may only skip an open workout,
-- or let the completion trigger mark a genuinely completed linked session.
drop policy if exists "client updates own scheduled workouts"
  on public.scheduled_workouts;
create policy "client updates own scheduled workouts"
on public.scheduled_workouts
for update to authenticated
using (client_id = (select auth.uid()))
with check (client_id = (select auth.uid()));

create or replace function public.guard_client_scheduled_workout_updates()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.client_id = (select auth.uid()) then
    if old.id is distinct from new.id
      or old.routine_id is distinct from new.routine_id
      or old.trainer_id is distinct from new.trainer_id
      or old.client_id is distinct from new.client_id
      or old.day_number is distinct from new.day_number
      or old.scheduled_date is distinct from new.scheduled_date
      or old.notes is distinct from new.notes then
      raise exception 'Un cliente no puede modificar una sesión programada.' using errcode = '42501';
    end if;

    if new.status = 'skipped' and old.status in ('scheduled', 'rescheduled') then
      return new;
    end if;

    if new.status = 'completed'
      and old.status in ('scheduled', 'rescheduled')
      and exists (
        select 1
        from public.workout_sessions as session
        where session.scheduled_workout_id = old.id
          and session.client_id = (select auth.uid())
          and session.status = 'completed'
      ) then
      return new;
    end if;

    raise exception 'El estado de esta sesión programada no se puede cambiar.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists scheduled_workouts_guard_client_updates
  on public.scheduled_workouts;
create trigger scheduled_workouts_guard_client_updates
before update on public.scheduled_workouts
for each row execute function public.guard_client_scheduled_workout_updates();
