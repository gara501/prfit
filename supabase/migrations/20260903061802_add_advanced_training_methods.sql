alter table public.routine_exercise_sets
  add column training_method text not null default 'traditional';

alter table public.workout_session_sets
  add column planned_training_method text not null default 'traditional';

alter table public.routine_exercise_sets
  add constraint routine_exercise_sets_training_method_check
  check (training_method in (
    'traditional',
    'max_intensity_1',
    'max_intensity_2',
    'repetitions_1',
    'repetitions_2',
    'repetitions_3',
    'pyramid',
    'pure_concentric',
    'eccentric',
    'max_isometric',
    'total_isometric',
    'static_dynamic',
    'contrast',
    'power_based',
    'dynamic_effort',
    'eccentric_concentric_explosive',
    'plyometric',
    'specific_loads',
    'reactive_strength',
    'strength_endurance',
    'extensive_intervals',
    'intermittent'
  ));

alter table public.workout_session_sets
  add constraint workout_session_sets_planned_training_method_check
  check (planned_training_method in (
    'traditional',
    'max_intensity_1',
    'max_intensity_2',
    'repetitions_1',
    'repetitions_2',
    'repetitions_3',
    'pyramid',
    'pure_concentric',
    'eccentric',
    'max_isometric',
    'total_isometric',
    'static_dynamic',
    'contrast',
    'power_based',
    'dynamic_effort',
    'eccentric_concentric_explosive',
    'plyometric',
    'specific_loads',
    'reactive_strength',
    'strength_endurance',
    'extensive_intervals',
    'intermittent'
  ));

create or replace function public.save_routine_draft(
  p_routine_id uuid,
  p_client_id uuid,
  p_name text,
  p_description text,
  p_start_date date,
  p_end_date date,
  p_days_at_week integer,
  p_exercises jsonb,
  p_effort_metric text,
  p_training_methods jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_routine_id uuid;
  allowed_methods constant text[] := array[
    'traditional', 'max_intensity_1', 'max_intensity_2',
    'repetitions_1', 'repetitions_2', 'repetitions_3', 'pyramid',
    'pure_concentric', 'eccentric', 'max_isometric', 'total_isometric',
    'static_dynamic', 'contrast', 'power_based', 'dynamic_effort',
    'eccentric_concentric_explosive', 'plyometric', 'specific_loads',
    'reactive_strength', 'strength_endurance', 'extensive_intervals',
    'intermittent'
  ];
begin
  if p_training_methods is distinct from p_exercises then
    raise exception 'La prescripción de métodos no coincide con los ejercicios.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_training_methods) as exercise(item)
    cross join lateral jsonb_array_elements(exercise.item -> 'sets') as prescribed_set(item)
    where coalesce(nullif(lower(trim(prescribed_set.item ->> 'training_method')), ''), 'traditional')
      <> all(allowed_methods)
  ) then
    raise exception 'El método de entrenamiento no es válido.' using errcode = '23514';
  end if;

  saved_routine_id := public.save_routine_draft(
    p_routine_id,
    p_client_id,
    p_name,
    p_description,
    p_start_date,
    p_end_date,
    p_days_at_week,
    p_exercises,
    p_effort_metric
  );

  with exercise_items as (
    select
      exercise.item,
      (exercise.item ->> 'day_number')::integer as day_number,
      row_number() over (
        partition by (exercise.item ->> 'day_number')::integer
        order by exercise.ordinality
      ) - 1 as order_index
    from jsonb_array_elements(p_training_methods) with ordinality as exercise(item, ordinality)
  ), prescribed_methods as (
    select
      exercise.day_number,
      exercise.order_index,
      prescribed_set.ordinality::integer as set_number,
      coalesce(
        nullif(lower(trim(prescribed_set.item ->> 'training_method')), ''),
        'traditional'
      ) as training_method
    from exercise_items as exercise
    cross join lateral jsonb_array_elements(exercise.item -> 'sets')
      with ordinality as prescribed_set(item, ordinality)
  )
  update public.routine_exercise_sets as routine_set
  set training_method = prescribed.training_method
  from public.routine_exercises as routine_exercise
  join prescribed_methods as prescribed
    on prescribed.day_number = routine_exercise.day_number
    and prescribed.order_index = routine_exercise.order_index
  where routine_exercise.routine_id = saved_routine_id
    and routine_set.routine_exercise_id = routine_exercise.id
    and routine_set.set_number = prescribed.set_number;

  return saved_routine_id;
end;
$$;

