alter table public.routine_exercises
  add column day_number smallint not null default 1;

alter table public.routine_exercises
  add constraint routine_exercises_day_number_check
  check (day_number between 1 and 7);

create index routine_exercises_routine_day_order_idx
  on public.routine_exercises (routine_id, day_number, order_index);

alter table public.workout_sessions
  add column day_number smallint not null default 1;

alter table public.workout_sessions
  add constraint workout_sessions_day_number_check
  check (day_number between 1 and 7);

create index workout_sessions_routine_day_idx
  on public.workout_sessions (routine_id, day_number, date desc);

create or replace function public.save_trainer_routine(
  p_routine_id uuid,
  p_client_id uuid,
  p_name text,
  p_description text,
  p_start_date date,
  p_end_date date,
  p_days_at_week integer,
  p_is_active boolean,
  p_exercises jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  saved_routine_id uuid;
  exercise_item jsonb;
  set_item jsonb;
  saved_routine_exercise_id uuid;
  set_position integer;
  exercise_id_value uuid;
  day_number_value integer;
  day_order_indexes integer[] := array[0, 0, 0, 0, 0, 0, 0];
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para guardar un plan.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = actor_id and role = 'trainer' and is_active = true
  ) then
    raise exception 'Solo un entrenador activo puede guardar planes.' using errcode = '42501';
  end if;

  if not public.is_active_trainer_of(p_client_id) then
    raise exception 'El cliente no está asignado actualmente a este entrenador.' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_name, ''))) not between 1 and 120 then
    raise exception 'El nombre debe tener entre 1 y 120 caracteres.' using errcode = '23514';
  end if;

  if p_start_date is null or (p_end_date is not null and p_end_date < p_start_date) then
    raise exception 'El rango de fechas del plan no es válido.' using errcode = '23514';
  end if;

  if p_days_at_week is null or p_days_at_week not between 1 and 7 then
    raise exception 'Los días por semana deben estar entre 1 y 7.' using errcode = '23514';
  end if;

  if jsonb_typeof(p_exercises) <> 'array'
    or jsonb_array_length(p_exercises) < p_days_at_week
    or jsonb_array_length(p_exercises) > 100 then
    raise exception 'Cada día del plan debe tener ejercicios y el total no puede superar 100.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_exercises) as item
    where coalesce(item ->> 'day_number', '') !~ '^[1-7]$'
      or (item ->> 'day_number')::integer > p_days_at_week
  ) then
    raise exception 'Todos los ejercicios deben pertenecer a un día válido del plan.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from generate_series(1, p_days_at_week) as planned_day(day_number)
    where not exists (
      select 1
      from jsonb_array_elements(p_exercises) as item
      where (item ->> 'day_number')::integer = planned_day.day_number
    )
  ) then
    raise exception 'Cada día del plan debe tener al menos un ejercicio.' using errcode = '23514';
  end if;

  if p_routine_id is null then
    insert into public.routines (
      client_id, trainer_id, name, description, start_date, end_date, days_at_week, is_active
    ) values (
      p_client_id, actor_id, trim(p_name), nullif(trim(coalesce(p_description, '')), ''),
      p_start_date, p_end_date, p_days_at_week, coalesce(p_is_active, true)
    ) returning id into saved_routine_id;
  else
    select id into saved_routine_id
    from public.routines
    where id = p_routine_id and trainer_id = actor_id
    for update;

    if saved_routine_id is null then
      raise exception 'El plan no existe o no pertenece a este entrenador.' using errcode = 'P0002';
    end if;

    update public.routines
    set client_id = p_client_id,
      name = trim(p_name),
      description = nullif(trim(coalesce(p_description, '')), ''),
      start_date = p_start_date,
      end_date = p_end_date,
      days_at_week = p_days_at_week,
      is_active = coalesce(p_is_active, true)
    where id = saved_routine_id;

    delete from public.routine_exercises where routine_id = saved_routine_id;
  end if;

  for exercise_item in select value from jsonb_array_elements(p_exercises)
  loop
    day_number_value := (exercise_item ->> 'day_number')::integer;
    exercise_id_value := (exercise_item ->> 'exercise_id')::uuid;

    if jsonb_typeof(exercise_item -> 'sets') <> 'array'
      or jsonb_array_length(exercise_item -> 'sets') < 1
      or jsonb_array_length(exercise_item -> 'sets') > 20 then
      raise exception 'Cada ejercicio debe tener entre 1 y 20 series.' using errcode = '23514';
    end if;

    insert into public.routine_exercises (
      routine_id, exercise_id, day_number, order_index
    ) values (
      saved_routine_id,
      exercise_id_value,
      day_number_value,
      day_order_indexes[day_number_value]
    ) returning id into saved_routine_exercise_id;

    day_order_indexes[day_number_value] := day_order_indexes[day_number_value] + 1;
    set_position := 0;
    for set_item in select value from jsonb_array_elements(exercise_item -> 'sets')
    loop
      set_position := set_position + 1;
      insert into public.routine_exercise_sets (
        routine_exercise_id, set_number, reps, rest_seconds, weight
      ) values (
        saved_routine_exercise_id,
        set_position,
        nullif(set_item ->> 'reps', '')::integer,
        nullif(set_item ->> 'rest_seconds', '')::integer,
        nullif(set_item ->> 'weight', '')::numeric
      );
    end loop;
  end loop;

  return saved_routine_id;
end;
$$;

drop function if exists public.start_workout_session(uuid);

create function public.start_workout_session(
  p_routine_id uuid,
  p_day_number integer
)
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
    raise exception 'Debes iniciar sesión para comenzar un entrenamiento.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = actor_id and role = 'client' and is_active = true
  ) then
    raise exception 'Solo un cliente activo puede iniciar entrenamientos.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(actor_id::text || ':' || p_routine_id::text || ':' || p_day_number::text, 0)
  );

  if not exists (
    select 1 from public.routines
    where id = p_routine_id
      and client_id = actor_id
      and is_active = true
      and start_date <= current_date
      and (end_date is null or end_date >= current_date)
      and p_day_number between 1 and days_at_week
  ) then
    raise exception 'El plan o el día seleccionado no está disponible.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.routine_exercises
    where routine_id = p_routine_id and day_number = p_day_number
  ) then
    raise exception 'Este día todavía no contiene ejercicios.' using errcode = '23514';
  end if;

  select workout_sessions.id into session_id
  from public.workout_sessions
  where client_id = actor_id
    and routine_id = p_routine_id
    and day_number = p_day_number
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

  insert into public.workout_sessions (client_id, routine_id, day_number)
  values (actor_id, p_routine_id, p_day_number)
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
    and routine_exercises.day_number = p_day_number
  order by routine_exercises.order_index, routine_exercise_sets.set_number;

  get diagnostics inserted_sets = row_count;
  if inserted_sets = 0 then
    raise exception 'El día seleccionado no contiene series para ejecutar.' using errcode = '23514';
  end if;

  return session_id;
end;
$$;

revoke all on function public.start_workout_session(uuid, integer) from public;
revoke all on function public.start_workout_session(uuid, integer) from anon;
grant execute on function public.start_workout_session(uuid, integer) to authenticated;
