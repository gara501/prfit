-- Messages are an auditable record. They cannot be altered or deleted once sent;
-- the only permitted mutation is recording that the recipient opened it.
alter table public.trainer_client_messages
  drop constraint if exists trainer_client_messages_trainer_id_fkey,
  drop constraint if exists trainer_client_messages_client_id_fkey,
  drop constraint if exists trainer_client_messages_sender_id_fkey;

alter table public.trainer_client_messages
  add constraint trainer_client_messages_trainer_id_fkey
    foreign key (trainer_id) references public.profiles(id) on delete restrict,
  add constraint trainer_client_messages_client_id_fkey
    foreign key (client_id) references public.profiles(id) on delete restrict,
  add constraint trainer_client_messages_sender_id_fkey
    foreign key (sender_id) references public.profiles(id) on delete restrict;

create index if not exists trainer_client_messages_unread_recipient_idx
  on public.trainer_client_messages (trainer_id, client_id, sent_at desc)
  where read_at is null;

create or replace function public.guard_trainer_client_message_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.id is distinct from new.id
    or old.trainer_id is distinct from new.trainer_id
    or old.client_id is distinct from new.client_id
    or old.sender_id is distinct from new.sender_id
    or old.body is distinct from new.body
    or old.sent_at is distinct from new.sent_at
    or old.read_at is not null
    or new.read_at is null
    or old.sender_id = (select auth.uid()) then
    raise exception 'Los mensajes enviados no se pueden modificar.' using errcode = '42501';
  end if;

  new.read_at = now();
  return new;
end;
$$;

drop trigger if exists trainer_client_messages_guard_update
  on public.trainer_client_messages;
create trigger trainer_client_messages_guard_update
before update on public.trainer_client_messages
for each row execute function public.guard_trainer_client_message_update();

drop policy if exists "recipient marks received messages as read"
  on public.trainer_client_messages;
create policy "recipient marks received messages as read"
on public.trainer_client_messages
for update to authenticated
using (
  sender_id <> (select auth.uid())
  and (client_id = (select auth.uid()) or trainer_id = (select auth.uid()))
)
with check (
  sender_id <> (select auth.uid())
  and (client_id = (select auth.uid()) or trainer_id = (select auth.uid()))
);

drop policy if exists "admin reads message audit trail"
  on public.trainer_client_messages;
create policy "admin reads message audit trail"
on public.trainer_client_messages
for select to authenticated
using (
  exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'admin'
      and profile.is_active = true
  )
);
