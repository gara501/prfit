alter table public.routines
  add column effort_metric text not null default 'rir';

alter table public.routines
  add constraint routines_effort_metric_check
  check (effort_metric in ('rir', 'rpe'));

alter table public.routine_exercises
  add column technique_notes text;

alter table public.routine_exercises
  add constraint routine_exercises_technique_notes_length_check
  check (technique_notes is null or char_length(technique_notes) <= 2000);

alter table public.routine_exercise_sets
  add column reps_min integer,
  add column reps_max integer,
  add column target_rir smallint,
  add column target_rpe smallint,
  add column set_type text not null default 'working',
  add column tempo text,
  add column is_optional boolean not null default false;

update public.routine_exercise_sets
set reps_min = reps,
    reps_max = reps
where reps is not null;

alter table public.routine_exercise_sets
  add constraint routine_exercise_sets_reps_min_check
    check (reps_min is null or reps_min > 0),
  add constraint routine_exercise_sets_reps_max_check
    check (reps_max is null or reps_max > 0),
  add constraint routine_exercise_sets_reps_range_check
    check (
      (reps_min is null and reps_max is null)
      or (reps_min is not null and reps_max is not null and reps_min <= reps_max)
    ),
  add constraint routine_exercise_sets_target_rir_check
    check (target_rir is null or target_rir between 0 and 10),
  add constraint routine_exercise_sets_target_rpe_check
    check (target_rpe is null or target_rpe between 1 and 10),
  add constraint routine_exercise_sets_set_type_check
    check (set_type in ('warmup', 'ramp_up', 'working', 'drop_set', 'amrap')),
  add constraint routine_exercise_sets_tempo_check
    check (
      tempo is null
      or (char_length(tempo) between 3 and 16 and tempo ~ '^[0-9Xx-]+$')
    );

alter table public.workout_session_sets
  add column planned_reps_min integer,
  add column planned_reps_max integer,
  add column planned_weight numeric,
  add column planned_target_rir smallint,
  add column planned_target_rpe smallint,
  add column planned_set_type text not null default 'working',
  add column planned_tempo text,
  add column planned_is_optional boolean not null default false,
  add column actual_rir smallint,
  add column actual_rpe smallint,
  add column client_notes text,
  add column deviation_reason text;

update public.workout_session_sets as session_set
set
  planned_reps_min = planned_set.reps_min,
  planned_reps_max = planned_set.reps_max,
  planned_weight = planned_set.weight,
  planned_target_rir = planned_set.target_rir,
  planned_target_rpe = planned_set.target_rpe,
  planned_set_type = planned_set.set_type,
  planned_tempo = planned_set.tempo,
  planned_is_optional = planned_set.is_optional
from public.routine_exercise_sets as planned_set
where planned_set.routine_exercise_id = session_set.routine_exercise_id;

alter table public.workout_session_sets
  add constraint workout_session_sets_planned_reps_range_check
    check (
      (planned_reps_min is null and planned_reps_max is null)
      or (
        planned_reps_min is not null
        and planned_reps_max is not null
        and planned_reps_min > 0
        and planned_reps_max > 0
        and planned_reps_min <= planned_reps_max
      )
    ),
  add constraint workout_session_sets_planned_weight_check
    check (planned_weight is null or planned_weight >= 0),
  add constraint workout_session_sets_planned_target_rir_check
    check (planned_target_rir is null or planned_target_rir between 0 and 10),
  add constraint workout_session_sets_planned_target_rpe_check
    check (planned_target_rpe is null or planned_target_rpe between 1 and 10),
  add constraint workout_session_sets_planned_set_type_check
    check (planned_set_type in ('warmup', 'ramp_up', 'working', 'drop_set', 'amrap')),
  add constraint workout_session_sets_planned_tempo_check
    check (
      planned_tempo is null
      or (char_length(planned_tempo) between 3 and 16 and planned_tempo ~ '^[0-9Xx-]+$')
    ),
  add constraint workout_session_sets_actual_rir_check
    check (actual_rir is null or actual_rir between 0 and 10),
  add constraint workout_session_sets_actual_rpe_check
    check (actual_rpe is null or actual_rpe between 1 and 10),
  add constraint workout_session_sets_client_notes_length_check
    check (client_notes is null or char_length(client_notes) <= 2000),
  add constraint workout_session_sets_deviation_reason_length_check
    check (deviation_reason is null or char_length(deviation_reason) <= 500);

