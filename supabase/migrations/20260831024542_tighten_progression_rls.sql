drop policy "trainer manages own progression rules"
  on public.routine_exercise_progression_rules;

create policy "trainer reads own progression rules"
on public.routine_exercise_progression_rules
for select to authenticated
using (trainer_id = (select auth.uid()));

create policy "trainer inserts rules for own routine exercise"
on public.routine_exercise_progression_rules
for insert to authenticated
with check (
  trainer_id = (select auth.uid())
  and exists (
    select 1
    from public.routine_exercises as routine_exercise
    join public.routines as routine on routine.id = routine_exercise.routine_id
    where routine_exercise.id = routine_exercise_progression_rules.routine_exercise_id
      and routine.trainer_id = (select auth.uid())
      and routine.client_id = routine_exercise_progression_rules.client_id
  )
);

create policy "trainer updates rules for own routine exercise"
on public.routine_exercise_progression_rules
for update to authenticated
using (trainer_id = (select auth.uid()))
with check (
  trainer_id = (select auth.uid())
  and exists (
    select 1
    from public.routine_exercises as routine_exercise
    join public.routines as routine on routine.id = routine_exercise.routine_id
    where routine_exercise.id = routine_exercise_progression_rules.routine_exercise_id
      and routine.trainer_id = (select auth.uid())
      and routine.client_id = routine_exercise_progression_rules.client_id
  )
);

create policy "trainer deletes own progression rules"
on public.routine_exercise_progression_rules
for delete to authenticated
using (trainer_id = (select auth.uid()));

drop policy "trainer creates own progression suggestions"
  on public.routine_progression_suggestions;
drop policy "trainer updates own pending progression suggestions"
  on public.routine_progression_suggestions;

create policy "trainer inserts verified progression suggestions"
on public.routine_progression_suggestions
for insert to authenticated
with check (
  trainer_id = (select auth.uid())
  and exists (
    select 1
    from public.routine_exercise_progression_rules as rule
    join public.routine_exercises as routine_exercise
      on routine_exercise.id = rule.routine_exercise_id
    join public.routines as routine on routine.id = routine_exercise.routine_id
    where rule.id = routine_progression_suggestions.rule_id
      and rule.trainer_id = (select auth.uid())
      and rule.client_id = routine_progression_suggestions.client_id
      and routine.id = routine_progression_suggestions.source_routine_id
      and routine_exercise.id = routine_progression_suggestions.source_routine_exercise_id
      and routine_exercise.exercise_id = routine_progression_suggestions.exercise_id
      and routine_exercise.day_number = routine_progression_suggestions.source_day_number
      and routine_exercise.order_index = routine_progression_suggestions.source_order_index
      and routine.trainer_id = (select auth.uid())
  )
);

create policy "trainer resolves own verified progression suggestions"
on public.routine_progression_suggestions
for update to authenticated
using (trainer_id = (select auth.uid()))
with check (
  trainer_id = (select auth.uid())
  and exists (
    select 1
    from public.routine_exercise_progression_rules as rule
    join public.routine_exercises as routine_exercise
      on routine_exercise.id = rule.routine_exercise_id
    join public.routines as routine on routine.id = routine_exercise.routine_id
    where rule.id = routine_progression_suggestions.rule_id
      and rule.trainer_id = (select auth.uid())
      and routine.id = routine_progression_suggestions.source_routine_id
      and routine_exercise.id = routine_progression_suggestions.source_routine_exercise_id
      and routine.trainer_id = (select auth.uid())
  )
);
