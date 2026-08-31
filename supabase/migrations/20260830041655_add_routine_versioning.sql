alter table public.routines
  add column plan_id uuid,
  add column version_number integer not null default 1,
  add column status text not null default 'published',
  add column published_at timestamptz,
  add column supersedes_routine_id uuid
    references public.routines(id)
    on delete restrict;

update public.routines
set
  plan_id = id,
  version_number = 1,
  status = 'published',
  published_at = now()
where plan_id is null;

alter table public.routines
  alter column plan_id set not null,
  add constraint routines_version_number_check
    check (version_number > 0),
  add constraint routines_version_status_check
    check (status in ('draft', 'published', 'archived')),
  add constraint routines_version_active_check
    check (
      (status = 'published')
      or is_active = false
    ),
  add constraint routines_plan_version_unique
    unique (plan_id, version_number);

create unique index routines_one_draft_per_plan_idx
  on public.routines (plan_id)
  where status = 'draft';

create unique index routines_one_published_per_plan_idx
  on public.routines (plan_id)
  where status = 'published';

create index routines_plan_versions_idx
  on public.routines (plan_id, version_number desc);

create or replace function public.guard_routine_version_writes()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  immutable_old jsonb;
  immutable_new jsonb;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' or new.is_active then
      raise exception 'Los planes nuevos deben crearse como borradores inactivos.'
        using errcode = '23514';
    end if;
    return new;
  end if;

  immutable_old := to_jsonb(old) - array['status', 'is_active', 'published_at', 'updated_at'];
  immutable_new := to_jsonb(new) - array['status', 'is_active', 'published_at', 'updated_at'];

  if old.status = 'draft' then
    if new.status = 'draft' and new.is_active = false then
      return new;
    end if;

    if new.status = 'published'
      and new.is_active = true
      and new.published_at is not null
      and immutable_new = immutable_old then
      if new.days_at_week is null or new.days_at_week not between 1 and 7 then
        raise exception 'El borrador debe tener entre 1 y 7 días antes de publicarse.'
          using errcode = '23514';
      end if;

      if not exists (
        select 1
        from public.routine_exercises
        where routine_id = new.id
      ) then
        raise exception 'El borrador debe tener ejercicios antes de publicarse.'
          using errcode = '23514';
      end if;

      if exists (
        select 1
        from generate_series(1, new.days_at_week) as planned_day(day_number)
        where not exists (
          select 1
          from public.routine_exercises
          where routine_id = new.id
            and day_number = planned_day.day_number
        )
      ) then
        raise exception 'Cada día del plan debe tener al menos un ejercicio antes de publicarse.'
          using errcode = '23514';
      end if;

      if exists (
        select 1
        from public.routine_exercises
        where routine_id = new.id
          and not exists (
            select 1
            from public.routine_exercise_sets
            where routine_exercise_id = routine_exercises.id
          )
      ) then
        raise exception 'Cada ejercicio debe tener al menos una serie antes de publicarse.'
          using errcode = '23514';
      end if;

      return new;
    end if;

    raise exception 'Un borrador solo puede editarse o publicarse sin modificar su contenido durante la publicación.'
      using errcode = '23514';
  end if;

  if old.status = 'published'
    and new.status = 'archived'
    and new.is_active = false
    and immutable_new = immutable_old then
    return new;
  end if;

  raise exception 'Las versiones publicadas y archivadas son inmutables.'
    using errcode = '23514';
end;
$$;

drop trigger if exists routines_guard_version_writes on public.routines;
create trigger routines_guard_version_writes
before insert or update on public.routines
for each row
execute function public.guard_routine_version_writes();

drop policy if exists "trainer updates routines" on public.routines;
create policy "trainer updates routine versions" on public.routines
for update to authenticated
using (
  trainer_id = (select auth.uid())
  and is_active_trainer_of(client_id)
  and status in ('draft', 'published')
)
with check (
  trainer_id = (select auth.uid())
  and is_active_trainer_of(client_id)
  and (
    (status = 'draft' and is_active = false)
    or (status = 'published' and is_active = true)
    or (status = 'archived' and is_active = false)
  )
);

drop policy if exists "trainer deletes routines" on public.routines;
create policy "trainer deletes routine drafts" on public.routines
for delete to authenticated
using (
  trainer_id = (select auth.uid())
  and is_active_trainer_of(client_id)
  and status = 'draft'
);

drop policy if exists "trainer deletes routine_exercises" on public.routine_exercises;
create policy "trainer deletes draft routine exercises" on public.routine_exercises
for delete to authenticated
using (
  exists (
    select 1
    from public.routines
    where routines.id = routine_exercises.routine_id
      and routines.trainer_id = (select auth.uid())
      and routines.status = 'draft'
      and is_active_trainer_of(routines.client_id)
  )
);

