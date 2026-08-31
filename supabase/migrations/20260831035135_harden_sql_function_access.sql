-- Internal RLS helpers are not part of the Data API surface.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'admin'
      and profile.is_active = true
  );
$$;

create or replace function private.is_active_trainer_of(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trainer_clients as link
    where link.trainer_id = (select auth.uid())
      and link.client_id = p_client_id
      and link.is_active = true
  );
$$;

revoke all on function private.is_admin() from public, anon, authenticated, service_role;
revoke all on function private.is_active_trainer_of(uuid)
  from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_active_trainer_of(uuid) to authenticated;

-- Update policies in place before removing the formerly exposed helpers.
do $$
declare
  policy_record record;
  updated_qual text;
  updated_check text;
begin
  for policy_record in
    select schemaname, tablename, policyname, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') like '%is_active_trainer_of%'
        or coalesce(with_check, '') like '%is_active_trainer_of%'
        or coalesce(qual, '') like '%is_admin%'
        or coalesce(with_check, '') like '%is_admin%'
      )
  loop
    updated_qual := replace(
      replace(policy_record.qual, 'is_active_trainer_of(', 'private.is_active_trainer_of('),
      'is_admin()',
      'private.is_admin()'
    );
    updated_check := replace(
      replace(policy_record.with_check, 'is_active_trainer_of(', 'private.is_active_trainer_of('),
      'is_admin()',
      'private.is_admin()'
    );

    if policy_record.cmd in ('SELECT', 'UPDATE', 'DELETE', 'ALL')
      and updated_qual is not null then
      execute format(
        'alter policy %I on public.%I using (%s)',
        policy_record.policyname,
        policy_record.tablename,
        updated_qual
      );
    end if;

    if policy_record.cmd in ('INSERT', 'UPDATE', 'ALL')
      and updated_check is not null then
      execute format(
        'alter policy %I on public.%I with check (%s)',
        policy_record.policyname,
        policy_record.tablename,
        updated_check
      );
    end if;
  end loop;
end;
$$;

drop function public.is_active_trainer_of(uuid);
drop function public.is_admin();

