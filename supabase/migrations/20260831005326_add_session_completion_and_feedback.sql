alter table public.workout_sessions
  add column status text not null default 'in_progress',
  add column started_at timestamptz,
  add column ended_at timestamptz,
  add column duration_seconds integer;

update public.workout_sessions as session
set
  started_at = coalesce(session.date, now()),
  status = case
    when exists (
      select 1
      from public.workout_session_sets as session_set
      where session_set.workout_session_id = session.id
        and session_set.completed = false
    ) then 'in_progress'
    else 'completed'
  end,
  ended_at = case
    when exists (
      select 1
      from public.workout_session_sets as session_set
      where session_set.workout_session_id = session.id
        and session_set.completed = false
    ) then null
    else coalesce(session.date, now())
  end;

alter table public.workout_sessions
  alter column started_at set not null,
  add constraint workout_sessions_status_check
    check (status in ('in_progress', 'completed', 'abandoned')),
  add constraint workout_sessions_end_state_check
    check (
      (status = 'in_progress' and ended_at is null)
      or (status in ('completed', 'abandoned') and ended_at is not null)
    ),
  add constraint workout_sessions_duration_check
    check (duration_seconds is null or duration_seconds >= 0);

create index workout_sessions_client_status_date_idx
  on public.workout_sessions (client_id, status, date desc);

create table public.workout_session_feedback (
  session_id uuid primary key
    references public.workout_sessions(id) on delete cascade,
  client_id uuid not null
    references public.profiles(id) on delete cascade,
  energy smallint,
  session_rpe smallint,
  soreness_level smallint,
  soreness_description text,
  client_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_session_feedback_energy_check
    check (energy is null or energy between 1 and 5),
  constraint workout_session_feedback_rpe_check
    check (session_rpe is null or session_rpe between 1 and 10),
  constraint workout_session_feedback_soreness_check
    check (soreness_level is null or soreness_level between 0 and 10),
  constraint workout_session_feedback_soreness_description_length_check
    check (
      soreness_description is null
      or char_length(soreness_description) <= 2000
    ),
  constraint workout_session_feedback_client_note_length_check
    check (client_note is null or char_length(client_note) <= 2000)
);

create index workout_session_feedback_client_id_idx
  on public.workout_session_feedback (client_id);

create table public.trainer_client_messages (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  constraint trainer_client_messages_body_length_check
    check (char_length(trim(body)) between 1 and 4000)
);

create index trainer_client_messages_conversation_idx
  on public.trainer_client_messages (trainer_id, client_id, sent_at desc);

alter table public.workout_session_feedback enable row level security;
alter table public.trainer_client_messages enable row level security;

grant select, insert, update on public.workout_session_feedback to authenticated;
grant select, insert, update on public.trainer_client_messages to authenticated;

create policy "client reads own workout feedback"
on public.workout_session_feedback
for select to authenticated
using (client_id = (select auth.uid()));

create policy "trainer reads assigned client feedback"
on public.workout_session_feedback
for select to authenticated
using (public.is_active_trainer_of(client_id));

create policy "client writes own completed workout feedback"
on public.workout_session_feedback
for insert to authenticated
with check (
  client_id = (select auth.uid())
  and exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_feedback.session_id
      and workout_sessions.client_id = (select auth.uid())
      and workout_sessions.status = 'completed'
  )
);

create policy "client updates own completed workout feedback"
on public.workout_session_feedback
for update to authenticated
using (client_id = (select auth.uid()))
with check (
  client_id = (select auth.uid())
  and exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_feedback.session_id
      and workout_sessions.client_id = (select auth.uid())
      and workout_sessions.status = 'completed'
  )
);

create policy "client reads own messages"
on public.trainer_client_messages
for select to authenticated
using (client_id = (select auth.uid()));

create policy "trainer reads assigned client messages"
on public.trainer_client_messages
for select to authenticated
using (public.is_active_trainer_of(client_id));

create policy "client sends own messages"
on public.trainer_client_messages
for insert to authenticated
with check (
  client_id = (select auth.uid())
  and sender_id = (select auth.uid())
  and exists (
    select 1
    from public.trainer_clients
    where trainer_clients.trainer_id = trainer_client_messages.trainer_id
      and trainer_clients.client_id = (select auth.uid())
      and trainer_clients.is_active = true
  )
);

