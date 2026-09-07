create table public.trainer_client_private_contexts (
  trainer_id uuid not null references public.profiles(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete restrict,
  goals text not null default '',
  restrictions text not null default '',
  private_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (trainer_id, client_id),
  check (char_length(goals) <= 4000),
  check (char_length(restrictions) <= 4000),
  check (char_length(private_notes) <= 8000)
);

alter table public.trainer_client_private_contexts enable row level security;
grant select, insert, update on public.trainer_client_private_contexts to authenticated;

create policy "trainer manages assigned client private context"
on public.trainer_client_private_contexts
for all to authenticated
using (
  trainer_id = (select auth.uid())
  and (select private.is_active_trainer_of(client_id))
)
with check (
  trainer_id = (select auth.uid())
  and (select private.is_active_trainer_of(client_id))
);

create or replace function public.set_trainer_client_private_context_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger trainer_client_private_contexts_updated_at
before update on public.trainer_client_private_contexts
for each row execute function public.set_trainer_client_private_context_updated_at();
