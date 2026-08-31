drop policy if exists "trainer updates body composition" on public.body_compositions;

create policy "trainer updates body composition"
on public.body_compositions
for update
to authenticated
using (
  trainer_id = (select auth.uid())
  and is_active_trainer_of(client_id)
)
with check (
  trainer_id = (select auth.uid())
  and is_active_trainer_of(client_id)
);

create unique index body_compositions_client_date_unique
  on public.body_compositions (client_id, date);
create index body_compositions_trainer_date_idx
  on public.body_compositions (trainer_id, date desc);

alter table public.body_compositions
  add constraint body_compositions_weight_check check (weight is null or weight between 20 and 400),
  add constraint body_compositions_height_check check (height is null or height between 50 and 260),
  add constraint body_compositions_fat_percentage_check check (fat_percentage is null or fat_percentage between 1 and 75),
  add constraint body_compositions_neck_check check (neck is null or neck between 10 and 100),
  add constraint body_compositions_chest_check check (chest is null or chest between 20 and 300),
  add constraint body_compositions_shoulders_check check (shoulders is null or shoulders between 20 and 300),
  add constraint body_compositions_waist_check check (waist is null or waist between 20 and 300),
  add constraint body_compositions_hips_check check (hips is null or hips between 20 and 300),
  add constraint body_compositions_right_arm_check check (right_arm is null or right_arm between 10 and 100),
  add constraint body_compositions_left_arm_check check (left_arm is null or left_arm between 10 and 100),
  add constraint body_compositions_right_leg_check check (right_leg is null or right_leg between 15 and 150),
  add constraint body_compositions_left_leg_check check (left_leg is null or left_leg between 15 and 150),
  add constraint body_compositions_notes_length_check check (notes is null or char_length(notes) <= 2000);
