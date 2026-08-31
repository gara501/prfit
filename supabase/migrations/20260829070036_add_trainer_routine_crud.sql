drop policy if exists "trainer updates routines" on public.routines;

create policy "trainer updates routines" on public.routines
for update to authenticated
using (trainer_id = (select auth.uid()) and is_active_trainer_of(client_id))
with check (trainer_id = (select auth.uid()) and is_active_trainer_of(client_id));

create policy "trainer deletes routines" on public.routines
for delete to authenticated
using (trainer_id = (select auth.uid()) and is_active_trainer_of(client_id));

create policy "trainer deletes routine_exercises" on public.routine_exercises
for delete to authenticated
using (exists (
  select 1 from public.routines
  where routines.id = routine_exercises.routine_id
    and routines.trainer_id = (select auth.uid())
    and is_active_trainer_of(routines.client_id)
));

create policy "trainer deletes routine_exercise_sets" on public.routine_exercise_sets
for delete to authenticated
using (exists (
  select 1
  from public.routine_exercises
  join public.routines on routines.id = routine_exercises.routine_id
  where routine_exercises.id = routine_exercise_sets.routine_exercise_id
    and routines.trainer_id = (select auth.uid())
    and is_active_trainer_of(routines.client_id)
));

create index if not exists routines_trainer_id_idx on public.routines (trainer_id);
create index if not exists routines_client_id_idx on public.routines (client_id);
create index if not exists routine_exercises_routine_id_idx on public.routine_exercises (routine_id);
create index if not exists routine_exercises_exercise_id_idx on public.routine_exercises (exercise_id);
create index if not exists routine_exercise_sets_routine_exercise_id_idx on public.routine_exercise_sets (routine_exercise_id);

alter table public.routines
  add constraint routines_name_length_check check (char_length(trim(name)) between 1 and 120),
  add constraint routines_dates_check check (end_date is null or end_date >= start_date),
  add constraint routines_days_at_week_check check (days_at_week is null or days_at_week between 1 and 7);

alter table public.routine_exercises
  add constraint routine_exercises_order_index_check check (order_index >= 0);

alter table public.routine_exercise_sets
  add constraint routine_exercise_sets_set_number_check check (set_number > 0),
  add constraint routine_exercise_sets_reps_check check (reps is null or reps > 0),
  add constraint routine_exercise_sets_rest_seconds_check check (rest_seconds is null or rest_seconds >= 0),
  add constraint routine_exercise_sets_weight_check check (weight is null or weight >= 0),
  add constraint routine_exercise_sets_number_unique unique (routine_exercise_id, set_number);

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
  exercise_position integer := 0;
  set_position integer;
  exercise_id_value uuid;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para guardar una rutina.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = actor_id and role = 'trainer' and is_active = true
  ) then
    raise exception 'Solo un entrenador activo puede guardar rutinas.' using errcode = '42501';
  end if;

  if not public.is_active_trainer_of(p_client_id) then
    raise exception 'El cliente no está asignado actualmente a este entrenador.' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_name, ''))) not between 1 and 120 then
    raise exception 'El nombre debe tener entre 1 y 120 caracteres.' using errcode = '23514';
  end if;

  if p_start_date is null or (p_end_date is not null and p_end_date < p_start_date) then
    raise exception 'El rango de fechas de la rutina no es válido.' using errcode = '23514';
  end if;

  if p_days_at_week is not null and p_days_at_week not between 1 and 7 then
    raise exception 'Los días por semana deben estar entre 1 y 7.' using errcode = '23514';
  end if;

  if jsonb_typeof(p_exercises) <> 'array'
    or jsonb_array_length(p_exercises) < 1
    or jsonb_array_length(p_exercises) > 50 then
    raise exception 'La rutina debe tener entre 1 y 50 ejercicios.' using errcode = '23514';
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
      raise exception 'La rutina no existe o no pertenece a este entrenador.' using errcode = 'P0002';
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
    exercise_position := exercise_position + 1;
    exercise_id_value := (exercise_item ->> 'exercise_id')::uuid;

    if jsonb_typeof(exercise_item -> 'sets') <> 'array'
      or jsonb_array_length(exercise_item -> 'sets') < 1
      or jsonb_array_length(exercise_item -> 'sets') > 20 then
      raise exception 'Cada ejercicio debe tener entre 1 y 20 series.' using errcode = '23514';
    end if;

    insert into public.routine_exercises (routine_id, exercise_id, order_index)
    values (saved_routine_id, exercise_id_value, exercise_position - 1)
    returning id into saved_routine_exercise_id;

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

revoke all on function public.save_trainer_routine(uuid, uuid, text, text, date, date, integer, boolean, jsonb) from public;
revoke all on function public.save_trainer_routine(uuid, uuid, text, text, date, date, integer, boolean, jsonb) from anon;
grant execute on function public.save_trainer_routine(uuid, uuid, text, text, date, date, integer, boolean, jsonb) to authenticated;