create policy "trainer sends assigned client messages"
on public.trainer_client_messages
for insert to authenticated
with check (
  trainer_id = (select auth.uid())
  and sender_id = (select auth.uid())
  and public.is_active_trainer_of(client_id)
);

create or replace function public.set_workout_session_feedback_updated_at()
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

create trigger workout_session_feedback_set_updated_at
before update on public.workout_session_feedback
for each row
execute function public.set_workout_session_feedback_updated_at();

create or replace function public.guard_workout_session_writes()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'in_progress' or new.ended_at is not null then
      raise exception 'Las sesiones nuevas deben iniciar en progreso.' using errcode = '23514';
    end if;
    new.started_at = coalesce(new.started_at, now());
    new.duration_seconds = null;
    return new;
  end if;

  if old.status <> 'in_progress' then
    raise exception 'Una sesión cerrada no puede modificarse.' using errcode = '23514';
  end if;

  if new.client_id <> old.client_id
    or new.routine_id is distinct from old.routine_id
    or new.day_number <> old.day_number
    or new.started_at <> old.started_at then
    raise exception 'No se puede modificar la identidad de una sesión.' using errcode = '23514';
  end if;

  if new.status = 'in_progress' then
    if new.ended_at is not null or new.duration_seconds is not null then
      raise exception 'Una sesión en progreso no puede tener hora de cierre.' using errcode = '23514';
    end if;
    return new;
  end if;

  if new.status = 'completed' then
    if not exists (
      select 1
      from public.workout_session_sets
      where workout_session_sets.workout_session_id = old.id
    ) or exists (
      select 1
      from public.workout_session_sets
      where workout_session_sets.workout_session_id = old.id
        and workout_session_sets.completed = false
    ) then
      raise exception 'Completa todas las series antes de cerrar la sesión.' using errcode = '23514';
    end if;
  end if;

  new.ended_at = coalesce(new.ended_at, now());
  new.duration_seconds = greatest(
    0,
    floor(extract(epoch from (new.ended_at - old.started_at)))::integer
  );
  return new;
end;
$$;

create trigger workout_sessions_guard_writes
before insert or update on public.workout_sessions
for each row
execute function public.guard_workout_session_writes();

create or replace function public.guard_workout_session_set_writes()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_session_id uuid;
begin
  if tg_op = 'DELETE' then
    target_session_id := old.workout_session_id;
  else
    target_session_id := new.workout_session_id;
  end if;

  if not exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = target_session_id
      and workout_sessions.status = 'in_progress'
  ) then
    raise exception 'Solo se pueden modificar sets de una sesión en progreso.' using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger workout_session_sets_guard_writes
before insert or update or delete on public.workout_session_sets
for each row
execute function public.guard_workout_session_set_writes();

drop policy if exists "client manages own sessions" on public.workout_sessions;
create policy "client reads own sessions"
on public.workout_sessions
for select to authenticated
using (client_id = (select auth.uid()));

create policy "client starts own sessions"
on public.workout_sessions
for insert to authenticated
with check (
  client_id = (select auth.uid())
  and status = 'in_progress'
);

create policy "client closes own sessions"
on public.workout_sessions
for update to authenticated
using (
  client_id = (select auth.uid())
  and status = 'in_progress'
)
with check (client_id = (select auth.uid()));

drop policy if exists "client manages own session sets" on public.workout_session_sets;
create policy "client reads own session sets"
on public.workout_session_sets
for select to authenticated
using (
  exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_sets.workout_session_id
      and workout_sessions.client_id = (select auth.uid())
  )
);

create policy "client writes own in-progress session sets"
on public.workout_session_sets
for insert to authenticated
with check (
  exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_sets.workout_session_id
      and workout_sessions.client_id = (select auth.uid())
      and workout_sessions.status = 'in_progress'
  )
);

create policy "client updates own in-progress session sets"
on public.workout_session_sets
for update to authenticated
using (
  exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_sets.workout_session_id
      and workout_sessions.client_id = (select auth.uid())
      and workout_sessions.status = 'in_progress'
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions
    where workout_sessions.id = workout_session_sets.workout_session_id
      and workout_sessions.client_id = (select auth.uid())
      and workout_sessions.status = 'in_progress'
  )
);

