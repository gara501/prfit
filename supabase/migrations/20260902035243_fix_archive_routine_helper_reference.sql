-- `is_active_trainer_of` was moved to the private schema. This RPC is called
-- with `search_path = public`, so keep the internal authorization helper
-- explicitly qualified.
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
    and private.is_active_trainer_of(client_id)
  returning id into archived_id;

  if archived_id is null then
    raise exception 'Solo puedes archivar un plan publicado propio.' using errcode = '42501';
  end if;

  return archived_id;
end;
$$;

revoke all on function public.archive_routine_version(uuid) from public;
revoke all on function public.archive_routine_version(uuid) from anon;
grant execute on function public.archive_routine_version(uuid) to authenticated;
