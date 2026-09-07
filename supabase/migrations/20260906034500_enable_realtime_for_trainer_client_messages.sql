-- Realtime is intentionally limited to the auditable chat table. Row-level
-- security continues to authorize every delivered change.
do $$
begin
  alter publication supabase_realtime add table public.trainer_client_messages;
exception
  when duplicate_object then null;
end;
$$;