create or replace function public.complete_workout_session(
  p_session_id uuid,
  p_energy smallint,
  p_session_rpe smallint,
  p_soreness_level smallint,
  p_soreness_description text,
  p_client_note text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  session_record public.workout_sessions%rowtype;
  soreness_description_value text := nullif(trim(coalesce(p_soreness_description, '')), '');
  client_note_value text := nullif(trim(coalesce(p_client_note, '')), '');
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para cerrar el entrenamiento.' using errcode = '42501';
  end if;

  select * into session_record
  from public.workout_sessions
  where id = p_session_id
    and client_id = actor_id
  for update;

  if session_record.id is null then
    raise exception 'La sesión no está disponible.' using errcode = '42501';
  end if;

  if session_record.status = 'abandoned' then
    raise exception 'Una sesión abandonada no se puede completar.' using errcode = '23514';
  end if;

  if p_energy is not null and p_energy not between 1 and 5 then
    raise exception 'La energía debe estar entre 1 y 5.' using errcode = '23514';
  end if;
  if p_session_rpe is not null and p_session_rpe not between 1 and 10 then
    raise exception 'El RPE general debe estar entre 1 y 10.' using errcode = '23514';
  end if;
  if p_soreness_level is not null and p_soreness_level not between 0 and 10 then
    raise exception 'La molestia debe estar entre 0 y 10.' using errcode = '23514';
  end if;
  if soreness_description_value is not null and char_length(soreness_description_value) > 2000 then
    raise exception 'La descripción de molestia no puede superar 2000 caracteres.' using errcode = '23514';
  end if;
  if client_note_value is not null and char_length(client_note_value) > 2000 then
    raise exception 'La nota no puede superar 2000 caracteres.' using errcode = '23514';
  end if;

  if session_record.status = 'in_progress' then
    if exists (
      select 1
      from public.workout_session_sets
      where workout_session_sets.workout_session_id = session_record.id
        and workout_session_sets.completed = false
    ) then
      raise exception 'Completa todas las series antes de cerrar la sesión.' using errcode = '23514';
    end if;

    update public.workout_sessions
    set status = 'completed'
    where id = session_record.id;
  end if;

  if p_energy is not null
    or p_session_rpe is not null
    or p_soreness_level is not null
    or soreness_description_value is not null
    or client_note_value is not null then
    insert into public.workout_session_feedback (
      session_id, client_id, energy, session_rpe, soreness_level,
      soreness_description, client_note
    ) values (
      session_record.id, actor_id, p_energy, p_session_rpe, p_soreness_level,
      soreness_description_value, client_note_value
    ) on conflict (session_id) do update set
      energy = excluded.energy,
      session_rpe = excluded.session_rpe,
      soreness_level = excluded.soreness_level,
      soreness_description = excluded.soreness_description,
      client_note = excluded.client_note;
  end if;

  return session_record.id;
end;
$$;

create or replace function public.abandon_workout_session(p_session_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  abandoned_id uuid;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para abandonar el entrenamiento.' using errcode = '42501';
  end if;

  update public.workout_sessions
  set status = 'abandoned'
  where id = p_session_id
    and client_id = actor_id
    and status = 'in_progress'
  returning id into abandoned_id;

  if abandoned_id is null then
    raise exception 'Solo se puede abandonar una sesión propia en progreso.' using errcode = '42501';
  end if;

  return abandoned_id;
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

revoke all on function public.complete_workout_session(uuid, smallint, smallint, smallint, text, text) from public;
revoke all on function public.complete_workout_session(uuid, smallint, smallint, smallint, text, text) from anon;
grant execute on function public.complete_workout_session(uuid, smallint, smallint, smallint, text, text) to authenticated;

revoke all on function public.abandon_workout_session(uuid) from public;
revoke all on function public.abandon_workout_session(uuid) from anon;
grant execute on function public.abandon_workout_session(uuid) to authenticated;

revoke all on function public.start_workout_session(uuid, integer) from public;
revoke all on function public.start_workout_session(uuid, integer) from anon;
grant execute on function public.start_workout_session(uuid, integer) to authenticated;