-- These operations are invoked only from Server Actions after their role checks.
-- They accept a service-role request and remain unavailable to browser clients.
create or replace function public.assign_client_to_trainer(
  p_client_id uuid,
  p_trainer_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  client_role text;
  target_role text;
  current_assignment_id uuid;
  current_trainer_id uuid;
  new_assignment_id uuid;
begin
  if actor_id is null and auth.role() <> 'service_role' then
    raise exception 'Debes iniciar sesión para crear una asignación.'
      using errcode = '42501';
  end if;

  if actor_id is not null then
    select profile.role
      into actor_role
    from public.profiles as profile
    where profile.id = actor_id
      and profile.is_active = true;

    if actor_role not in ('admin', 'trainer') then
      raise exception 'No tienes permiso para crear asignaciones.'
        using errcode = '42501';
    end if;

    if actor_role = 'trainer' and p_trainer_id <> actor_id then
      raise exception 'Un entrenador solo puede asignarse clientes a sí mismo.'
        using errcode = '42501';
    end if;
  end if;

  select profile.role
    into client_role
  from public.profiles as profile
  where profile.id = p_client_id
    and profile.is_active = true
  for update;

  if client_role is distinct from 'client' then
    raise exception 'El cliente seleccionado no existe o no está activo.'
      using errcode = '23514';
  end if;

  select profile.role
    into target_role
  from public.profiles as profile
  where profile.id = p_trainer_id
    and profile.is_active = true;

  if target_role is distinct from 'trainer' then
    raise exception 'El entrenador seleccionado no existe o no está activo.'
      using errcode = '23514';
  end if;

  select link.id, link.trainer_id
    into current_assignment_id, current_trainer_id
  from public.trainer_clients as link
  where link.client_id = p_client_id
    and link.is_active = true
  for update;

  if current_trainer_id = p_trainer_id then
    return current_assignment_id;
  end if;

  if actor_role = 'trainer' and current_assignment_id is not null then
    raise exception 'Este cliente ya tiene un entrenador activo.'
      using errcode = '23505';
  end if;

  if current_assignment_id is not null then
    update public.trainer_clients
    set is_active = false, end_date = current_date
    where id = current_assignment_id;
  end if;

  insert into public.trainer_clients (
    trainer_id,
    client_id,
    start_date,
    end_date,
    is_active
  )
  values (p_trainer_id, p_client_id, current_date, null, true)
  returning id into new_assignment_id;

  return new_assignment_id;
end;
$$;

create or replace function public.deactivate_user_profile(p_user_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
  target_role text;
  target_is_active boolean;
begin
  if actor_id is null and auth.role() <> 'service_role' then
    raise exception 'Debes iniciar sesión para desactivar una cuenta.'
      using errcode = '42501';
  end if;

  if actor_id is not null then
    select profile.role
      into actor_role
    from public.profiles as profile
    where profile.id = actor_id
      and profile.is_active = true;

    if actor_role is distinct from 'admin' then
      raise exception 'Solo un administrador puede desactivar cuentas.'
        using errcode = '42501';
    end if;

    if p_user_id = actor_id then
      raise exception 'No puedes desactivar tu propia cuenta.'
        using errcode = '23514';
    end if;
  end if;

  select profile.role, profile.is_active
    into target_role, target_is_active
  from public.profiles as profile
  where profile.id = p_user_id
  for update;

  if target_role is null then
    raise exception 'El perfil seleccionado no existe.' using errcode = 'P0002';
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
  set is_active = false, end_date = current_date
  where is_active = true
    and (trainer_id = p_user_id or client_id = p_user_id);

  return true;
end;
$$;

-- The service role receives the complete result and the Server Component
-- reapplies the actor-specific visibility rules before rendering it.
create or replace function public.list_client_assignments()
returns table (
  client_id uuid,
  client_first_name text,
  client_last_name text,
  client_email text,
  client_phone text,
  assignment_id uuid,
  trainer_id uuid,
  trainer_first_name text,
  trainer_last_name text,
  start_date date,
  active_routine_id uuid,
  active_routine_name text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    client.id,
    client.first_name,
    client.last_name,
    client.email,
    client.phone,
    link.id,
    link.trainer_id,
    trainer.first_name,
    trainer.last_name,
    link.start_date,
    active_routine.id,
    active_routine.name
  from public.profiles as client
  left join public.trainer_clients as link
    on link.client_id = client.id
   and link.is_active = true
  left join public.profiles as trainer
    on trainer.id = link.trainer_id
  left join lateral (
    select routine.id, routine.name
    from public.routines as routine
    where routine.client_id = client.id
      and routine.is_active = true
      and routine.start_date <= current_date
      and (routine.end_date is null or routine.end_date >= current_date)
    order by routine.start_date desc, routine.name
    limit 1
  ) as active_routine on true
  where client.role = 'client'
    and client.is_active = true
  order by
    (link.trainer_id is null) desc,
    client.first_name nulls last,
    client.last_name nulls last;
$$;

-- Remove default execution rights. Re-grant only the RPCs used by the app.
revoke execute on all functions in schema public
  from public, anon, authenticated, service_role;

grant execute on function public.assign_client_to_trainer(uuid, uuid) to service_role;
grant execute on function public.deactivate_user_profile(uuid) to service_role;
grant execute on function public.list_client_assignments() to service_role;

grant execute on function public.apply_progression_suggestion(uuid, numeric, integer, integer)
  to authenticated;
grant execute on function public.archive_routine_version(uuid) to authenticated;
grant execute on function public.clone_routine_version(uuid) to authenticated;
grant execute on function public.list_exercise_history_page(uuid, uuid, integer, integer)
  to authenticated;
grant execute on function public.list_exercise_rep_range_bests(uuid, uuid)
  to authenticated;
grant execute on function public.publish_routine_version(uuid) to authenticated;
grant execute on function public.save_routine_draft(
  uuid, uuid, text, text, date, date, integer, jsonb, text
) to authenticated;
grant execute on function public.skip_scheduled_workout(uuid) to authenticated;
grant execute on function public.start_scheduled_workout(uuid) to authenticated;
grant execute on function public.start_workout_session(uuid, integer) to authenticated;
