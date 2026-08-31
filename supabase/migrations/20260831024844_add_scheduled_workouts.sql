create table public.scheduled_workouts (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 7),
  scheduled_date date not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'skipped', 'rescheduled', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (notes is null or char_length(notes) <= 1000)
);

create unique index scheduled_workouts_client_date_day_idx
  on public.scheduled_workouts (client_id, scheduled_date, day_number)
  where status in ('scheduled', 'rescheduled');
create index scheduled_workouts_client_status_date_idx
  on public.scheduled_workouts (client_id, status, scheduled_date desc);

alter table public.workout_sessions
  add column scheduled_workout_id uuid references public.scheduled_workouts(id) on delete set null;
create unique index workout_sessions_scheduled_workout_id_idx
  on public.workout_sessions (scheduled_workout_id)
  where scheduled_workout_id is not null;

alter table public.scheduled_workouts enable row level security;
grant select, insert, update on public.scheduled_workouts to authenticated;

create policy "client reads own scheduled workouts"
on public.scheduled_workouts for select to authenticated
using (client_id = (select auth.uid()));
create policy "trainer reads assigned scheduled workouts"
on public.scheduled_workouts for select to authenticated
using (public.is_active_trainer_of(client_id));
create policy "trainer schedules own client workouts"
on public.scheduled_workouts for insert to authenticated
with check (
  trainer_id = (select auth.uid())
  and public.is_active_trainer_of(client_id)
  and exists (select 1 from public.routines where id = routine_id and trainer_id = (select auth.uid()) and client_id = scheduled_workouts.client_id and status = 'published')
);
create policy "trainer updates assigned scheduled workouts"
on public.scheduled_workouts for update to authenticated
using (public.is_active_trainer_of(client_id))
with check (trainer_id = (select auth.uid()) and public.is_active_trainer_of(client_id));

create or replace function public.set_scheduled_workout_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger scheduled_workouts_updated_at before update on public.scheduled_workouts
for each row execute function public.set_scheduled_workout_updated_at();

create or replace function public.start_scheduled_workout(p_scheduled_workout_id uuid)
returns uuid language plpgsql security invoker set search_path = public as $$
declare schedule public.scheduled_workouts%rowtype; session_id uuid;
begin
  select * into schedule from public.scheduled_workouts where id = p_scheduled_workout_id and client_id = auth.uid() and status in ('scheduled','rescheduled') for update;
  if schedule.id is null then raise exception 'La sesión programada no está disponible.' using errcode = '42501'; end if;
  session_id := public.start_workout_session(schedule.routine_id, schedule.day_number);
  update public.workout_sessions set scheduled_workout_id = schedule.id where id = session_id and client_id = auth.uid();
  return session_id;
end; $$;

create or replace function public.skip_scheduled_workout(p_scheduled_workout_id uuid)
returns uuid language plpgsql security invoker set search_path = public as $$
declare changed_id uuid;
begin
  update public.scheduled_workouts set status = 'skipped' where id = p_scheduled_workout_id and client_id = auth.uid() and status in ('scheduled','rescheduled') returning id into changed_id;
  if changed_id is null then raise exception 'La sesión programada no puede omitirse.' using errcode = '42501'; end if;
  return changed_id;
end; $$;

create or replace function public.complete_linked_scheduled_workout()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.status = 'completed' and old.status = 'in_progress' and new.scheduled_workout_id is not null then
    update public.scheduled_workouts set status = 'completed' where id = new.scheduled_workout_id and status in ('scheduled','rescheduled');
  end if;
  return new;
end; $$;
create trigger workout_sessions_complete_linked_schedule after update on public.workout_sessions
for each row execute function public.complete_linked_scheduled_workout();

revoke all on function public.start_scheduled_workout(uuid) from public;
revoke all on function public.start_scheduled_workout(uuid) from anon;
grant execute on function public.start_scheduled_workout(uuid) to authenticated;
revoke all on function public.skip_scheduled_workout(uuid) from public;
revoke all on function public.skip_scheduled_workout(uuid) from anon;
grant execute on function public.skip_scheduled_workout(uuid) to authenticated;