create table public.trainer_client_exercise_notes (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  technical_notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trainer_client_exercise_notes_unique unique (trainer_id, client_id, exercise_id),
  constraint trainer_client_exercise_notes_content_check
    check (char_length(trim(technical_notes)) between 1 and 2000)
);

create index trainer_client_exercise_notes_client_exercise_idx
  on public.trainer_client_exercise_notes (client_id, exercise_id);

alter table public.trainer_client_exercise_notes enable row level security;

grant select, insert, update, delete on public.trainer_client_exercise_notes to authenticated;

create policy "trainer manages assigned client exercise notes"
on public.trainer_client_exercise_notes
for all to authenticated
using (
  trainer_id = (select auth.uid())
  and public.is_active_trainer_of(client_id)
)
with check (
  trainer_id = (select auth.uid())
  and public.is_active_trainer_of(client_id)
);

create policy "client reads own exercise notes"
on public.trainer_client_exercise_notes
for select to authenticated
using (client_id = (select auth.uid()));

create or replace function public.set_trainer_client_exercise_note_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trainer_client_exercise_notes_set_updated_at
before update on public.trainer_client_exercise_notes
for each row
execute function public.set_trainer_client_exercise_note_updated_at();

drop function if exists public.save_routine_draft(uuid, uuid, text, text, date, date, integer, jsonb);

