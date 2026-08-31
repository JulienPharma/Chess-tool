alter table public.repertoires    enable row level security;
alter table public.games          enable row level security;
alter table public.training_lines enable row level security;
alter table public.videos         enable row level security;
alter table public.video_notes    enable row level security;

create policy repertoires_own on public.repertoires for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy games_own on public.games for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy training_lines_own on public.training_lines for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy videos_own on public.videos for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- video_notes n'a pas d'owner_id : on passe par le parent
create policy video_notes_own on public.video_notes for all to authenticated
  using (exists (select 1 from public.videos v where v.id = video_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.videos v where v.id = video_id and v.owner_id = auth.uid()));

revoke all on public.repertoires    from anon;
revoke all on public.games          from anon;
revoke all on public.training_lines from anon;
revoke all on public.videos         from anon;
revoke all on public.video_notes    from anon;
