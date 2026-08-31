create table public.routine_exercise_substitutions (
  id uuid primary key default gen_random_uuid(),
  routine_exercise_id uuid not null references public.routine_exercises(id) on delete cascade,
  substitute_exercise_id uuid not null references public.exercises(id) on delete restrict,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (routine_exercise_id, substitute_exercise_id)
);
alter table public.routine_exercise_substitutions enable row level security;
grant select, insert, delete on public.routine_exercise_substitutions to authenticated;
create policy "trainer manages own routine substitutions" on public.routine_exercise_substitutions
for all to authenticated using (trainer_id = (select auth.uid())) with check (
  trainer_id = (select auth.uid()) and exists (
    select 1 from public.routine_exercises re join public.routines r on r.id = re.routine_id
    where re.id = routine_exercise_substitutions.routine_exercise_id and r.trainer_id = (select auth.uid())
  )
);
create policy "client reads substitutions for own routine" on public.routine_exercise_substitutions
for select to authenticated using (exists (
  select 1 from public.routine_exercises re join public.routines r on r.id = re.routine_id
  where re.id = routine_exercise_substitutions.routine_exercise_id and r.client_id = (select auth.uid())
));

alter table public.workout_session_sets
  add column executed_exercise_id uuid references public.exercises(id) on delete restrict,
  add column substitution_id uuid references public.routine_exercise_substitutions(id) on delete set null;

create or replace function public.apply_exercise_substitution(p_workout_session_set_id uuid, p_substitute_exercise_id uuid)
returns uuid language plpgsql security invoker set search_path = public as $$
declare session_set public.workout_session_sets%rowtype; chosen_id uuid;
begin
  select ss.* into session_set from public.workout_session_sets ss join public.workout_sessions s on s.id = ss.workout_session_id
  where ss.id = p_workout_session_set_id and s.client_id = auth.uid() and s.status = 'in_progress' and ss.completed = false for update;
  if session_set.id is null then raise exception 'Solo puedes sustituir sets propios pendientes.' using errcode = '42501'; end if;
  select id into chosen_id from public.routine_exercise_substitutions
  where routine_exercise_id = session_set.routine_exercise_id and substitute_exercise_id = p_substitute_exercise_id;
  if chosen_id is null then raise exception 'La alternativa no está autorizada.' using errcode = '42501'; end if;
  update public.workout_session_sets set executed_exercise_id = p_substitute_exercise_id, substitution_id = chosen_id where id = session_set.id;
  return session_set.id;
end; $$;
revoke all on function public.apply_exercise_substitution(uuid, uuid) from public;
revoke all on function public.apply_exercise_substitution(uuid, uuid) from anon;
grant execute on function public.apply_exercise_substitution(uuid, uuid) to authenticated;
