create table public.health_screenings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  version integer not null check (version > 0),
  questionnaire_version text not null default 'cardonafit-2026-01',
  has_critical_risk boolean not null,
  payload_ciphertext text not null,
  encryption_iv text not null,
  encryption_tag text not null,
  encryption_key_version smallint not null default 1 check (encryption_key_version > 0),
  content_hash text not null,
  consent_version text not null,
  privacy_notice_version text not null,
  submitted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (client_id, version),
  check (expires_at > submitted_at)
);

create index health_screenings_client_submitted_idx
  on public.health_screenings (client_id, submitted_at desc);

create table public.health_screening_reviews (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null references public.health_screenings(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  decision text not null check (
    decision in ('cleared', 'cleared_with_restrictions', 'medical_clearance_required')
  ),
  notes_ciphertext text,
  encryption_iv text,
  encryption_tag text,
  encryption_key_version smallint check (encryption_key_version is null or encryption_key_version > 0),
  reviewed_at timestamptz not null default now(),
  check (
    (notes_ciphertext is null and encryption_iv is null and encryption_tag is null)
    or (notes_ciphertext is not null and encryption_iv is not null and encryption_tag is not null)
  )
);

create index health_screening_reviews_screening_idx
  on public.health_screening_reviews (screening_id, reviewed_at desc);

create table public.health_documents (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null references public.health_screenings(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  purpose text not null check (purpose in ('official_parq_plus', 'medical_clearance')),
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 180),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now()
);

create index health_documents_screening_idx
  on public.health_documents (screening_id, created_at desc);

create table public.health_audit_events (
  id bigint generated always as identity primary key,
  client_id uuid not null references public.profiles(id) on delete cascade,
  screening_id uuid references public.health_screenings(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('screening_submitted', 'review_recorded', 'document_uploaded')),
  created_at timestamptz not null default now()
);

create index health_audit_events_client_idx
  on public.health_audit_events (client_id, created_at desc);

alter table public.routines
  add column intensity_level smallint not null default 3
    check (intensity_level between 1 and 5);

alter table public.health_screenings enable row level security;
alter table public.health_screening_reviews enable row level security;
alter table public.health_documents enable row level security;
alter table public.health_audit_events enable row level security;

create policy health_screenings_select_authorized
on public.health_screenings for select to authenticated
using (
  client_id = (select auth.uid())
  or private.is_active_trainer_of(client_id)
  or private.is_admin()
);

create policy health_screenings_insert_own
on public.health_screenings for insert to authenticated
with check (
  client_id = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'client' and is_active = true
  )
);

create policy health_reviews_select_authorized
on public.health_screening_reviews for select to authenticated
using (
  exists (
    select 1 from public.health_screenings screening
    where screening.id = screening_id
      and (
        screening.client_id = (select auth.uid())
        or private.is_active_trainer_of(screening.client_id)
        or private.is_admin()
      )
  )
);

create policy health_reviews_insert_assigned_trainer
on public.health_screening_reviews for insert to authenticated
with check (
  trainer_id = (select auth.uid())
  and exists (
    select 1 from public.health_screenings screening
    where screening.id = screening_id
      and private.is_active_trainer_of(screening.client_id)
  )
);

create policy health_documents_select_authorized
on public.health_documents for select to authenticated
using (
  client_id = (select auth.uid())
  or private.is_active_trainer_of(client_id)
  or private.is_admin()
);

create policy health_documents_insert_own
on public.health_documents for insert to authenticated
with check (
  client_id = (select auth.uid())
  and uploaded_by = (select auth.uid())
  and exists (
    select 1 from public.health_screenings screening
    where screening.id = screening_id and screening.client_id = (select auth.uid())
  )
);

create policy health_audit_select_authorized
on public.health_audit_events for select to authenticated
using (
  client_id = (select auth.uid())
  or private.is_active_trainer_of(client_id)
  or private.is_admin()
);

create function public.record_health_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_client_id uuid;
  event_screening_id uuid;
  event_action text;
begin
  if tg_table_name = 'health_screenings' then
    event_client_id := new.client_id;
    event_screening_id := new.id;
    event_action := 'screening_submitted';
  elsif tg_table_name = 'health_screening_reviews' then
    select client_id into event_client_id
    from public.health_screenings where id = new.screening_id;
    event_screening_id := new.screening_id;
    event_action := 'review_recorded';
  else
    event_client_id := new.client_id;
    event_screening_id := new.screening_id;
    event_action := 'document_uploaded';
  end if;

  insert into public.health_audit_events (
    client_id, screening_id, actor_id, action
  ) values (
    event_client_id, event_screening_id, auth.uid(), event_action
  );
  return new;
end;
$$;

revoke all on function public.record_health_audit_event() from public, anon, authenticated;

create trigger health_screenings_audit
after insert on public.health_screenings
for each row execute function public.record_health_audit_event();

create trigger health_reviews_audit
after insert on public.health_screening_reviews
for each row execute function public.record_health_audit_event();

create trigger health_documents_audit
after insert on public.health_documents
for each row execute function public.record_health_audit_event();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-documents',
  'medical-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy medical_documents_insert_own_folder
on storage.objects for insert to authenticated
with check (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy medical_documents_select_authorized
on storage.objects for select to authenticated
using (
  bucket_id = 'medical-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or private.is_active_trainer_of(((storage.foldername(name))[1])::uuid)
    or private.is_admin()
  )
);

create function public.guard_high_intensity_health_clearance()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  effective_intensity smallint;
  latest_screening public.health_screenings%rowtype;
  latest_decision text;
begin
  if new.status <> 'published' or old.status = 'published' then
    return new;
  end if;

  effective_intensity := new.intensity_level;
  if new.microcycle_id is not null then
    select greatest(effective_intensity, microcycle.intensity_level)
      into effective_intensity
    from public.training_microcycles microcycle
    where microcycle.id = new.microcycle_id;
  end if;

  if effective_intensity < 4 then
    return new;
  end if;

  select * into latest_screening
  from public.health_screenings
  where client_id = new.client_id
  order by submitted_at desc
  limit 1;

  if latest_screening.id is null
    or latest_screening.has_critical_risk = false then
    return new;
  end if;

  select decision into latest_decision
  from public.health_screening_reviews
  where screening_id = latest_screening.id
  order by reviewed_at desc
  limit 1;

  if latest_screening.expires_at <= now()
    or latest_decision is null
    or latest_decision = 'medical_clearance_required' then
    raise exception 'Revisa la evaluación de salud del cliente antes de publicar una rutina de intensidad alta.';
  end if;

  return new;
end;
$$;

create trigger routines_guard_high_intensity_health
before update of status on public.routines
for each row execute function public.guard_high_intensity_health_clearance();

grant select, insert on public.health_screenings to authenticated;
grant select, insert on public.health_screening_reviews to authenticated;
grant select, insert on public.health_documents to authenticated;
grant select on public.health_audit_events to authenticated;
grant update (intensity_level) on public.routines to authenticated;
