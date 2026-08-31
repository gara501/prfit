-- Never derive authorization from raw_user_meta_data: users can edit it.
-- Accounts are born as clients; trusted server actions assign trainer/client.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, email, phone)
  values (
    new.id,
    'client',
    lower(new.email),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  );

  return new;
end;
$$;

-- Profiles are the source of truth for active application access. This hook
-- blocks a deactivated account even if it sends a previously issued JWT to the
-- Data API. It skips requests without a user id, including service-role calls.
create schema if not exists private;

create or replace function private.enforce_active_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return;
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.is_active = true
  ) then
    raise sqlstate 'PGRST' using
      message = json_build_object(
        'code', 'account_inactive',
        'message', 'La cuenta está desactivada.'
      )::text,
      detail = json_build_object('status', 403)::text;
  end if;
end;
$$;

revoke all on function private.enforce_active_account() from public;
revoke all on function private.enforce_active_account() from anon;
revoke all on function private.enforce_active_account() from authenticated;
revoke all on function private.enforce_active_account() from service_role;

grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.enforce_active_account()
  to anon, authenticated, service_role;

alter role authenticator
  set pgrst.db_pre_request = 'private.enforce_active_account';

notify pgrst, 'reload config';