create function public.save_routine_draft(
  p_routine_id uuid,
  p_client_id uuid,
  p_name text,
  p_description text,
  p_start_date date,
  p_end_date date,
  p_days_at_week integer,
  p_exercises jsonb,
  p_effort_metric text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  saved_routine_id uuid;
  new_plan_id uuid;
  exercise_item jsonb;
  set_item jsonb;
  saved_routine_exercise_id uuid;
  set_position integer;
  exercise_id_value uuid;
  day_number_value integer;
  day_order_indexes integer[] := array[0, 0, 0, 0, 0, 0, 0];
  effort_metric_value text := lower(trim(coalesce(p_effort_metric, '')));
  technique_notes_value text;
  client_exercise_note_value text;
  reps_min_value integer;
  reps_max_value integer;
  target_rir_value smallint;
  target_rpe_value smallint;
  set_type_value text;
  tempo_value text;
  weight_value numeric;
  optional_value boolean;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para guardar un borrador.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = actor_id and role = 'trainer' and is_active = true
  ) then
    raise exception 'Solo un entrenador activo puede guardar borradores.' using errcode = '42501';
  end if;

  if not public.is_active_trainer_of(p_client_id) then
    raise exception 'El cliente no está asignado actualmente a este entrenador.' using errcode = '42501';
  end if;

  if effort_metric_value not in ('rir', 'rpe') then
    raise exception 'Selecciona RIR o RPE como escala principal.' using errcode = '23514';
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
    select 1 from jsonb_array_elements(p_exercises) as item
    where coalesce(item ->> 'day_number', '') !~ '^[1-7]$'
      or (item ->> 'day_number')::integer > p_days_at_week
  ) then
    raise exception 'Todos los ejercicios deben pertenecer a un día válido del plan.' using errcode = '23514';
  end if;

  if exists (
    select 1 from generate_series(1, p_days_at_week) as planned_day(day_number)
    where not exists (
      select 1 from jsonb_array_elements(p_exercises) as item
      where (item ->> 'day_number')::integer = planned_day.day_number
    )
  ) then
    raise exception 'Cada día del plan debe tener al menos un ejercicio.' using errcode = '23514';
  end if;

  if p_routine_id is null then
    new_plan_id := gen_random_uuid();
    insert into public.routines (
      plan_id, version_number, status, is_active, client_id, trainer_id,
      name, description, start_date, end_date, days_at_week, effort_metric
    ) values (
      new_plan_id, 1, 'draft', false, p_client_id, actor_id,
      trim(p_name), nullif(trim(coalesce(p_description, '')), ''),
      p_start_date, p_end_date, p_days_at_week, effort_metric_value
    ) returning id into saved_routine_id;
  else
    select id into saved_routine_id
    from public.routines
    where id = p_routine_id and trainer_id = actor_id and status = 'draft'
    for update;

    if saved_routine_id is null then
      raise exception 'Solo se puede editar un borrador propio.' using errcode = '42501';
    end if;

    update public.routines
    set
      client_id = p_client_id,
      name = trim(p_name),
      description = nullif(trim(coalesce(p_description, '')), ''),
      start_date = p_start_date,
      end_date = p_end_date,
      days_at_week = p_days_at_week,
      effort_metric = effort_metric_value
    where id = saved_routine_id;

    delete from public.routine_exercises where routine_id = saved_routine_id;
  end if;

  for exercise_item in select value from jsonb_array_elements(p_exercises)
  loop
    day_number_value := (exercise_item ->> 'day_number')::integer;
    exercise_id_value := (exercise_item ->> 'exercise_id')::uuid;
    technique_notes_value := nullif(trim(coalesce(exercise_item ->> 'technique_notes', '')), '');
    client_exercise_note_value := nullif(trim(coalesce(exercise_item ->> 'client_exercise_note', '')), '');

    if technique_notes_value is not null and char_length(technique_notes_value) > 2000 then
      raise exception 'Las indicaciones del ejercicio no pueden superar 2000 caracteres.' using errcode = '23514';
    end if;

    if client_exercise_note_value is not null and char_length(client_exercise_note_value) > 2000 then
      raise exception 'La nota permanente no puede superar 2000 caracteres.' using errcode = '23514';
    end if;

    if jsonb_typeof(exercise_item -> 'sets') <> 'array'
      or jsonb_array_length(exercise_item -> 'sets') < 1
      or jsonb_array_length(exercise_item -> 'sets') > 20 then
      raise exception 'Cada ejercicio debe tener entre 1 y 20 series.' using errcode = '23514';
    end if;

    insert into public.routine_exercises (
      routine_id, exercise_id, day_number, order_index, technique_notes
    ) values (
      saved_routine_id, exercise_id_value, day_number_value,
      day_order_indexes[day_number_value], technique_notes_value
    ) returning id into saved_routine_exercise_id;

    day_order_indexes[day_number_value] := day_order_indexes[day_number_value] + 1;

    if client_exercise_note_value is null then
      delete from public.trainer_client_exercise_notes
      where trainer_id = actor_id
        and client_id = p_client_id
        and exercise_id = exercise_id_value;
    else
      insert into public.trainer_client_exercise_notes (
        trainer_id, client_id, exercise_id, technical_notes
      ) values (
        actor_id, p_client_id, exercise_id_value, client_exercise_note_value
      ) on conflict (trainer_id, client_id, exercise_id)
      do update set technical_notes = excluded.technical_notes;
    end if;

    set_position := 0;
    for set_item in select value from jsonb_array_elements(exercise_item -> 'sets')
    loop
      set_position := set_position + 1;
      if coalesce(set_item ->> 'reps_min', '') !~ '^[1-9][0-9]*$'
        or coalesce(set_item ->> 'reps_max', '') !~ '^[1-9][0-9]*$' then
        raise exception 'Cada serie debe tener un rango de repeticiones válido.' using errcode = '23514';
      end if;

      reps_min_value := (set_item ->> 'reps_min')::integer;
      reps_max_value := (set_item ->> 'reps_max')::integer;
      if reps_min_value > reps_max_value then
        raise exception 'El mínimo de repeticiones no puede superar el máximo.' using errcode = '23514';
      end if;

      if nullif(set_item ->> 'weight', '') is not null
        and (set_item ->> 'weight') !~ '^(0|[1-9][0-9]*)(\.[0-9]{1,3})?$' then
        raise exception 'El peso debe ser un número no negativo de hasta tres decimales.' using errcode = '23514';
      end if;
      weight_value := nullif(set_item ->> 'weight', '')::numeric;

      set_type_value := coalesce(nullif(lower(trim(set_item ->> 'set_type')), ''), 'working');
      if set_type_value not in ('warmup', 'ramp_up', 'working', 'drop_set', 'amrap') then
        raise exception 'El tipo de serie no es válido.' using errcode = '23514';
      end if;

      tempo_value := nullif(upper(trim(coalesce(set_item ->> 'tempo', ''))), '');
      if tempo_value is not null
        and (char_length(tempo_value) not between 3 and 16 or tempo_value !~ '^[0-9X-]+$') then
        raise exception 'El tempo debe usar números, X y guiones.' using errcode = '23514';
      end if;

      target_rir_value := nullif(set_item ->> 'target_rir', '')::smallint;
      target_rpe_value := nullif(set_item ->> 'target_rpe', '')::smallint;
      if target_rir_value is not null and target_rir_value not between 0 and 10 then
        raise exception 'El RIR objetivo debe estar entre 0 y 10.' using errcode = '23514';
      end if;
      if target_rpe_value is not null and target_rpe_value not between 1 and 10 then
        raise exception 'El RPE objetivo debe estar entre 1 y 10.' using errcode = '23514';
      end if;
      if (effort_metric_value = 'rir' and target_rpe_value is not null)
        or (effort_metric_value = 'rpe' and target_rir_value is not null) then
        raise exception 'Cada plan solo puede usar su escala principal de esfuerzo.' using errcode = '23514';
      end if;

      optional_value := coalesce((set_item ->> 'is_optional')::boolean, false);

      insert into public.routine_exercise_sets (
        routine_exercise_id, set_number, reps, reps_min, reps_max, rest_seconds,
        weight, target_rir, target_rpe, set_type, tempo, is_optional
      ) values (
        saved_routine_exercise_id, set_position, reps_max_value,
        reps_min_value, reps_max_value,
        nullif(set_item ->> 'rest_seconds', '')::integer,
        weight_value, target_rir_value, target_rpe_value,
        set_type_value, tempo_value, optional_value
      );
    end loop;
  end loop;

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
      weight, target_rir, target_rpe, set_type, tempo, is_optional
    )
    select
      new_routine_exercise_id, set_number, reps, reps_min, reps_max,
      rest_seconds, weight, target_rir, target_rpe, set_type, tempo, is_optional
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
    workout_session_id, routine_exercise_id, exercise_id, set_number,
    reps, weight, completed,
    planned_reps_min, planned_reps_max, planned_weight,
    planned_target_rir, planned_target_rpe, planned_set_type,
    planned_tempo, planned_is_optional
  )
  select
    session_id, routine_exercises.id, routine_exercises.exercise_id,
    routine_exercise_sets.set_number,
    routine_exercise_sets.reps, routine_exercise_sets.weight, false,
    routine_exercise_sets.reps_min, routine_exercise_sets.reps_max,
    routine_exercise_sets.weight, routine_exercise_sets.target_rir,
    routine_exercise_sets.target_rpe, routine_exercise_sets.set_type,
    routine_exercise_sets.tempo, routine_exercise_sets.is_optional
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

revoke all on function public.save_routine_draft(uuid, uuid, text, text, date, date, integer, jsonb, text) from public;
revoke all on function public.save_routine_draft(uuid, uuid, text, text, date, date, integer, jsonb, text) from anon;
grant execute on function public.save_routine_draft(uuid, uuid, text, text, date, date, integer, jsonb, text) to authenticated;

revoke all on function public.clone_routine_version(uuid) from public;
revoke all on function public.clone_routine_version(uuid) from anon;
grant execute on function public.clone_routine_version(uuid) to authenticated;

revoke all on function public.start_workout_session(uuid, integer) from public;
revoke all on function public.start_workout_session(uuid, integer) from anon;
grant execute on function public.start_workout_session(uuid, integer) to authenticated;
