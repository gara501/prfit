-- Administrative attributes must never be writable through a user's JWT.
revoke update on public.profiles from public, anon, authenticated;
grant update (first_name, last_name, birth_date, phone) on public.profiles to authenticated;

-- Ciphertext and derived health decisions enter through trusted server code.
revoke insert, update, delete on public.health_screenings, public.health_screening_reviews, public.health_documents from public, anon, authenticated;
grant select, insert, update, delete on public.health_screenings, public.health_screening_reviews, public.health_documents to service_role;

-- NOT VALID preserves historical records for manual review, while enforcing all new writes.
alter table public.health_documents add constraint health_document_owned_path check (
  storage_path ~ ('^' || client_id::text || '/' || screening_id::text || '/[0-9a-fA-F-]{36}\.(pdf|png|jpg)$')
) not valid;

create function public.submit_encrypted_health_screening(p_client_id uuid, p_has_critical_risk boolean, p_encrypted jsonb, p_content_hash text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare result_id uuid; next_version integer;
begin
  perform 1 from public.profiles where id = p_client_id and role = 'client' and is_active and not must_change_password for update;
  if not found then raise exception 'Cliente no autorizado.' using errcode = '42501'; end if;
  select coalesce(max(version), 0) + 1 into next_version from public.health_screenings where client_id = p_client_id;
  insert into public.health_screenings(client_id, version, has_critical_risk, payload_ciphertext, encryption_iv, encryption_tag, encryption_key_version, content_hash, consent_version, privacy_notice_version, submitted_at, expires_at)
  values (p_client_id, next_version, p_has_critical_risk, p_encrypted->>'ciphertext', p_encrypted->>'iv', p_encrypted->>'tag', (p_encrypted->>'keyVersion')::smallint, p_content_hash, 'health-consent-co-2026-01', 'privacy-health-co-2026-01', now(), now() + interval '1 year') returning id into result_id;
  return result_id;
end; $$;
revoke all on function public.submit_encrypted_health_screening(uuid,boolean,jsonb,text) from public, anon, authenticated;
grant execute on function public.submit_encrypted_health_screening(uuid,boolean,jsonb,text) to service_role;

create function public.record_encrypted_health_review(p_trainer_id uuid, p_client_id uuid, p_screening_id uuid, p_decision text, p_encrypted jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare result_id uuid;
begin
  perform 1 from public.trainer_clients l join public.profiles p on p.id=l.trainer_id
    where l.trainer_id=p_trainer_id and l.client_id=p_client_id and l.is_active and p.role='trainer' and p.is_active and not p.must_change_password for update of l;
  if not found then raise exception 'Cliente no asignado.' using errcode = '42501'; end if;
  perform 1 from public.health_screenings where id=p_screening_id and client_id=p_client_id;
  if not found then raise exception 'Evaluación no autorizada.' using errcode = '42501'; end if;
  insert into public.health_screening_reviews(screening_id,trainer_id,decision,notes_ciphertext,encryption_iv,encryption_tag,encryption_key_version)
  values(p_screening_id,p_trainer_id,p_decision,p_encrypted->>'ciphertext',p_encrypted->>'iv',p_encrypted->>'tag',(p_encrypted->>'keyVersion')::smallint) returning id into result_id;
  return result_id;
end; $$;
revoke all on function public.record_encrypted_health_review(uuid,uuid,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.record_encrypted_health_review(uuid,uuid,uuid,text,jsonb) to service_role;

-- Server-originated health writes still record the responsible account.
create or replace function public.record_health_audit_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare event_client_id uuid; event_screening_id uuid; event_action text; event_actor_id uuid;
begin
  if tg_table_name = 'health_screenings' then
    event_client_id := new.client_id; event_screening_id := new.id; event_action := 'screening_submitted'; event_actor_id := new.client_id;
  elsif tg_table_name = 'health_screening_reviews' then
    select client_id into event_client_id from public.health_screenings where id=new.screening_id;
    event_screening_id := new.screening_id; event_action := 'review_recorded'; event_actor_id := new.trainer_id;
  else
    event_client_id := new.client_id; event_screening_id := new.screening_id; event_action := 'document_uploaded'; event_actor_id := new.uploaded_by;
  end if;
  insert into public.health_audit_events(client_id,screening_id,actor_id,action) values(event_client_id,event_screening_id,event_actor_id,event_action);
  return new;
end; $$;
revoke all on function public.record_health_audit_event() from public, anon, authenticated;

create policy "trainers delete exercise body zones" on public.exercise_body_zones for delete to authenticated
using (exists(select 1 from public.profiles where id=(select auth.uid()) and role='trainer' and is_active));
create policy "trainers delete exercise equipment" on public.exercise_equipment for delete to authenticated
using (exists(select 1 from public.profiles where id=(select auth.uid()) and role='trainer' and is_active));
grant delete on public.exercise_body_zones, public.exercise_equipment to authenticated;
create function public.save_exercise_catalog(p_exercise_id uuid, p_name text, p_image_url text, p_video_url text, p_body_zone_ids uuid[], p_equipment_ids uuid[])
returns uuid language plpgsql security invoker set search_path = public as $$
declare saved_id uuid;
begin
  if not exists(select 1 from public.profiles where id=(select auth.uid()) and role='trainer' and is_active and not must_change_password) then
    raise exception 'Entrenador no autorizado.' using errcode='42501';
  end if;
  if char_length(trim(p_name)) not between 2 and 100 then raise exception 'Nombre inválido.'; end if;
  if p_exercise_id is null then
    insert into public.exercises(name,image_url,video_url,created_by) values(trim(p_name),p_image_url,p_video_url,auth.uid()) returning id into saved_id;
  else
    update public.exercises set name=trim(p_name),image_url=p_image_url,video_url=p_video_url where id=p_exercise_id returning id into saved_id;
    if saved_id is null then raise exception 'Ejercicio no encontrado.'; end if;
  end if;
  delete from public.exercise_body_zones where exercise_id=saved_id;
  delete from public.exercise_equipment where exercise_id=saved_id;
  insert into public.exercise_body_zones(exercise_id,body_zone_id) select saved_id, id from (select distinct unnest(p_body_zone_ids) as id) ids;
  insert into public.exercise_equipment(exercise_id,equipment_id) select saved_id, id from (select distinct unnest(p_equipment_ids) as id) ids;
  return saved_id;
end; $$;
revoke all on function public.save_exercise_catalog(uuid,text,text,text,uuid[],uuid[]) from public, anon;
grant execute on function public.save_exercise_catalog(uuid,text,text,text,uuid[],uuid[]) to authenticated;

-- One row per active client; histories stay in Postgres.
create function public.list_trainer_client_summaries()
returns setof jsonb language sql stable security invoker set search_path = public as $$
select jsonb_build_object(
 'id', p.id, 'firstName',coalesce(p.first_name,''),'lastName',coalesce(p.last_name,''),
 'email',coalesce(p.email,''),'phone',coalesce(p.phone,''),'birthDate',coalesce(p.birth_date::text,''),'registerDate',p.register_date,
 'routineCount',(select count(*) from public.routines r where r.client_id=p.id),
 'activeRoutineCount',(select count(*) from public.routines r where r.client_id=p.id and r.status='published' and r.is_active),
 'activeRoutineId',coalesce(active.id::text,''),'activeRoutineName',coalesce(active.name,''),
 'sessionCount',(select count(*) from public.workout_sessions s where s.client_id=p.id),
 'lastSessionAt',coalesce(last_session.date::text,''),'latestWeight',measurement.weight,'latestFatPercentage',measurement.fat_percentage,
 'latestMeasurementDate',coalesce(measurement.date::text,''),
 'activityStatus',case when last_session.date=(now() at time zone 'America/Bogota')::date then 'trained_today'
   when last_session.date is null or last_session.date <= (now() at time zone 'America/Bogota')::date-7 then 'inactive' else 'pending' end
)
from public.trainer_clients l join public.profiles p on p.id=l.client_id
left join lateral (select r.id,r.name from public.routines r where r.client_id=p.id and r.status='published' and r.is_active
 and r.start_date <= (now() at time zone 'America/Bogota')::date and (r.end_date is null or r.end_date >= (now() at time zone 'America/Bogota')::date) order by r.start_date desc,r.id limit 1) active on true
left join lateral (select s.date from public.workout_sessions s where s.client_id=p.id order by s.date desc,s.id limit 1) last_session on true
left join lateral (select m.date,m.weight,m.fat_percentage from public.body_compositions m where m.client_id=p.id order by m.date desc,m.id limit 1) measurement on true
where l.trainer_id=(select auth.uid()) and l.is_active and p.is_active
order by p.first_name,p.last_name,p.id;
$$;
revoke all on function public.list_trainer_client_summaries() from public,anon;
grant execute on function public.list_trainer_client_summaries() to authenticated;

create function public.list_trainer_health_summaries()
returns table(client_id uuid, first_name text,last_name text,screening_id uuid,version integer,has_critical_risk boolean,submitted_at timestamptz,expires_at timestamptz,decision text)
language sql stable security invoker set search_path=public as $$
select p.id,p.first_name,p.last_name,s.id,s.version,s.has_critical_risk,s.submitted_at,s.expires_at,r.decision
from public.trainer_clients l join public.profiles p on p.id=l.client_id
left join lateral (select s.* from public.health_screenings s where s.client_id=p.id order by s.submitted_at desc,s.id limit 1) s on true
left join lateral (select r.decision from public.health_screening_reviews r where r.screening_id=s.id order by r.reviewed_at desc,r.id limit 1) r on true
where l.trainer_id=(select auth.uid()) and l.is_active and p.is_active order by p.id;
$$;
revoke all on function public.list_trainer_health_summaries() from public,anon;
grant execute on function public.list_trainer_health_summaries() to authenticated;
create index if not exists workout_sessions_client_date_idx on public.workout_sessions(client_id,date desc,id);
create index if not exists routines_client_start_idx on public.routines(client_id,start_date desc,id);
