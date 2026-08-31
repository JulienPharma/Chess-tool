-- Coach vidéo (exploité en phase 7, posé dès la phase 0 avec le reste du schéma)
create table public.videos (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  url          text not null,
  title        text,
  chapter_hint text,
  transcript   text,
  created_at   timestamptz not null default now()
);
create index videos_owner_idx on public.videos (owner_id, created_at desc);

create table public.video_notes (
  id        uuid primary key default gen_random_uuid(),
  video_id  uuid not null references public.videos(id) on delete cascade,
  fen_key   text,
  t_seconds int,
  note      text not null
);
create index video_notes_video_idx on public.video_notes (video_id);
create index video_notes_fen_idx   on public.video_notes (fen_key);
