create index workout_session_sets_completed_exercise_session_idx
  on public.workout_session_sets (exercise_id, workout_session_id, set_number)
  where completed = true;

create or replace function public.list_exercise_history_overview(
  p_client_id uuid
)
returns table (
  exercise_id uuid,
  exercise_name text,
  last_performed_at date,
  session_count bigint,
  work_set_count bigint,
  total_volume numeric,
  max_weight numeric,
  max_estimated_1rm numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    session_set.exercise_id,
    exercise.name,
    max(session.date) as last_performed_at,
    count(distinct session_set.workout_session_id) as session_count,
    count(*) filter (where session_set.planned_set_type <> 'warmup') as work_set_count,
    coalesce(
      sum(
        case
          when session_set.planned_set_type <> 'warmup'
            and session_set.weight is not null
            and session_set.reps is not null
          then session_set.weight * session_set.reps
          else 0
        end
      ),
      0
    ) as total_volume,
    max(session_set.weight) filter (
      where session_set.planned_set_type <> 'warmup'
    ) as max_weight,
    max(
      case
        when session_set.planned_set_type <> 'warmup'
          and session_set.weight is not null
          and session_set.reps is not null
          and session_set.reps > 0
        then round(
          session_set.weight * (1 + session_set.reps::numeric / 30),
          2
        )
        else null
      end
    ) as max_estimated_1rm
  from public.workout_session_sets as session_set
  join public.workout_sessions as session
    on session.id = session_set.workout_session_id
  join public.exercises as exercise
    on exercise.id = session_set.exercise_id
  where session.client_id = p_client_id
    and session.status = 'completed'
    and session_set.completed = true
  group by session_set.exercise_id, exercise.name
  order by max(session.date) desc, exercise.name asc;
$$;

create or replace function public.list_exercise_history_page(
  p_client_id uuid,
  p_exercise_id uuid,
  p_limit integer default 13,
  p_offset integer default 0
)
returns table (
  session_id uuid,
  performed_at date,
  set_id uuid,
  set_number integer,
  reps integer,
  weight numeric,
  actual_rir integer,
  actual_rpe integer,
  set_type text,
  is_warmup boolean,
  volume numeric,
  estimated_1rm numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with paged_sessions as (
    select session.id, session.date
    from public.workout_sessions as session
    where session.client_id = p_client_id
      and session.status = 'completed'
      and exists (
        select 1
        from public.workout_session_sets as session_set
        where session_set.workout_session_id = session.id
          and session_set.exercise_id = p_exercise_id
          and session_set.completed = true
      )
    order by session.date desc, session.id desc
    limit least(greatest(coalesce(p_limit, 13), 1), 25)
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select
    session.id as session_id,
    session.date as performed_at,
    session_set.id as set_id,
    session_set.set_number,
    session_set.reps,
    session_set.weight,
    session_set.actual_rir,
    session_set.actual_rpe,
    session_set.planned_set_type as set_type,
    session_set.planned_set_type = 'warmup' as is_warmup,
    case
      when session_set.planned_set_type <> 'warmup'
        and session_set.weight is not null
        and session_set.reps is not null
      then session_set.weight * session_set.reps
      else 0
    end as volume,
    case
      when session_set.planned_set_type <> 'warmup'
        and session_set.weight is not null
        and session_set.reps is not null
        and session_set.reps > 0
      then round(session_set.weight * (1 + session_set.reps::numeric / 30), 2)
      else null
    end as estimated_1rm
  from paged_sessions as session
  join public.workout_session_sets as session_set
    on session_set.workout_session_id = session.id
  where session_set.exercise_id = p_exercise_id
    and session_set.completed = true
  order by session.date desc, session.id desc, session_set.set_number asc;
$$;

create or replace function public.list_exercise_rep_range_bests(
  p_client_id uuid,
  p_exercise_id uuid
)
returns table (
  rep_range text,
  reps integer,
  weight numeric,
  estimated_1rm numeric,
  performed_at date
)
language sql
stable
security invoker
set search_path = public
as $$
  with candidates as (
    select
      session_set.reps,
      session_set.weight,
      session.date as performed_at,
      case
        when session_set.reps between 1 and 5 then '1–5 reps'
        when session_set.reps between 6 and 8 then '6–8 reps'
        when session_set.reps between 9 and 12 then '9–12 reps'
        when session_set.reps >= 13 then '13+ reps'
        else null
      end as rep_range,
      case
        when session_set.weight is not null
          and session_set.reps is not null
          and session_set.reps > 0
        then round(session_set.weight * (1 + session_set.reps::numeric / 30), 2)
        else null
      end as estimated_1rm
    from public.workout_session_sets as session_set
    join public.workout_sessions as session
      on session.id = session_set.workout_session_id
    where session.client_id = p_client_id
      and session.status = 'completed'
      and session_set.exercise_id = p_exercise_id
      and session_set.completed = true
      and session_set.planned_set_type <> 'warmup'
      and session_set.reps is not null
  ), ranked as (
    select
      *,
      row_number() over (
        partition by rep_range
        order by estimated_1rm desc nulls last, weight desc nulls last, performed_at desc
      ) as position
    from candidates
    where rep_range is not null
  )
  select rep_range, reps, weight, estimated_1rm, performed_at
  from ranked
  where position = 1
  order by case rep_range
    when '1–5 reps' then 1
    when '6–8 reps' then 2
    when '9–12 reps' then 3
    else 4
  end;
$$;

revoke all on function public.list_exercise_history_overview(uuid) from public;
revoke all on function public.list_exercise_history_overview(uuid) from anon;
grant execute on function public.list_exercise_history_overview(uuid) to authenticated;

revoke all on function public.list_exercise_history_page(uuid, uuid, integer, integer) from public;
revoke all on function public.list_exercise_history_page(uuid, uuid, integer, integer) from anon;
grant execute on function public.list_exercise_history_page(uuid, uuid, integer, integer) to authenticated;

revoke all on function public.list_exercise_rep_range_bests(uuid, uuid) from public;
revoke all on function public.list_exercise_rep_range_bests(uuid, uuid) from anon;
grant execute on function public.list_exercise_rep_range_bests(uuid, uuid) to authenticated;
