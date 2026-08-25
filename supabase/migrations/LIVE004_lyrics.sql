-- ============================================================
-- CEC FAMILY — Live-360: repertório de louvor (Slice 2).
-- Tabela live_lyrics + RLS + RPCs de CRUD e leitura do on-air.
-- Padrão das demais migrations live_* e radio_*.
-- ============================================================

-- ── Tabela de repertório ──
create table if not exists public.live_lyrics (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid references public.churches(id) on delete cascade,
  title       text not null,
  author      text,
  lyrics      jsonb not null default '[]'::jsonb, -- [{type:'verse'|'chorus'|'bridge'|'ending', lines:[...]}]
  tags        text[] not null default '{}',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_live_lyrics_church on public.live_lyrics(church_id);
create index if not exists idx_live_lyrics_title on public.live_lyrics(church_id, lower(title));
drop trigger if exists trg_live_lyrics_updated on public.live_lyrics;
create trigger trg_live_lyrics_updated before update on public.live_lyrics
  for each row execute function public.set_updated_at();

alter table public.live_lyrics enable row level security;

-- CRUD admin; a projeção nunca lê o repertório completo (só via RPC do item no ar).
drop policy if exists live_lyrics_admin_all on public.live_lyrics;
create policy live_lyrics_admin_all on public.live_lyrics
  for all to authenticated using (is_admin()) with check (is_admin());

-- ── Listar repertório (admin) ──
create or replace function public.live_list_lyrics(p_church_id uuid, p_search text default null)
returns setof public.live_lyrics
language sql stable security definer set search_path = public as $$
  select l.*
    from public.live_lyrics l
   where l.church_id = p_church_id
     and (p_search is null or l.title ilike '%' || p_search || '%' or l.author ilike '%' || p_search || '%')
   order by l.title;
$$;
grant execute on function public.live_list_lyrics(uuid, text) to authenticated;

-- ── Salvar (criar/atualizar) um hino do repertório (admin) ──
create or replace function public.live_save_lyric(
  p_id uuid default null,
  p_church_id uuid default null,
  p_title text default null,
  p_author text default null,
  p_lyrics jsonb default '[]'::jsonb,
  p_tags text[] default '{}'::text[]
) returns public.live_lyrics
language plpgsql security definer set search_path = public as $$
declare
  v_row public.live_lyrics;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito';
  end if;
  if p_church_id is null then
    raise exception 'Igreja obrigatória';
  end if;
  if p_title is null or trim(p_title) = '' then
    raise exception 'Título obrigatório';
  end if;

  if p_id is null then
    insert into public.live_lyrics (church_id, title, author, lyrics, tags, created_by)
    values (p_church_id, trim(p_title), p_author, p_lyrics, p_tags, auth.uid())
    returning * into v_row;
  else
    update public.live_lyrics
       set title = trim(p_title), author = p_author, lyrics = p_lyrics, tags = p_tags
     where id = p_id and church_id = p_church_id
    returning * into v_row;
    if v_row is null then
      raise exception 'Hino não encontrado';
    end if;
  end if;

  return v_row;
end $$;
grant execute on function public.live_save_lyric(uuid, uuid, text, text, jsonb, text[])
  to authenticated;

-- ── Excluir hino (admin) ──
create or replace function public.live_delete_lyric(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito';
  end if;
  delete from public.live_lyrics where id = p_id;
end $$;
grant execute on function public.live_delete_lyric(uuid) to authenticated;

-- ── Lê a letra COMPLETA do item que está no ar (datashow).
-- Expõe exclusivamente a letra do item atual, nunca o repertório inteiro.
create or replace function public.live_get_onair_lyric(p_session_id uuid)
returns table (id uuid, title text, author text, lyrics jsonb)
language sql stable security definer set search_path = public as $$
  select l.id, l.title, l.author, l.lyrics
    from public.live_current_item c
    join public.live_lyrics l on l.id = c.ref::uuid
   where c.session_id = p_session_id and c.kind = 'lyric';
$$;
grant execute on function public.live_get_onair_lyric(uuid) to authenticated, anon;

-- ── Lista o repertório da sessão para um portador de token válido (controle sem login).
-- Não expõe church_id; valida o token da própria sessão antes de devolver.
create or replace function public.live_list_lyrics_by_token(p_session_id uuid, p_token text)
returns setof public.live_lyrics
language plpgsql stable security definer set search_path = public as $$
declare
  v_church_id uuid;
begin
  select s.church_id into v_church_id
    from public.live_sessions s
    join public.live_control_tokens t
      on t.session_id = s.id
     and t.token = encode(sha256(p_token::bytea), 'hex')
     and t.expires_at > now()
     and t.revoked_at is null
   where s.id = p_session_id
     and t.role = 'operator';
  if v_church_id is null then
    raise exception 'Token inválido ou expirado';
  end if;
  return query select l.* from public.live_lyrics l where l.church_id = v_church_id order by l.title;
end $$;
grant execute on function public.live_list_lyrics_by_token(uuid, text) to authenticated, anon;