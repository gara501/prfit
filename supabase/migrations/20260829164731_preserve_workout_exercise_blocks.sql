alter table public.workout_session_sets
  drop constraint workout_session_sets_unique_set;

alter table public.workout_session_sets
  add column routine_exercise_id uuid
    references public.routine_exercises(id)
    on delete set null;

create index workout_session_sets_routine_exercise_id_idx
  on public.workout_session_sets (routine_exercise_id);

alter table public.workout_session_sets
  add constraint workout_session_sets_unique_planned_set unique (
    workout_session_id,
    routine_exercise_id,
    set_number
  );

create or replace function public.start_workout_session(p_routine_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  session_id uuid;
  inserted_sets integer;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para comenzar un entrenamiento.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = actor_id and role = 'client' and is_active = true
  ) then
    raise exception 'Solo un cliente activo puede iniciar entrenamientos.'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(actor_id::text || ':' || p_routine_id::text, 0)
  );

  if not exists (
    select 1 from public.routines
    where id = p_routine_id
      and client_id = actor_id
      and is_active = true
      and start_date <= current_date
      and (end_date is null or end_date >= current_date)
  ) then
    raise exception 'La rutina no está activa o no pertenece a este cliente.'
      using errcode = '42501';
  end if;

  select workout_sessions.id into session_id
  from public.workout_sessions
  where client_id = actor_id
    and routine_id = p_routine_id
    and exists (
      select 1 from public.workout_session_sets
      where workout_session_sets.workout_session_id = workout_sessions.id
        and workout_session_sets.completed = false
    )
  order by date desc
  limit 1;

  if session_id is not null then
    return session_id;
  end if;

  insert into public.workout_sessions (client_id, routine_id)
  values (actor_id, p_routine_id)
  returning id into session_id;

  insert into public.workout_session_sets (
    workout_session_id,
    routine_exercise_id,
    exercise_id,
    set_number,
    reps,
    weight,
    completed
  )
  select
    session_id,
    routine_exercises.id,
    routine_exercises.exercise_id,
    routine_exercise_sets.set_number,
    routine_exercise_sets.reps,
    routine_exercise_sets.weight,
    false
  from public.routine_exercises
  join public.routine_exercise_sets
    on routine_exercise_sets.routine_exercise_id = routine_exercises.id
  where routine_exercises.routine_id = p_routine_id
  order by routine_exercises.order_index, routine_exercise_sets.set_number;

  get diagnostics inserted_sets = row_count;
  if inserted_sets = 0 then
    raise exception 'La rutina no contiene series para ejecutar.'
      using errcode = '23514';
  end if;

  return session_id;
end;
$$;

revoke all on function public.start_workout_session(uuid) from public;
revoke all on function public.start_workout_session(uuid) from anon;
grant execute on function public.start_workout_session(uuid) to authenticated;
