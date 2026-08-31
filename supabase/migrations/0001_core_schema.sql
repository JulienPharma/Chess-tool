-- Schéma de docs/02-ARCHITECTURE.md — appliqué sur le projet Chess-tool
-- (sponqvqqfcedkkfvasfw). Ajouts assumés par rapport au doc :
--   * owner_id partout (le magic link laisse n'importe qui devenir `authenticated`)
--   * played_on en `date` (le doc le prévoyait déjà ; la v1 le stockait en text)
--   * contrainte ease >= 1.3 (plancher SM-2 exigé par le prompt Phase 2)
create extension if not exists pgcrypto;

create table public.repertoires (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  color      char(1) not null check (color in ('w','b')),
  name       text not null,
  source     text,
  version    int not null default 1,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  unique (owner_id, color, version)
);
create index repertoires_owner_color_idx on public.repertoires (owner_id, color, version desc);

create table public.games (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  pgn        text not null,
  white      text,
  black      text,
  result     text,
  played_on  date,
  color      char(1) not null check (color in ('w','b')),
  chapter    text,
  dev_ply    int,
  dev_by     text check (dev_by in ('me','opp')),
  dev_san    text,
  book_san   text,
  analysis   jsonb
);
create index games_owner_played_idx on public.games (owner_id, played_on desc nulls last);

create table public.training_lines (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  repertoire_color char(1) not null check (repertoire_color in ('w','b')),
  chapter          text not null,
  line_key         text not null,
  ease             real not null default 2.5 check (ease >= 1.3),
  interval_days    real not null default 0,
  reps             int not null default 0,
  lapses           int not null default 0,
  due_at           timestamptz not null default now(),
  unique (owner_id, repertoire_color, chapter, line_key)
);
create index training_lines_due_idx on public.training_lines (owner_id, due_at);
