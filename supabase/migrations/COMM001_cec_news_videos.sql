-- ============================================================
-- CEC News Vídeos — subaba da Central de Conteúdos. Vínculo
-- opcional com Evento (aproveita nome/data/local/comunidade
-- automaticamente) + alcance por escopo territorial (reaproveita
-- o mesmo conceito já usado em Delegações).
-- ============================================================

create table if not exists public.cec_news_videos (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  video_url           text not null,           -- YouTube ou link externo
  cover_image_url     text,
  event_id            uuid references public.registration_events(id) on delete set null,

  -- Alcance
  scope               text not null default 'igreja' check (scope in ('nacional','sede','nucleo','distrito','setor','igreja')),
  scope_ref_id        uuid,                     -- id do estado/núcleo/distrito/setor/igreja (null quando scope='nacional')

  -- Janela de exibição
  published_at        timestamptz,
  display_start_at     timestamptz not null default now(),
  display_end_at       timestamptz,

  -- Configurações de exibição
  is_featured         boolean not null default false,
  is_pinned           boolean not null default false,
  allow_autoplay      boolean not null default false,
  show_signup_button  boolean not null default false,
  show_event_button   boolean not null default false,
  show_share_button   boolean not null default true,
  sort_order          int not null default 0,

  status              text not null default 'rascunho' check (status in ('rascunho','em_revisao','agendado','publicado','encerrado','arquivado','rejeitado','cancelado')),
  responsible_id      uuid references public.profiles(id),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.cec_news_videos enable row level security;

drop policy if exists cec_news_videos_read on public.cec_news_videos;
create policy cec_news_videos_read on public.cec_news_videos for select using (true);

drop policy if exists cec_news_videos_write on public.cec_news_videos;
create policy cec_news_videos_write on public.cec_news_videos for all to authenticated using (true) with check (true);

grant select on public.cec_news_videos to anon, authenticated;
grant insert, update, delete on public.cec_news_videos to authenticated;

-- ============================================================
-- Listagem administrativa — com nome do evento e da referência de
-- escopo já resolvidos, pra exibir na tela sem N chamadas extras.
-- ============================================================
create or replace function public.list_cec_news_videos_admin()
returns table (
  id uuid, title text, description text, video_url text, cover_image_url text,
  event_id uuid, event_name text,
  scope text, scope_ref_id uuid, scope_ref_name text,
  published_at timestamptz, display_start_at timestamptz, display_end_at timestamptz,
  is_featured boolean, is_pinned boolean, allow_autoplay boolean,
  show_signup_button boolean, show_event_button boolean, show_share_button boolean,
  sort_order int, status text, responsible_id uuid, responsible_name text,
  created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    v.id, v.title, v.description, v.video_url, v.cover_image_url,
    v.event_id, ev.name,
    v.scope, v.scope_ref_id,
    case v.scope
      when 'nacional' then 'Nacional'
      when 'sede' then (select name from public.states where id = v.scope_ref_id)
      when 'nucleo' then (select name from public.nucleos where id = v.scope_ref_id)
      when 'distrito' then (select name from public.districts where id = v.scope_ref_id)
      when 'setor' then (select name from public.sectors where id = v.scope_ref_id)
      when 'igreja' then (select name from public.churches where id = v.scope_ref_id)
    end,
    v.published_at, v.display_start_at, v.display_end_at,
    v.is_featured, v.is_pinned, v.allow_autoplay,
    v.show_signup_button, v.show_event_button, v.show_share_button,
    v.sort_order, v.status, v.responsible_id, p.full_name,
    v.created_at
  from public.cec_news_videos v
  left join public.registration_events ev on ev.id = v.event_id
  left join public.profiles p on p.id = v.responsible_id
  order by v.sort_order, v.created_at desc;
$$;
grant execute on function public.list_cec_news_videos_admin() to authenticated;

-- ============================================================
-- Feed público/do membro — resolve automaticamente o que é
-- visível conforme o vínculo do membro (ou só nacional, se
-- ninguém logado), seguindo a ordem de prioridade do documento:
-- nacional prioritário > regional > sede > igreja > data de evento
-- mais próxima > mais recente.
-- ============================================================
create or replace function public.list_visible_news_videos(p_profile_id uuid default null)
returns table (
  id uuid, title text, description text, video_url text, cover_image_url text,
  event_id uuid, event_name text, event_start_at timestamptz, event_slug text,
  scope text, is_featured boolean, is_pinned boolean, allow_autoplay boolean,
  show_signup_button boolean, show_event_button boolean, show_share_button boolean,
  published_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_church_id uuid; v_sector_id uuid; v_district_id uuid; v_nucleo_id uuid; v_state_id uuid;
begin
  if p_profile_id is not null then
    select m.church_id into v_church_id from public.members m where m.profile_id = p_profile_id;
    if v_church_id is not null then
      select ca.sector_id, ca.district_id, ca.nucleo_id, ca.state_id
        into v_sector_id, v_district_id, v_nucleo_id, v_state_id
      from public.church_ancestry ca where ca.church_id = v_church_id;
    end if;
  end if;

  return query
  select
    v.id, v.title, v.description, v.video_url, v.cover_image_url,
    v.event_id, ev.name, ev.start_at, ev.slug,
    v.scope, v.is_featured, v.is_pinned, v.allow_autoplay,
    v.show_signup_button, v.show_event_button, v.show_share_button,
    v.published_at
  from public.cec_news_videos v
  left join public.registration_events ev on ev.id = v.event_id
  where v.status = 'publicado'
    and v.display_start_at <= now()
    and (v.display_end_at is null or v.display_end_at >= now())
    and (
      v.scope = 'nacional'
      or (v.scope = 'sede' and v.scope_ref_id = v_state_id)
      or (v.scope = 'nucleo' and v.scope_ref_id = v_nucleo_id)
      or (v.scope = 'distrito' and v.scope_ref_id = v_district_id)
      or (v.scope = 'setor' and v.scope_ref_id = v_sector_id)
      or (v.scope = 'igreja' and v.scope_ref_id = v_church_id)
    )
  order by
    v.is_pinned desc,
    case v.scope when 'nacional' then 1 when 'sede' then 2 when 'nucleo' then 3 when 'distrito' then 4 when 'setor' then 5 else 6 end,
    v.is_featured desc,
    coalesce(ev.start_at, 'infinity'::timestamptz) asc,
    v.published_at desc nulls last
  limit 20;
end;
$$;
grant execute on function public.list_visible_news_videos(uuid) to anon, authenticated;
