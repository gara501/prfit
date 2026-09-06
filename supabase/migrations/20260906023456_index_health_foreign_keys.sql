create index health_screening_reviews_trainer_idx
  on public.health_screening_reviews (trainer_id);

create index health_documents_client_idx
  on public.health_documents (client_id);

create index health_documents_uploaded_by_idx
  on public.health_documents (uploaded_by);

create index health_audit_events_screening_idx
  on public.health_audit_events (screening_id);

create index health_audit_events_actor_idx
  on public.health_audit_events (actor_id);
