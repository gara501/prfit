-- Keep the public RPC under the caller's RLS context. Active plans belonging
-- to a previous trainer are archived when that trainer-client link closes.
create or replace function public.activate_periodization_plan(p_plan_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  selected_plan public.training_plans%rowtype;
begin
  if current_user_id is null then
    raise exception 'Sesión no válida.' using errcode = '42501';
  end if;

  select * into selected_plan
  from public.training_plans
  where id = p_plan_id and trainer_id = current_user_id
  for update;

  if selected_plan.id is null then raise exception 'Plan no encontrado.'; end if;
  if selected_plan.status = 'archived' then raise exception 'El plan está archivado.'; end if;
  if not private.is_active_trainer_of(selected_plan.client_id) then
    raise exception 'El cliente ya no está asignado a este entrenador.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(selected_plan.client_id::text, 0)
  );

  update public.training_plans
  set status = 'archived'
  where client_id = selected_plan.client_id
    and trainer_id = current_user_id
    and status = 'active'
    and id <> p_plan_id;

  update public.training_plans set status = 'active' where id = p_plan_id;
  return p_plan_id;
end;
$$;

revoke execute on function public.activate_periodization_plan(uuid)
  from public, anon;
grant execute on function public.activate_periodization_plan(uuid)
  to authenticated;

create function public.archive_periodization_on_trainer_unassignment()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update public.training_plans
    set status = 'archived'
    where trainer_id = old.trainer_id
      and client_id = old.client_id
      and status = 'active';
    return old;
  end if;

  if old.is_active = true and new.is_active = false then
    update public.training_plans
    set status = 'archived'
    where trainer_id = old.trainer_id
      and client_id = old.client_id
      and status = 'active';
  end if;

  return new;
end;
$$;

revoke execute on function public.archive_periodization_on_trainer_unassignment()
  from public, anon, authenticated;

create trigger trainer_clients_archive_periodization
before update of is_active or delete on public.trainer_clients
for each row execute function public.archive_periodization_on_trainer_unassignment();

drop policy "trainers read owned periodization plans"
on public.training_plans;
drop policy "clients read their periodization plans"
on public.training_plans;

create policy "members read their periodization plans"
on public.training_plans for select to authenticated
using (
  trainer_id = (select auth.uid())
  or client_id = (select auth.uid())
);
