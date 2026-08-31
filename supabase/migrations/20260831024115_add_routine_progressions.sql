create table public.routine_exercise_progression_rules (
  id uuid primary key default gen_random_uuid(),
  routine_exercise_id uuid not null unique
    references public.routine_exercises(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  strategy text not null default 'manual'
    check (strategy in ('double_progression', 'fixed_increment', 'manual')),
  increment_kg numeric(8,2) not null default 2.5
    check (increment_kg >= 0),
  successful_sessions_required smallint not null default 2
    check (successful_sessions_required between 1 and 12),
  target_effort smallint
    check (target_effort between 0 and 10),
  failure_sessions_required smallint not null default 2
    check (failure_sessions_required between 1 and 12),
  deload_on_fail boolean not null default false,
  reduction_percent numeric(5,2) not null default 10
    check (reduction_percent > 0 and reduction_percent < 100),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routine_progression_suggestions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.routine_exercise_progression_rules(id) on delete cascade,
  source_routine_id uuid not null references public.routines(id) on delete cascade,
  source_routine_exercise_id uuid not null references public.routine_exercises(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  source_day_number smallint not null check (source_day_number between 1 and 7),
  source_order_index integer not null check (source_order_index >= 0),
  strategy text not null check (strategy in ('double_progression', 'fixed_increment', 'manual')),
  proposed_weight numeric(8,2),
  proposed_reps_min smallint,
  proposed_reps_max smallint,
  rationale text not null check (char_length(rationale) between 1 and 2000),
  status text not null default 'pending'
    check (status in ('pending', 'applied', 'dismissed')),
  generated_at timestamptz not null default now(),
  resolved_at timestamptz,
  applied_routine_id uuid references public.routines(id) on delete set null,
  constraint routine_progression_suggestion_reps_check
    check (
      (proposed_reps_min is null and proposed_reps_max is null)
      or (proposed_reps_min is not null and proposed_reps_max is not null and proposed_reps_min > 0 and proposed_reps_max >= proposed_reps_min)
    )
);

create unique index routine_progression_suggestions_one_pending_rule_idx
  on public.routine_progression_suggestions (rule_id)
  where status = 'pending';

create index routine_progression_suggestions_routine_status_idx
  on public.routine_progression_suggestions (source_routine_id, status, generated_at desc);

alter table public.routine_exercise_progression_rules enable row level security;
alter table public.routine_progression_suggestions enable row level security;

grant select, insert, update, delete on public.routine_exercise_progression_rules to authenticated;
grant select, insert, update on public.routine_progression_suggestions to authenticated;

create policy "trainer manages own progression rules"
on public.routine_exercise_progression_rules
for all to authenticated
using (trainer_id = (select auth.uid()))
with check (trainer_id = (select auth.uid()));

create policy "trainer reads own progression suggestions"
on public.routine_progression_suggestions
for select to authenticated
using (trainer_id = (select auth.uid()));

create policy "trainer creates own progression suggestions"
on public.routine_progression_suggestions
for insert to authenticated
with check (trainer_id = (select auth.uid()));

create policy "trainer updates own pending progression suggestions"
on public.routine_progression_suggestions
for update to authenticated
using (trainer_id = (select auth.uid()) and status = 'pending')
with check (trainer_id = (select auth.uid()));

create or replace function public.set_progression_updated_at()
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

create trigger routine_exercise_progression_rules_updated_at
before update on public.routine_exercise_progression_rules
for each row execute function public.set_progression_updated_at();

create or replace function public.copy_progression_rule_to_cloned_exercise()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  source_routine_id uuid;
  source_rule public.routine_exercise_progression_rules%rowtype;
begin
  select supersedes_routine_id into source_routine_id
  from public.routines
  where id = new.routine_id and status = 'draft';

  if source_routine_id is null then
    return new;
  end if;

  select rule.* into source_rule
  from public.routine_exercise_progression_rules as rule
  join public.routine_exercises as source_exercise
    on source_exercise.id = rule.routine_exercise_id
  where source_exercise.routine_id = source_routine_id
    and source_exercise.day_number = new.day_number
    and source_exercise.order_index = new.order_index
    and source_exercise.exercise_id = new.exercise_id;

  if source_rule.id is not null then
    insert into public.routine_exercise_progression_rules (
      routine_exercise_id, trainer_id, client_id, strategy, increment_kg,
      successful_sessions_required, target_effort, failure_sessions_required,
      deload_on_fail, reduction_percent, enabled
    ) values (
      new.id, source_rule.trainer_id, source_rule.client_id, source_rule.strategy,
      source_rule.increment_kg, source_rule.successful_sessions_required,
      source_rule.target_effort, source_rule.failure_sessions_required,
      source_rule.deload_on_fail, source_rule.reduction_percent, source_rule.enabled
    ) on conflict (routine_exercise_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger routine_exercises_copy_progression_rule
after insert on public.routine_exercises
for each row execute function public.copy_progression_rule_to_cloned_exercise();

create or replace function public.apply_progression_suggestion(
  p_suggestion_id uuid,
  p_manual_weight numeric default null,
  p_manual_reps_min integer default null,
  p_manual_reps_max integer default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  suggestion public.routine_progression_suggestions%rowtype;
  draft_id uuid;
  target_exercise_id uuid;
  next_weight numeric;
  next_reps_min integer;
  next_reps_max integer;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para aplicar una progresión.' using errcode = '42501';
  end if;

  select * into suggestion
  from public.routine_progression_suggestions
  where id = p_suggestion_id and trainer_id = actor_id and status = 'pending'
  for update;

  if suggestion.id is null then
    raise exception 'La sugerencia no está disponible.' using errcode = '42501';
  end if;

  select id into draft_id
  from public.routines
  where plan_id = (select plan_id from public.routines where id = suggestion.source_routine_id)
    and trainer_id = actor_id
    and status = 'draft'
  order by version_number desc
  limit 1;

  if draft_id is null then
    raise exception 'Crea un borrador de esta rutina antes de aplicar la progresión.' using errcode = '23514';
  end if;

  if suggestion.strategy = 'manual'
    and p_manual_weight is null
    and p_manual_reps_min is null
    and p_manual_reps_max is null then
    raise exception 'Indica al menos un ajuste manual.' using errcode = '23514';
  end if;
  if p_manual_weight is not null and p_manual_weight < 0 then
    raise exception 'El peso manual no puede ser negativo.' using errcode = '23514';
  end if;
  if (p_manual_reps_min is null) <> (p_manual_reps_max is null)
    or (p_manual_reps_min is not null and (p_manual_reps_min < 1 or p_manual_reps_max < p_manual_reps_min)) then
    raise exception 'El rango manual de repeticiones no es válido.' using errcode = '23514';
  end if;

  next_weight := coalesce(p_manual_weight, suggestion.proposed_weight);
  next_reps_min := coalesce(p_manual_reps_min, suggestion.proposed_reps_min);
  next_reps_max := coalesce(p_manual_reps_max, suggestion.proposed_reps_max);

  select id into target_exercise_id
  from public.routine_exercises
  where routine_id = draft_id
    and exercise_id = suggestion.exercise_id
    and day_number = suggestion.source_day_number
    and order_index = suggestion.source_order_index;

  if target_exercise_id is null then
    raise exception 'El borrador no conserva el bloque objetivo de esta progresión.' using errcode = '23514';
  end if;

  update public.routine_exercise_sets
  set
    weight = coalesce(next_weight, weight),
    reps_min = coalesce(next_reps_min, reps_min),
    reps_max = coalesce(next_reps_max, reps_max)
  where routine_exercise_id = target_exercise_id
    and set_type in ('working', 'drop_set', 'amrap');

  update public.routine_progression_suggestions
  set status = 'applied', resolved_at = now(), applied_routine_id = draft_id
  where id = suggestion.id;

  return draft_id;
end;
$$;

revoke all on function public.apply_progression_suggestion(uuid, numeric, integer, integer) from public;
revoke all on function public.apply_progression_suggestion(uuid, numeric, integer, integer) from anon;
grant execute on function public.apply_progression_suggestion(uuid, numeric, integer, integer) to authenticated;
