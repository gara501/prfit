-- The hardening migration revokes EXECUTE from every public RPC. These two
-- client-owned session transitions were unintentionally omitted from its
-- allowlist. Both functions remain SECURITY INVOKER and enforce auth.uid().
revoke all on function public.abandon_workout_session(uuid)
  from public, anon;
grant execute on function public.abandon_workout_session(uuid)
  to authenticated;

revoke all on function public.complete_workout_session(
  uuid, smallint, smallint, smallint, text, text
) from public, anon;
grant execute on function public.complete_workout_session(
  uuid, smallint, smallint, smallint, text, text
) to authenticated;
