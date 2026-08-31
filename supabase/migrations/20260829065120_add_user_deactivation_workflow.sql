create or replace function public.deactivate_user_profile(p_user_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  target_role text;
  target_is_active boolean;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para desactivar una cuenta.'
      using errcode = '42501';
  end if;

  select p.role
    into actor_role
  from public.profiles as p
  where p.id = actor_id
    and p.is_active = true;

  if actor_role is distinct from 'admin' then
    raise exception 'Solo un administrador puede desactivar cuentas.'
      using errcode = '42501';
  end if;

  if p_user_id = actor_id then
    raise exception 'No puedes desactivar tu propia cuenta.'
      using errcode = '23514';
  end if;

  select p.role, p.is_active
    into target_role, target_is_active
  from public.profiles as p
  where p.id = p_user_id
  for update;

  if target_role is null then
    raise exception 'El perfil seleccionado no existe.'
      using errcode = 'P0002';
  end if;

  if target_role = 'admin' then
    raise exception 'Las cuentas de administrador no pueden desactivarse desde esta pantalla.'
      using errcode = '42501';
  end if;

  if target_is_active = false then
    return false;
  end if;

  update public.profiles
  set is_active = false
  where id = p_user_id;

  update public.trainer_clients
  set
    is_active = false,
    end_date = current_date
  where is_active = true
    and (trainer_id = p_user_id or client_id = p_user_id);

  return true;
end;
$$;

revoke all on function public.deactivate_user_profile(uuid) from public;
revoke all on function public.deactivate_user_profile(uuid) from anon;
grant execute on function public.deactivate_user_profile(uuid) to authenticated;
