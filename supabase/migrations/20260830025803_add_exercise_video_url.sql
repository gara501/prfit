alter table public.exercises
  add column video_url text;

alter table public.exercises
  add constraint exercises_video_url_check
  check (
    video_url is null
    or (
      char_length(video_url) <= 2048
      and video_url ~ '^https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]{11}$'
    )
  );

comment on column public.exercises.video_url is
  'Optional canonical HTTPS YouTube URL used as an exercise example.';
