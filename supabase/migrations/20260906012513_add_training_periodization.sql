create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  goal text check (goal is null or char_length(goal) <= 2000),
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create unique index training_plans_one_active_per_client
  on public.training_plans (client_id)
  where status = 'active';
create index training_plans_trainer_client_idx
  on public.training_plans (trainer_id, client_id, start_date desc);

create table public.training_mesocycles (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid not null references public.training_plans(id) on delete cascade,
  position smallint not null check (position between 1 and 24),
  name text not null check (char_length(name) between 2 and 100),
  focus text not null check (focus in ('base', 'hypertrophy', 'strength', 'power', 'peak', 'recovery', 'custom')),
  objective text check (objective is null or char_length(objective) <= 1000),
  start_date date not null,
  end_date date not null,
  volume_level smallint not null check (volume_level between 1 and 5),
  intensity_level smallint not null check (intensity_level between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (training_plan_id, position) deferrable initially deferred,
  unique (id, training_plan_id),
  check (end_date >= start_date)
);

create table public.training_microcycles (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid not null references public.training_plans(id) on delete cascade,
  mesocycle_id uuid not null,
  position smallint not null check (position between 1 and 12),
  week_number smallint not null check (week_number between 1 and 52),
  objective text check (objective is null or char_length(objective) <= 500),
  load_type text not null default 'build' check (load_type in ('build', 'deload', 'recovery', 'test')),
  start_date date not null,
  end_date date not null,
  volume_level smallint not null check (volume_level between 1 and 5),
  intensity_level smallint not null check (intensity_level between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (mesocycle_id, training_plan_id)
    references public.training_mesocycles(id, training_plan_id) on delete cascade,
  unique (mesocycle_id, position) deferrable initially deferred,
  unique (training_plan_id, week_number) deferrable initially deferred,
  check (end_date >= start_date)
);

alter table public.routines
  add column microcycle_id uuid references public.training_microcycles(id) on delete restrict;

create index routines_microcycle_id_idx on public.routines (microcycle_id);

create function public.set_periodization_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger training_plans_set_updated_at
before update on public.training_plans
for each row execute function public.set_periodization_updated_at();

create trigger training_mesocycles_set_updated_at
before update on public.training_mesocycles
for each row execute function public.set_periodization_updated_at();

create trigger training_microcycles_set_updated_at
before update on public.training_microcycles
for each row execute function public.set_periodization_updated_at();

create function public.guard_linked_microcycle_schedule()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.start_date, new.end_date, new.training_plan_id)
      is distinct from (old.start_date, old.end_date, old.training_plan_id)
    and exists (
      select 1 from public.routines where microcycle_id = old.id
    ) then
    raise exception 'No se puede mover una semana que ya tiene una rutina vinculada.';
  end if;
  return new;
end;
$$;

create trigger training_microcycles_guard_linked_schedule
before update on public.training_microcycles
for each row execute function public.guard_linked_microcycle_schedule();

create function public.guard_routine_microcycle_assignment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  linked_plan public.training_plans%rowtype;
begin
  if new.microcycle_id is null and new.supersedes_routine_id is not null then
    new.microcycle_id := (
      select microcycle_id
      from public.routines
      where id = new.supersedes_routine_id
    );
  end if;

  if new.microcycle_id is null then
    return new;
  end if;

  select plan.* into linked_plan
  from public.training_microcycles microcycle
  join public.training_plans plan on plan.id = microcycle.training_plan_id
  where microcycle.id = new.microcycle_id;

  if linked_plan.id is null
    or linked_plan.trainer_id <> new.trainer_id
    or linked_plan.client_id <> new.client_id then
    raise exception 'La rutina no pertenece al entrenador y cliente de la semana seleccionada.';
  end if;

  if not exists (
    select 1 from public.training_microcycles
    where id = new.microcycle_id
      and start_date = new.start_date
      and end_date = new.end_date
  ) then
    raise exception 'Las fechas de la rutina deben coincidir con la semana planificada.';
  end if;

  return new;
end;
$$;

create trigger routines_guard_microcycle_assignment
before insert or update of microcycle_id, trainer_id, client_id, supersedes_routine_id
on public.routines
for each row execute function public.guard_routine_microcycle_assignment();

alter table public.training_plans enable row level security;
alter table public.training_mesocycles enable row level security;
alter table public.training_microcycles enable row level security;

create policy "trainers read owned periodization plans"
on public.training_plans for select to authenticated
using (trainer_id = (select auth.uid()));

create policy "clients read their periodization plans"
on public.training_plans for select to authenticated
using (client_id = (select auth.uid()));

create policy "trainers insert assigned periodization plans"
on public.training_plans for insert to authenticated
with check (
  trainer_id = (select auth.uid())
  and private.is_active_trainer_of(client_id)
);

create policy "trainers update owned periodization plans"
on public.training_plans for update to authenticated
using (trainer_id = (select auth.uid()))
with check (
  trainer_id = (select auth.uid())
  and private.is_active_trainer_of(client_id)
);

create policy "trainers delete owned draft periodization plans"
on public.training_plans for delete to authenticated
using (trainer_id = (select auth.uid()) and status = 'draft');

create policy "members read periodization mesocycles"
on public.training_mesocycles for select to authenticated
using (
  exists (
    select 1 from public.training_plans plan
    where plan.id = training_plan_id
      and (plan.trainer_id = (select auth.uid()) or plan.client_id = (select auth.uid()))
  )
);

create policy "trainers insert owned periodization mesocycles"
on public.training_mesocycles for insert to authenticated
with check (
  exists (
    select 1 from public.training_plans plan
    where plan.id = training_plan_id and plan.trainer_id = (select auth.uid())
  )
);

create policy "trainers update owned periodization mesocycles"
on public.training_mesocycles for update to authenticated
using (
  exists (
    select 1 from public.training_plans plan
    where plan.id = training_plan_id and plan.trainer_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.training_plans plan
    where plan.id = training_plan_id and plan.trainer_id = (select auth.uid())
  )
);

create policy "trainers delete owned periodization mesocycles"
on public.training_mesocycles for delete to authenticated
using (
  exists (
    select 1 from public.training_plans plan
    where plan.id = training_plan_id and plan.trainer_id = (select auth.uid())
  )
);

create policy "members read periodization microcycles"
on public.training_microcycles for select to authenticated
using (
  exists (
    select 1 from public.training_plans plan
    where plan.id = training_plan_id
      and (plan.trainer_id = (select auth.uid()) or plan.client_id = (select auth.uid()))
  )
);

create policy "trainers insert owned periodization microcycles"
on public.training_microcycles for insert to authenticated
with check (
  exists (
    select 1 from public.training_plans plan
    where plan.id = training_plan_id and plan.trainer_id = (select auth.uid())
  )
);

create policy "trainers update owned periodization microcycles"
on public.training_microcycles for update to authenticated
using (
  exists (
    select 1 from public.training_plans plan
    where plan.id = training_plan_id and plan.trainer_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.training_plans plan
    where plan.id = training_plan_id and plan.trainer_id = (select auth.uid())
  )
);

create policy "trainers delete owned periodization microcycles"
on public.training_microcycles for delete to authenticated
using (
  exists (
    select 1 from public.training_plans plan
    where plan.id = training_plan_id and plan.trainer_id = (select auth.uid())
  )
);

grant select, insert, update, delete on public.training_plans to authenticated;
grant select, insert, update, delete on public.training_mesocycles to authenticated;
grant select, insert, update, delete on public.training_microcycles to authenticated;

create function public.save_periodization_plan(
  p_plan_id uuid,
  p_client_id uuid,
  p_name text,
  p_goal text,
  p_start_date date,
  p_mesocycles jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  saved_plan_id uuid;
  existing_plan public.training_plans%rowtype;
  mesocycle jsonb;
  microcycle jsonb;
  mesocycle_id uuid;
  microcycle_id uuid;
  mesocycle_ids uuid[] := '{}';
  microcycle_ids uuid[] := '{}';
  mesocycle_position integer := 0;
  microcycle_position integer;
  global_week integer := 0;
  week_count integer;
  mesocycle_start date;
  mesocycle_end date;
  week_start date;
  total_weeks integer := 0;
begin
  if current_user_id is null then raise exception 'Sesión no válida.'; end if;
  if not private.is_active_trainer_of(p_client_id) then
    raise exception 'El cliente no está asignado activamente a este entrenador.';
  end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 120 then
    raise exception 'El nombre debe tener entre 2 y 120 caracteres.';
  end if;
  if p_start_date is null then raise exception 'La fecha de inicio es obligatoria.'; end if;
  if jsonb_typeof(p_mesocycles) <> 'array'
    or jsonb_array_length(p_mesocycles) not between 1 and 24 then
    raise exception 'El plan debe incluir entre 1 y 24 mesociclos.';
  end if;

  for mesocycle in select value from jsonb_array_elements(p_mesocycles) loop
    if jsonb_typeof(mesocycle->'weeks') <> 'array' then
      raise exception 'Cada mesociclo debe incluir semanas.';
    end if;
    week_count := jsonb_array_length(mesocycle->'weeks');
    if week_count not between 1 and 12 then
      raise exception 'Cada mesociclo debe durar entre 1 y 12 semanas.';
    end if;
    total_weeks := total_weeks + week_count;
  end loop;
  if total_weeks > 52 then raise exception 'El plan no puede superar 52 semanas.'; end if;

  if p_plan_id is null then
    insert into public.training_plans (
      trainer_id, client_id, name, goal, start_date, end_date
    ) values (
      current_user_id, p_client_id, trim(p_name), nullif(trim(p_goal), ''),
      p_start_date, p_start_date + (total_weeks * 7 - 1)
    ) returning id into saved_plan_id;
  else
    select * into existing_plan
    from public.training_plans
    where id = p_plan_id and trainer_id = current_user_id
    for update;
    if existing_plan.id is null then raise exception 'Plan no encontrado.'; end if;
    if existing_plan.status = 'archived' then raise exception 'Un plan archivado es inmutable.'; end if;
    if existing_plan.client_id <> p_client_id then
      raise exception 'No se puede cambiar el cliente de un plan existente.';
    end if;
    update public.training_plans set
      name = trim(p_name), goal = nullif(trim(p_goal), ''), start_date = p_start_date,
      end_date = p_start_date + (total_weeks * 7 - 1)
    where id = p_plan_id
    returning id into saved_plan_id;
  end if;

  for mesocycle in select value from jsonb_array_elements(p_mesocycles) loop
    mesocycle_position := mesocycle_position + 1;
    week_count := jsonb_array_length(mesocycle->'weeks');
    mesocycle_start := p_start_date + (global_week * 7);
    mesocycle_end := mesocycle_start + (week_count * 7 - 1);
    mesocycle_id := nullif(mesocycle->>'id', '')::uuid;

    if mesocycle_id is not null and exists (
      select 1 from public.training_mesocycles
      where id = mesocycle_id and training_plan_id = saved_plan_id
    ) then
      update public.training_mesocycles set
        position = mesocycle_position,
        name = trim(mesocycle->>'name'),
        focus = mesocycle->>'focus',
        objective = nullif(trim(mesocycle->>'objective'), ''),
        start_date = mesocycle_start,
        end_date = mesocycle_end,
        volume_level = (mesocycle->>'volume_level')::smallint,
        intensity_level = (mesocycle->>'intensity_level')::smallint
      where id = mesocycle_id;
    else
      insert into public.training_mesocycles (
        training_plan_id, position, name, focus, objective, start_date, end_date,
        volume_level, intensity_level
      ) values (
        saved_plan_id, mesocycle_position, trim(mesocycle->>'name'), mesocycle->>'focus',
        nullif(trim(mesocycle->>'objective'), ''), mesocycle_start, mesocycle_end,
        (mesocycle->>'volume_level')::smallint, (mesocycle->>'intensity_level')::smallint
      ) returning id into mesocycle_id;
    end if;
    mesocycle_ids := array_append(mesocycle_ids, mesocycle_id);

    microcycle_position := 0;
    for microcycle in select value from jsonb_array_elements(mesocycle->'weeks') loop
      microcycle_position := microcycle_position + 1;
      global_week := global_week + 1;
      week_start := p_start_date + ((global_week - 1) * 7);
      microcycle_id := nullif(microcycle->>'id', '')::uuid;

      if microcycle_id is not null and exists (
        select 1 from public.training_microcycles
        where id = microcycle_id and training_plan_id = saved_plan_id
      ) then
        update public.training_microcycles set
          mesocycle_id = mesocycle_id,
          position = microcycle_position,
          week_number = global_week,
          objective = nullif(trim(microcycle->>'objective'), ''),
          load_type = microcycle->>'load_type',
          start_date = week_start,
          end_date = week_start + 6,
          volume_level = (microcycle->>'volume_level')::smallint,
          intensity_level = (microcycle->>'intensity_level')::smallint
        where id = microcycle_id;
      else
        insert into public.training_microcycles (
          training_plan_id, mesocycle_id, position, week_number, objective,
          load_type, start_date, end_date, volume_level, intensity_level
        ) values (
          saved_plan_id, mesocycle_id, microcycle_position, global_week,
          nullif(trim(microcycle->>'objective'), ''), microcycle->>'load_type',
          week_start, week_start + 6, (microcycle->>'volume_level')::smallint,
          (microcycle->>'intensity_level')::smallint
        ) returning id into microcycle_id;
      end if;
      microcycle_ids := array_append(microcycle_ids, microcycle_id);
    end loop;
  end loop;

  delete from public.training_microcycles
  where training_plan_id = saved_plan_id and not (id = any(microcycle_ids));
  delete from public.training_mesocycles
  where training_plan_id = saved_plan_id and not (id = any(mesocycle_ids));

  return saved_plan_id;
end;
$$;

create function public.activate_periodization_plan(p_plan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  selected_plan public.training_plans%rowtype;
begin
  select * into selected_plan from public.training_plans
  where id = p_plan_id and trainer_id = current_user_id for update;
  if selected_plan.id is null then raise exception 'Plan no encontrado.'; end if;
  if selected_plan.status = 'archived' then raise exception 'El plan está archivado.'; end if;
  if not private.is_active_trainer_of(selected_plan.client_id) then
    raise exception 'El cliente ya no está asignado a este entrenador.';
  end if;
  update public.training_plans set status = 'archived'
  where client_id = selected_plan.client_id and status = 'active' and id <> p_plan_id;
  update public.training_plans set status = 'active' where id = p_plan_id;
  return p_plan_id;
end;
$$;

create function public.archive_periodization_plan(p_plan_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  update public.training_plans set status = 'archived'
  where id = p_plan_id and trainer_id = current_user_id and status <> 'archived';
  if not found then raise exception 'Plan no encontrado o ya archivado.'; end if;
  return p_plan_id;
end;
$$;

grant execute on function public.save_periodization_plan(uuid, uuid, text, text, date, jsonb) to authenticated;
grant execute on function public.activate_periodization_plan(uuid) to authenticated;
grant execute on function public.archive_periodization_plan(uuid) to authenticated;

revoke execute on function public.save_periodization_plan(uuid, uuid, text, text, date, jsonb) from public, anon;
revoke execute on function public.activate_periodization_plan(uuid) from public, anon;
revoke execute on function public.archive_periodization_plan(uuid) from public, anon;
