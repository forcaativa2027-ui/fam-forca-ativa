-- ============================================================
-- CEC Academy — Bíblia Integrada, hospedada no nosso próprio
-- banco. Substitui a dependência da API externa (que se mostrou
-- instável) por uma tabela nossa, com o texto completo.
--
-- Fonte do texto: tradução ACF (Almeida Corrigida Fiel), de
-- domínio público / livre distribuição, compilada por
-- thiagobodruk/biblia (github.com/thiagobodruk/biblia), licença
-- Creative Commons BY-NC — uso não-comercial, o que cobre o uso
-- da CEC Family (plataforma sem fins lucrativos).
-- ============================================================

create table if not exists public.bible_books (
  abbrev      text primary key,
  name        text not null,
  testament   text not null check (testament in ('VT','NT')),
  chapters    int not null,
  order_index int not null
);
alter table public.bible_books enable row level security;
drop policy if exists bb_read on public.bible_books;
create policy bb_read on public.bible_books for select to authenticated, anon using (true);
grant select on public.bible_books to authenticated, anon;

create table if not exists public.bible_verses (
  id          bigint generated always as identity primary key,
  version     text not null default 'acf',
  book_abbrev text not null references public.bible_books(abbrev),
  chapter     int not null,
  verse       int not null,
  text        text not null,
  unique (version, book_abbrev, chapter, verse)
);
create index if not exists idx_bible_verses_lookup on public.bible_verses(version, book_abbrev, chapter);
alter table public.bible_verses enable row level security;
drop policy if exists bv_read on public.bible_verses;
create policy bv_read on public.bible_verses for select to authenticated, anon using (true);
grant select on public.bible_verses to authenticated, anon;

-- ============================================================
-- Livros da Bíblia (a "estante" — nomes, ordem, testamento)
-- ============================================================
insert into public.bible_books (abbrev, name, testament, chapters, order_index) values
('gn','Gênesis','VT',50,1),('ex','Êxodo','VT',40,2),('lv','Levítico','VT',27,3),('nm','Números','VT',36,4),
('dt','Deuteronômio','VT',34,5),('js','Josué','VT',24,6),('jz','Juízes','VT',21,7),('rt','Rute','VT',4,8),
('1sm','1 Samuel','VT',31,9),('2sm','2 Samuel','VT',24,10),('1rs','1 Reis','VT',22,11),('2rs','2 Reis','VT',25,12),
('1cr','1 Crônicas','VT',29,13),('2cr','2 Crônicas','VT',36,14),('ed','Esdras','VT',10,15),('ne','Neemias','VT',13,16),
('et','Ester','VT',10,17),('job','Jó','VT',42,18),('sl','Salmos','VT',150,19),('pv','Provérbios','VT',31,20),
('ec','Eclesiastes','VT',12,21),('ct','Cântico dos Cânticos','VT',8,22),('is','Isaías','VT',66,23),('jr','Jeremias','VT',52,24),
('lm','Lamentações','VT',5,25),('ez','Ezequiel','VT',48,26),('dn','Daniel','VT',12,27),('os','Oséias','VT',14,28),
('jl','Joel','VT',3,29),('am','Amós','VT',9,30),('ob','Obadias','VT',1,31),('jn','Jonas','VT',4,32),
('mq','Miquéias','VT',7,33),('na','Naum','VT',3,34),('hc','Habacuque','VT',3,35),('sf','Sofonias','VT',3,36),
('ag','Ageu','VT',2,37),('zc','Zacarias','VT',14,38),('ml','Malaquias','VT',4,39),
('mt','Mateus','NT',28,40),('mc','Marcos','NT',16,41),('lc','Lucas','NT',24,42),('jo','João','NT',21,43),
('at','Atos','NT',28,44),('rm','Romanos','NT',16,45),('1co','1 Coríntios','NT',16,46),('2co','2 Coríntios','NT',13,47),
('gl','Gálatas','NT',6,48),('ef','Efésios','NT',6,49),('fp','Filipenses','NT',4,50),('cl','Colossenses','NT',4,51),
('1ts','1 Tessalonicenses','NT',5,52),('2ts','2 Tessalonicenses','NT',3,53),('1tm','1 Timóteo','NT',6,54),('2tm','2 Timóteo','NT',4,55),
('tt','Tito','NT',3,56),('fm','Filemom','NT',1,57),('hb','Hebreus','NT',13,58),('tg','Tiago','NT',5,59),
('1pe','1 Pedro','NT',5,60),('2pe','2 Pedro','NT',3,61),('1jo','1 João','NT',5,62),('2jo','2 João','NT',1,63),
('3jo','3 João','NT',1,64),('jd','Judas','NT',1,65),('ap','Apocalipse','NT',22,66)
on conflict (abbrev) do nothing;

-- ============================================================
-- Função de leitura (mesmo formato que o app já espera — livro
-- + capítulo + lista de versículos, numa chamada só)
-- ============================================================
create or replace function public.get_bible_chapter(p_version text, p_book_abbrev text, p_chapter int)
returns table (verse int, text text)
language sql stable security definer set search_path = public as $$
  select verse, text from public.bible_verses
  where version = p_version and book_abbrev = p_book_abbrev and chapter = p_chapter
  order by verse;
$$;
grant execute on function public.get_bible_chapter(text, text, int) to authenticated, anon;
