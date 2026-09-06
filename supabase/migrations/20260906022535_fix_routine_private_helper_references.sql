-- The helper was moved to the private schema after these functions were
-- created. Recreate only affected routines from their stored definitions so
-- existing signatures and behaviour remain unchanged.
do $$
declare
  function_record record;
  corrected_definition text;
begin
  for function_record in
    select procedure.oid, pg_get_functiondef(procedure.oid) as definition
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname in (
        'save_trainer_routine',
        'save_routine_draft',
        'publish_routine_version',
        'clone_routine_version'
      )
      and pg_get_functiondef(procedure.oid) like '%public.is_active_trainer_of%'
  loop
    corrected_definition := replace(
      function_record.definition,
      'public.is_active_trainer_of',
      'private.is_active_trainer_of'
    );
    execute corrected_definition;
  end loop;
end;
$$;
