-- CEC Academy — Media Objects & Playback States (ACA-B05)
-- Cada mídia é um "Objeto de Conhecimento" catalogado e reutilizável.
-- Suporta vídeo, áudio, PDF, modelo 3D e imagem.
-- Inclui legendas, capítulos, audiodescrição e estado de reprodução.

-- ─── Media Objects ─────────────────────────────────────────────
create table if not exists public.media_objects (
  id                      uuid primary key default gen_random_uuid(),
  course_id               uuid references public.courses(id) on delete cascade,
  lesson_id               uuid references public.course_lessons(id) on delete cascade,
  title                   text not null,
  description             text,
  kind                    text not null check (kind in ('video','audio','pdf','model_3d','image')),
  url                     text not null,
  mime_type               text,
  size_bytes              bigint,
  duration_seconds        int check (duration_seconds >= 0),
  thumbnail_url           text,
  chapters                jsonb,
  subtitles               jsonb,
  audio_description_url   text,
  accessibility_features  text[] default '{}',
  order_index             int default 0,
  is_active               boolean default true,
  created_at              timestamptz not null default now()
);

create index if not exists idx_media_objects_course on public.media_objects(course_id);
create index if not exists idx_media_objects_lesson on public.media_objects(lesson_id);

-- ─── Playback States (continuidade de reprodução) ──────────────
create table if not exists public.media_playback_states (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  media_id        uuid not null references public.media_objects(id) on delete cascade,
  current_time    numeric(10,2) not null default 0,
  duration        numeric(10,2) not null default 0,
  playback_rate   numeric(3,2) not null default 1.00,
  is_finished     boolean not null default false,
  last_updated_at timestamptz not null default now(),
  unique(profile_id, media_id)
);

create index if not exists idx_media_playback_profile on public.media_playback_states(profile_id);

-- RLS: mídia é pública (qualquer membro pode ver)
alter table public.media_objects enable row level security;

create policy "Membros veem mídia ativa"
  on public.media_objects
  for select
  using (is_active = true);

-- Playback state é privado (só o dono vê)
alter table public.media_playback_states enable row level security;

create policy "Membros veem seu próprio progresso"
  on public.media_playback_states
  for select
  using (profile_id = auth.uid());

create policy "Membros salvam seu próprio progresso"
  on public.media_playback_states
  for insert
  with check (profile_id = auth.uid());

create policy "Membros atualizam seu próprio progresso"
  on public.media_playback_states
  for update
  using (profile_id = auth.uid());