drop policy if exists "trainer deletes routine_exercise_sets" on public.routine_exercise_sets;
create policy "trainer deletes draft routine exercise sets" on public.routine_exercise_sets
for delete to authenticated
using (
  exists (
    select 1
    from public.routine_exercises
    join public.routines on routines.id = routine_exercises.routine_id
    where routine_exercises.id = routine_exercise_sets.routine_exercise_id
      and routines.trainer_id = (select auth.uid())
      and routines.status = 'draft'
      and is_active_trainer_of(routines.client_id)
  )
);

create or replace function public.save_routine_draft(
  p_routine_id uuid,
  p_client_id uuid,
  p_name text,
  p_description text,
  p_start_date date,
  p_end_date date,
  p_days_at_week integer,
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
  new_plan_id uuid;
  exercise_item jsonb;
  set_item jsonb;
  saved_routine_exercise_id uuid;
  set_position integer;
  exercise_id_value uuid;
  day_number_value integer;
  day_order_indexes integer[] := array[0, 0, 0, 0, 0, 0, 0];
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para guardar un borrador.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = actor_id and role = 'trainer' and is_active = true
  ) then
    raise exception 'Solo un entrenador activo puede guardar borradores.' using errcode = '42501';
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
    new_plan_id := gen_random_uuid();
    insert into public.routines (
      plan_id,
      version_number,
      status,
      is_active,
      client_id,
      trainer_id,
      name,
      description,
      start_date,
      end_date,
      days_at_week
    ) values (
      new_plan_id,
      1,
      'draft',
      false,
      p_client_id,
      actor_id,
      trim(p_name),
      nullif(trim(coalesce(p_description, '')), ''),
      p_start_date,
      p_end_date,
      p_days_at_week
    ) returning id into saved_routine_id;
  else
    select id into saved_routine_id
    from public.routines
    where id = p_routine_id
      and trainer_id = actor_id
      and status = 'draft'
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
      days_at_week = p_days_at_week
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
      routine_id,
      exercise_id,
      day_number,
      order_index
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
        routine_exercise_id,
        set_number,
        reps,
        rest_seconds,
        weight
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
    select 1
    from public.routines
    where plan_id = source_routine.plan_id
      and status = 'draft'
  ) then
    raise exception 'Este plan ya tiene un borrador pendiente.' using errcode = '23505';
  end if;

  insert into public.routines (
    plan_id,
    version_number,
    status,
    is_active,
    supersedes_routine_id,
    client_id,
    trainer_id,
    name,
    description,
    start_date,
    end_date,
    days_at_week
  ) values (
    source_routine.plan_id,
    (
      select max(version_number) + 1
      from public.routines
      where plan_id = source_routine.plan_id
    ),
    'draft',
    false,
    source_routine.id,
    source_routine.client_id,
    actor_id,
    source_routine.name,
    source_routine.description,
    source_routine.start_date,
    source_routine.end_date,
    source_routine.days_at_week
  ) returning id into new_routine_id;

  for source_exercise in
    select id, exercise_id, day_number, order_index
    from public.routine_exercises
    where routine_id = source_routine.id
    order by day_number, order_index
  loop
    insert into public.routine_exercises (
      routine_id,
      exercise_id,
      day_number,
      order_index
    ) values (
      new_routine_id,
      source_exercise.exercise_id,
      source_exercise.day_number,
      source_exercise.order_index
    ) returning id into new_routine_exercise_id;

    insert into public.routine_exercise_sets (
      routine_exercise_id,
      set_number,
      reps,
      rest_seconds,
      weight
    )
    select
      new_routine_exercise_id,
      set_number,
      reps,
      rest_seconds,
      weight
    from public.routine_exercise_sets
    where routine_exercise_id = source_exercise.id
    order by set_number;
  end loop;

  return new_routine_id;
end;
$$;

create or replace function public.publish_routine_version(p_routine_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  draft_routine public.routines%rowtype;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para publicar un plan.' using errcode = '42501';
  end if;

  select * into draft_routine
  from public.routines
  where id = p_routine_id
    and trainer_id = actor_id
    and status = 'draft'
  for update;

  if draft_routine.id is null then
    raise exception 'Solo se puede publicar un borrador propio.' using errcode = '42501';
  end if;

  if not public.is_active_trainer_of(draft_routine.client_id) then
    raise exception 'El cliente ya no está asignado actualmente a este entrenador.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.routine_exercises
    where routine_id = draft_routine.id
  ) then
    raise exception 'El borrador debe tener ejercicios antes de publicarse.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from generate_series(1, draft_routine.days_at_week) as planned_day(day_number)
    where not exists (
      select 1
      from public.routine_exercises
      where routine_id = draft_routine.id
        and day_number = planned_day.day_number
    )
  ) then
    raise exception 'Cada día del plan debe tener al menos un ejercicio antes de publicarse.' using errcode = '23514';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(draft_routine.plan_id::text, 0));

  update public.routines
  set status = 'archived', is_active = false
  where plan_id = draft_routine.plan_id
    and status = 'published';

  update public.routines
  set status = 'published', is_active = true, published_at = now()
  where id = draft_routine.id;

  return draft_routine.id;
