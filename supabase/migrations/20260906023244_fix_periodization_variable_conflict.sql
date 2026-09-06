-- Rename the conflicting PL/pgSQL variables in the stored definition while
-- preserving the two actual mesocycle_id column references.
do $$
declare
  stored_definition text;
begin
  select pg_get_functiondef(procedure.oid)
    into stored_definition
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname = 'save_periodization_plan'
  limit 1;

  if stored_definition is null then
    raise exception 'No se encontró public.save_periodization_plan.';
  end if;

  stored_definition := replace(
    stored_definition,
    'mesocycle_id',
    'saved_mesocycle_id'
  );
  stored_definition := replace(
    stored_definition,
    'microcycle_id',
    'saved_microcycle_id'
  );
  stored_definition := replace(
    stored_definition,
    'saved_mesocycle_id = saved_mesocycle_id',
    'mesocycle_id = saved_mesocycle_id'
  );
  stored_definition := replace(
    stored_definition,
    'training_plan_id, saved_mesocycle_id, position',
    'training_plan_id, mesocycle_id, position'
  );
  stored_definition := replace(
    stored_definition,
    'saved_mesocycle_ids uuid[] := ''{}''',
    'saved_mesocycle_ids uuid[] := array[]::uuid[]'
  );
  stored_definition := replace(
    stored_definition,
    'saved_microcycle_ids uuid[] := ''{}''',
    'saved_microcycle_ids uuid[] := array[]::uuid[]'
  );

  execute stored_definition;
end;
$$;
