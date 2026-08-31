create or replace function public.list_client_assignments()
returns table (
  client_id uuid,
  client_first_name text,
  client_last_name text,
  assignment_id uuid,
  trainer_id uuid,
  trainer_first_name text,
  trainer_last_name text,
  start_date date
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
begin
  if actor_id is null then
    raise exception 'Debes iniciar sesión para consultar asignaciones.'
      using errcode = '42501';
  end if;

  select p.role
    into actor_role
  from public.profiles as p
  where p.id = actor_id
    and p.is_active = true;

  if actor_role not in ('admin', 'trainer') then
    raise exception 'No tienes permiso para consultar asignaciones.'
      using errcode = '42501';
  end if;

  return query
  select
    client.id,
    client.first_name,
    client.last_name,
    link.id,
    link.trainer_id,
    trainer.first_name,
    trainer.last_name,
    link.start_date
  from public.profiles as client
  left join public.trainer_clients as link
    on link.client_id = client.id
   and link.is_active = true
  left join public.profiles as trainer
    on trainer.id = link.trainer_id
  where client.role = 'client'
    and client.is_active = true
    and (
      actor_role = 'admin'
      or link.trainer_id is null
      or link.trainer_id = actor_id
    )
  order by
    (link.trainer_id is null) desc,
    client.first_name nulls last,
    client.last_name nulls last;
end;
$$;

revoke all on function public.list_client_assignments() from public;
revoke all on function public.list_client_assignments() from anon;
grant execute on function public.list_client_assignments() to authenticated;

create or replace function public.assign_client_to_trainer(
  p_client_id uuid,
  p_trainer_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
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
  if actor_id is null then
    raise exception 'Debes iniciar sesión para crear una asignación.'
      using errcode = '42501';
  end if;

  select p.role
    into actor_role
  from public.profiles as p
  where p.id = actor_id
    and p.is_active = true;

  if actor_role not in ('admin', 'trainer') then
    raise exception 'No tienes permiso para crear asignaciones.'
      using errcode = '42501';
  end if;

  if actor_role = 'trainer' and p_trainer_id <> actor_id then
    raise exception 'Un entrenador solo puede asignarse clientes a sí mismo.'
      using errcode = '42501';
  end if;

  select p.role
    into client_role
  from public.profiles as p
  where p.id = p_client_id
    and p.is_active = true
  for update;

  if client_role is distinct from 'client' then
    raise exception 'El cliente seleccionado no existe o no está activo.'
      using errcode = '23514';
  end if;

  select p.role
    into target_role
  from public.profiles as p
  where p.id = p_trainer_id
    and p.is_active = true;

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
    set
      is_active = false,
      end_date = current_date
    where id = current_assignment_id;
  end if;

  insert into public.trainer_clients (
    trainer_id,
    client_id,
    start_date,
    end_date,
    is_active
  )
  values (
    p_trainer_id,
    p_client_id,
    current_date,
    null,
    true
  )
  returning id into new_assignment_id;

  return new_assignment_id;
end;
$$;

revoke all on function public.assign_client_to_trainer(uuid, uuid) from public;
revoke all on function public.assign_client_to_trainer(uuid, uuid) from anon;
grant execute on function public.assign_client_to_trainer(uuid, uuid) to authenticated;