end;
$$;

create or replace function public.archive_routine_version(p_routine_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  archived_id uuid;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para archivar un plan.' using errcode = '42501';
  end if;

  update public.routines
  set status = 'archived', is_active = false
  where id = p_routine_id
    and trainer_id = actor_id
    and status = 'published'
    and is_active_trainer_of(client_id)
  returning id into archived_id;

  if archived_id is null then
    raise exception 'Solo puedes archivar un plan publicado propio.' using errcode = '42501';
  end if;

  return archived_id;
end;
$$;

revoke all on function public.save_trainer_routine(uuid, uuid, text, text, date, date, integer, boolean, jsonb) from public;
revoke all on function public.save_trainer_routine(uuid, uuid, text, text, date, date, integer, boolean, jsonb) from anon;

revoke all on function public.save_routine_draft(uuid, uuid, text, text, date, date, integer, jsonb) from public;
revoke all on function public.save_routine_draft(uuid, uuid, text, text, date, date, integer, jsonb) from anon;
grant execute on function public.save_routine_draft(uuid, uuid, text, text, date, date, integer, jsonb) to authenticated;

revoke all on function public.clone_routine_version(uuid) from public;
revoke all on function public.clone_routine_version(uuid) from anon;
grant execute on function public.clone_routine_version(uuid) to authenticated;

revoke all on function public.publish_routine_version(uuid) from public;
revoke all on function public.publish_routine_version(uuid) from anon;
grant execute on function public.publish_routine_version(uuid) to authenticated;

revoke all on function public.archive_routine_version(uuid) from public;
revoke all on function public.archive_routine_version(uuid) from anon;
grant execute on function public.archive_routine_version(uuid) to authenticated;

create or replace function public.list_client_assignments()
returns table (
  client_id uuid,
  client_first_name text,
  client_last_name text,
  client_email text,
  client_phone text,
  assignment_id uuid,
  trainer_id uuid,
  trainer_first_name text,
  trainer_last_name text,
  start_date date,
  active_routine_id uuid,
  active_routine_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para consultar asignaciones.' using errcode = '42501';
  end if;

  select profile.role into actor_role
  from public.profiles as profile
  where profile.id = actor_id
    and profile.is_active = true;

  if actor_role not in ('admin', 'trainer') then
    raise exception 'No tienes permiso para consultar asignaciones.' using errcode = '42501';
  end if;

  return query
  select
    client.id,
    client.first_name,
    client.last_name,
    case when actor_role = 'admin' or link.trainer_id = actor_id then client.email else null end,
    case when actor_role = 'admin' or link.trainer_id = actor_id then client.phone else null end,
    link.id,
    link.trainer_id,
    trainer.first_name,
    trainer.last_name,
    link.start_date,
    active_routine.id,
    active_routine.name
  from public.profiles as client
  left join public.trainer_clients as link
    on link.client_id = client.id
   and link.is_active = true
  left join public.profiles as trainer
    on trainer.id = link.trainer_id
  left join lateral (
    select routine.id, routine.name
    from public.routines as routine
    where routine.client_id = client.id
      and routine.status = 'published'
      and routine.is_active = true
      and routine.start_date <= current_date
      and (routine.end_date is null or routine.end_date >= current_date)
      and (actor_role = 'admin' or link.trainer_id = actor_id)
    order by routine.start_date desc, routine.version_number desc, routine.name
    limit 1
  ) as active_routine on true
  where client.role = 'client'
    and client.is_active = true
    and (
      actor_role = 'admin'
      or link.trainer_id is null
      or link.trainer_id = actor_id
    )
  order by
    (link.trainer_id is null) desc,
    client.first_name nulls last,
    client.last_name nulls last;
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
    select 1
    from public.profiles
    where id = actor_id and role = 'client' and is_active = true
  ) then
    raise exception 'Solo un cliente activo puede iniciar entrenamientos.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(actor_id::text || ':' || p_routine_id::text || ':' || p_day_number::text, 0)
  );

  if not exists (
    select 1
    from public.routines
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

  if not exists (
    select 1
    from public.routine_exercises
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
      select 1
      from public.workout_session_sets
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