create or replace function public.clone_routine_version(p_source_routine_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  source_routine public.routines%rowtype;
  new_routine_id uuid;
  source_exercise record;
  new_routine_exercise_id uuid;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para crear una nueva versión.' using errcode = '42501';
  end if;

  select * into source_routine
  from public.routines
  where id = p_source_routine_id
    and trainer_id = actor_id
    and status in ('published', 'archived')
  for update;

  if source_routine.id is null then
    raise exception 'Solo puedes versionar un plan publicado o archivado propio.' using errcode = '42501';
  end if;

  if not public.is_active_trainer_of(source_routine.client_id) then
    raise exception 'El cliente ya no está asignado actualmente a este entrenador.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(source_routine.plan_id::text, 0));

  if exists (
    select 1 from public.routines
    where plan_id = source_routine.plan_id and status = 'draft'
  ) then
    raise exception 'Este plan ya tiene un borrador pendiente.' using errcode = '23505';
  end if;

  insert into public.routines (
    plan_id, version_number, status, is_active, supersedes_routine_id,
    client_id, trainer_id, name, description, start_date, end_date,
    days_at_week, effort_metric
  ) values (
    source_routine.plan_id,
    (select max(version_number) + 1 from public.routines where plan_id = source_routine.plan_id),
    'draft', false, source_routine.id, source_routine.client_id, actor_id,
    source_routine.name, source_routine.description, source_routine.start_date,
    source_routine.end_date, source_routine.days_at_week, source_routine.effort_metric
  ) returning id into new_routine_id;

  for source_exercise in
    select id, exercise_id, day_number, order_index, technique_notes
    from public.routine_exercises
    where routine_id = source_routine.id
    order by day_number, order_index
  loop
    insert into public.routine_exercises (
      routine_id, exercise_id, day_number, order_index, technique_notes
    ) values (
      new_routine_id, source_exercise.exercise_id, source_exercise.day_number,
      source_exercise.order_index, source_exercise.technique_notes
    ) returning id into new_routine_exercise_id;

    insert into public.routine_exercise_sets (
      routine_exercise_id, set_number, reps, reps_min, reps_max, rest_seconds,
      weight, target_rir, target_rpe, set_type, training_method, tempo, is_optional
    )
    select
      new_routine_exercise_id, set_number, reps, reps_min, reps_max,
      rest_seconds, weight, target_rir, target_rpe, set_type, training_method,
      tempo, is_optional
    from public.routine_exercise_sets
    where routine_exercise_id = source_exercise.id
    order by set_number;
  end loop;

  return new_routine_id;
end;
$$;

create or replace function public.start_workout_session(
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
      and status = 'published'
      and is_active = true
      and start_date <= current_date
      and (end_date is null or end_date >= current_date)
      and p_day_number between 1 and days_at_week
  ) then
    raise exception 'El plan o el día seleccionado no está disponible.' using errcode = '42501';
  end if;

  select workout_sessions.id into session_id
  from public.workout_sessions
  where client_id = actor_id
    and routine_id = p_routine_id
    and day_number = p_day_number
    and status = 'in_progress'
    and exists (
      select 1 from public.workout_session_sets
      where workout_session_sets.workout_session_id = workout_sessions.id
        and workout_session_sets.completed = false
    )
  order by started_at desc
  limit 1;

  if session_id is not null then
    return session_id;
  end if;

  insert into public.workout_sessions (client_id, routine_id, day_number)
  values (actor_id, p_routine_id, p_day_number)
  returning id into session_id;

  insert into public.workout_session_sets (
    workout_session_id, routine_exercise_id, exercise_id, set_number,
    reps, weight, completed,
    planned_reps_min, planned_reps_max, planned_weight,
    planned_target_rir, planned_target_rpe, planned_set_type,
    planned_training_method, planned_tempo, planned_is_optional
  )
  select
    session_id, routine_exercises.id, routine_exercises.exercise_id,
    routine_exercise_sets.set_number,
    routine_exercise_sets.reps, routine_exercise_sets.weight, false,
    routine_exercise_sets.reps_min, routine_exercise_sets.reps_max,
    routine_exercise_sets.weight, routine_exercise_sets.target_rir,
    routine_exercise_sets.target_rpe, routine_exercise_sets.set_type,
    routine_exercise_sets.training_method, routine_exercise_sets.tempo,
    routine_exercise_sets.is_optional
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

revoke all on function public.save_routine_draft(
  uuid, uuid, text, text, date, date, integer, jsonb, text, jsonb
) from public;
revoke all on function public.save_routine_draft(
  uuid, uuid, text, text, date, date, integer, jsonb, text, jsonb
) from anon;
grant execute on function public.save_routine_draft(
  uuid, uuid, text, text, date, date, integer, jsonb, text, jsonb
) to authenticated;

revoke all on function public.clone_routine_version(uuid) from public;
revoke all on function public.clone_routine_version(uuid) from anon;
grant execute on function public.clone_routine_version(uuid) to authenticated;

revoke all on function public.start_workout_session(uuid, integer) from public;
revoke all on function public.start_workout_session(uuid, integer) from anon;
grant execute on function public.start_workout_session(uuid, integer) to authenticated;
