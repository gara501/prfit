-- The authorization checks remain inside the SECURITY INVOKER function. This
-- grant only restores the authenticated role's ability to invoke it.
revoke all on function public.list_exercise_history_overview(uuid) from public;
revoke all on function public.list_exercise_history_overview(uuid) from anon;
grant execute on function public.list_exercise_history_overview(uuid)
  to authenticated;
