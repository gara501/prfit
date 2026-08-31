alter table public.profiles
  add column email text,
  add column phone text;

update public.profiles as profile
set email = lower(auth_user.email)
from auth.users as auth_user
where auth_user.id = profile.id;

alter table public.profiles
  add constraint profiles_email_length_check
    check (email is null or char_length(email) between 3 and 320),
  add constraint profiles_phone_length_check
    check (phone is null or char_length(phone) between 7 and 30);

create unique index profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    lower(new.email),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '')
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

drop function public.list_client_assignments();

create function public.list_client_assignments()
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

  select profile.role
    into actor_role
  from public.profiles as profile
  where profile.id = actor_id
    and profile.is_active = true;

  if actor_role not in ('admin', 'trainer') then
    raise exception 'No tienes permiso para consultar asignaciones.'
      using errcode = '42501';
  end if;

  return query
  select
    client.id,
    client.first_name,
    client.last_name,
    case
      when actor_role = 'admin' or link.trainer_id = actor_id then client.email
      else null
    end,
    case
      when actor_role = 'admin' or link.trainer_id = actor_id then client.phone
      else null
    end,
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
      and (actor_role = 'admin' or link.trainer_id = actor_id)
    order by routine.start_date desc, routine.name
    limit 1
  ) as active_routine on true
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
