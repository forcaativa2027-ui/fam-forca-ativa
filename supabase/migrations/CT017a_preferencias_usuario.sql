-- ============================================================
-- CT-017 — Central de Acessibilidade e Personalização. Fase 1:
-- infraestrutura básica (tema + tamanho de fonte). A coluna
-- "extra" (jsonb) existe desde já pra guardar as preferências das
-- próximas fases (som, vibração, contraste, espaçamento, perfil
-- inteligente, etc.) sem precisar de nova migration de schema
-- toda vez que uma fase nova for implementada.
-- ============================================================

create table if not exists public.user_preferences (
  profile_id  uuid primary key references public.profiles(id) on delete cascade,
  theme       text not null default 'claro' check (theme in ('claro','escuro','automatico')),
  font_size   text not null default 'media' check (font_size in ('pequena','media','grande','extra_grande')),
  extra       jsonb not null default '{}'::jsonb,
  onboarded   boolean not null default false,  -- já passou pela tela de primeiro acesso?
  updated_at  timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists user_preferences_own on public.user_preferences;
create policy user_preferences_own on public.user_preferences for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

grant select, insert, update on public.user_preferences to authenticated;
