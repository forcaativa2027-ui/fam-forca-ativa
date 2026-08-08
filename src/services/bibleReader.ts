"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BibleBook, BibleChapter, BibleHighlight, BibleAnnotation, BibleBookmark, BibleRecentRead,
  BibleReadingMode, BibleReadingProgress,
} from "@/types/domain";

/**
 * CEC Academy — Bíblia Integrada. O texto bíblico vem do nosso
 * próprio banco (bible_books/bible_verses), sem dependência de
 * nenhuma API externa. Passamos pelas rotas /api/bible/* pra
 * manter a mesma interface caso a fonte mude no futuro.
 */
export async function listBooks(): Promise<BibleBook[]> {
  try {
    const res = await fetch("/api/bible/books");
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function getChapter(version: string, bookAbbrev: string, chapter: number): Promise<BibleChapter | null> {
  try {
    const res = await fetch(`/api/bible/chapter?version=${version}&book=${bookAbbrev}&chapter=${chapter}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export const BIBLE_VERSIONS = [
  { value: "acf", label: "ACF — Almeida Corrigida Fiel" },
];

/**
 * Organização dos livros em grupos (Pentateuco, Históricos, etc.)
 * — mantida só no frontend, sem alterar o banco, conforme
 * ACA-BIB-02 §8 (evitar mudança de estrutura quando o visual
 * resolve sozinho).
 */
export const BOOK_GROUPS: Record<string, string> = {
  gn: "Pentateuco", ex: "Pentateuco", lv: "Pentateuco", nm: "Pentateuco", dt: "Pentateuco",
  js: "Históricos", jz: "Históricos", rt: "Históricos", "1sm": "Históricos", "2sm": "Históricos",
  "1rs": "Históricos", "2rs": "Históricos", "1cr": "Históricos", "2cr": "Históricos", ed: "Históricos",
  ne: "Históricos", et: "Históricos",
  "jó": "Poéticos e Sapienciais", sl: "Poéticos e Sapienciais", pv: "Poéticos e Sapienciais",
  ec: "Poéticos e Sapienciais", ct: "Poéticos e Sapienciais",
  is: "Profetas Maiores", jr: "Profetas Maiores", lm: "Profetas Maiores", ez: "Profetas Maiores", dn: "Profetas Maiores",
  os: "Profetas Menores", jl: "Profetas Menores", am: "Profetas Menores", ob: "Profetas Menores", jn: "Profetas Menores",
  mq: "Profetas Menores", na: "Profetas Menores", hc: "Profetas Menores", sf: "Profetas Menores",
  ag: "Profetas Menores", zc: "Profetas Menores", ml: "Profetas Menores",
  mt: "Evangelhos", mc: "Evangelhos", lc: "Evangelhos", jo: "Evangelhos",
  atos: "História",
  rm: "Cartas Paulinas", "1co": "Cartas Paulinas", "2co": "Cartas Paulinas", gl: "Cartas Paulinas",
  ef: "Cartas Paulinas", fp: "Cartas Paulinas", cl: "Cartas Paulinas", "1ts": "Cartas Paulinas",
  "2ts": "Cartas Paulinas", "1tm": "Cartas Paulinas", "2tm": "Cartas Paulinas", tt: "Cartas Paulinas", fm: "Cartas Paulinas",
  hb: "Cartas Gerais", tg: "Cartas Gerais", "1pe": "Cartas Gerais", "2pe": "Cartas Gerais",
  "1jo": "Cartas Gerais", "2jo": "Cartas Gerais", "3jo": "Cartas Gerais", jd: "Cartas Gerais",
  ap: "Profecia",
};
export const VT_GROUP_ORDER = ["Pentateuco", "Históricos", "Poéticos e Sapienciais", "Profetas Maiores", "Profetas Menores"];
export const NT_GROUP_ORDER = ["Evangelhos", "História", "Cartas Paulinas", "Cartas Gerais", "Profecia"];

// ---------- Destaques (com suporte a intervalo de versículos) ----------
export async function listHighlights(sb: SupabaseClient, profileId: string, bookAbbrev: string, chapter: number, version: string): Promise<BibleHighlight[]> {
  const { data, error } = await sb.from("bible_highlights").select("*")
    .eq("profile_id", profileId).eq("book_abbrev", bookAbbrev).eq("chapter", chapter).eq("version", version);
  if (error) return [];
  return (data ?? []) as BibleHighlight[];
}
export async function toggleHighlight(sb: SupabaseClient, input: {
  profile_id: string; version: string; book_abbrev: string; chapter: number; verse_start: number; verse_end: number; color: string;
}): Promise<void> {
  const { data: existing } = await sb.from("bible_highlights").select("id")
    .eq("profile_id", input.profile_id).eq("version", input.version).eq("book_abbrev", input.book_abbrev)
    .eq("chapter", input.chapter).eq("verse_start", input.verse_start).eq("verse_end", input.verse_end).maybeSingle();
  if (existing) {
    await sb.from("bible_highlights").delete().eq("id", existing.id);
  } else {
    await sb.from("bible_highlights").insert(input);
  }
}

// ---------- Anotações (com suporte a intervalo) ----------
export async function listAnnotations(sb: SupabaseClient, profileId: string, bookAbbrev: string, chapter: number, version: string): Promise<BibleAnnotation[]> {
  const { data, error } = await sb.from("bible_annotations").select("*")
    .eq("profile_id", profileId).eq("book_abbrev", bookAbbrev).eq("chapter", chapter).eq("version", version);
  if (error) return [];
  return (data ?? []) as BibleAnnotation[];
}
export async function listAllAnnotations(sb: SupabaseClient, profileId: string): Promise<BibleAnnotation[]> {
  const { data, error } = await sb.from("bible_annotations").select("*").eq("profile_id", profileId).order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as BibleAnnotation[];
}
export async function saveAnnotation(sb: SupabaseClient, input: {
  profile_id: string; version: string; book_abbrev: string; chapter: number; verse_start: number; verse_end: number; note_text: string;
}): Promise<void> {
  const { error } = await sb.from("bible_annotations").insert({ ...input, updated_at: new Date().toISOString() });
  if (error) throw error;
}
export async function updateAnnotation(sb: SupabaseClient, id: string, noteText: string): Promise<void> {
  await sb.from("bible_annotations").update({ note_text: noteText, updated_at: new Date().toISOString() }).eq("id", id);
}
export async function deleteAnnotation(sb: SupabaseClient, id: string): Promise<void> {
  await sb.from("bible_annotations").delete().eq("id", id);
}

// ---------- Versículos Salvos ----------
export async function listBookmarks(sb: SupabaseClient, profileId: string): Promise<BibleBookmark[]> {
  const { data, error } = await sb.from("bible_bookmarks").select("*").eq("profile_id", profileId).order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as BibleBookmark[];
}
export async function isBookmarked(sb: SupabaseClient, profileId: string, bookAbbrev: string, chapter: number, verseStart: number, verseEnd: number, version: string): Promise<string | null> {
  const { data } = await sb.from("bible_bookmarks").select("id")
    .eq("profile_id", profileId).eq("version", version).eq("book_abbrev", bookAbbrev)
    .eq("chapter", chapter).eq("verse_start", verseStart).eq("verse_end", verseEnd).maybeSingle();
  return data?.id ?? null;
}
export async function toggleBookmark(sb: SupabaseClient, input: {
  profile_id: string; version: string; book_abbrev: string; chapter: number; verse_start: number; verse_end: number;
}): Promise<"saved" | "removed"> {
  const existingId = await isBookmarked(sb, input.profile_id, input.book_abbrev, input.chapter, input.verse_start, input.verse_end, input.version);
  if (existingId) {
    await sb.from("bible_bookmarks").delete().eq("id", existingId);
    return "removed";
  }
  await sb.from("bible_bookmarks").insert(input);
  return "saved";
}

// ---------- Histórico recente + posição de leitura ----------
export async function listRecentReads(sb: SupabaseClient, profileId: string): Promise<BibleRecentRead[]> {
  const { data, error } = await sb.from("bible_recent_reads").select("*").eq("profile_id", profileId).order("opened_at", { ascending: false }).limit(10);
  if (error) return [];
  return (data ?? []) as BibleRecentRead[];
}
/** Registra a abertura de um capítulo — atualiza posição atual E histórico recente numa chamada só. */
export async function registerChapterOpen(sb: SupabaseClient, profileId: string, version: string, bookAbbrev: string, chapter: number): Promise<void> {
  await sb.rpc("register_bible_chapter_open", { p_profile_id: profileId, p_version: version, p_book_abbrev: bookAbbrev, p_chapter: chapter });
}
export async function getReadingProgress(sb: SupabaseClient, profileId: string): Promise<BibleReadingProgress | null> {
  const { data } = await sb.from("bible_reading_progress").select("*").eq("profile_id", profileId).maybeSingle();
  return data as BibleReadingProgress | null;
}
export async function setReadingMode(sb: SupabaseClient, profileId: string, mode: BibleReadingMode): Promise<void> {
  await sb.from("bible_reading_progress").update({ reading_mode: mode, updated_at: new Date().toISOString() }).eq("profile_id", profileId);
}

/** Tenta identificar livro/capítulo/versículo(s) a partir de uma referência em texto livre. Aceita intervalos (ex: "João 3:16-18"). */
const BOOK_NAME_TO_ABBREV: Record<string, string> = {
  "genesis": "gn", "gênesis": "gn", "exodo": "ex", "êxodo": "ex", "levitico": "lv", "levítico": "lv",
  "numeros": "nm", "números": "nm", "deuteronomio": "dt", "deuteronômio": "dt", "josue": "js", "josué": "js",
  "juizes": "jz", "juízes": "jz", "rute": "rt", "1 samuel": "1sm", "2 samuel": "2sm", "1 reis": "1rs", "2 reis": "2rs",
  "1 cronicas": "1cr", "1 crônicas": "1cr", "2 cronicas": "2cr", "2 crônicas": "2cr", "esdras": "ed", "neemias": "ne",
  "ester": "et", "jó": "jó", "jo": "jo", "joão": "jo", "salmos": "sl", "salmo": "sl", "proverbios": "pv", "provérbios": "pv",
  "eclesiastes": "ec", "cantico dos canticos": "ct", "cânticos": "ct", "cântico dos cânticos": "ct", "isaias": "is", "isaías": "is",
  "jeremias": "jr", "lamentacoes": "lm", "lamentações": "lm", "ezequiel": "ez", "daniel": "dn", "oseias": "os",
  "oséias": "os", "joel": "jl", "amos": "am", "amós": "am", "obadias": "ob", "jonas": "jn", "miqueias": "mq",
  "miquéias": "mq", "naum": "na", "habacuque": "hc", "sofonias": "sf", "ageu": "ag", "zacarias": "zc", "malaquias": "ml",
  "mateus": "mt", "marcos": "mc", "lucas": "lc", "atos": "atos", "romanos": "rm", "1 corintios": "1co",
  "1 coríntios": "1co", "2 corintios": "2co", "2 coríntios": "2co", "galatas": "gl", "gálatas": "gl", "efesios": "ef",
  "efésios": "ef", "filipenses": "fp", "colossenses": "cl", "1 tessalonicenses": "1ts", "2 tessalonicenses": "2ts",
  "1 timoteo": "1tm", "1 timóteo": "1tm", "2 timoteo": "2tm", "2 timóteo": "2tm", "tito": "tt", "filemom": "fm",
  "hebreus": "hb", "tiago": "tg", "1 pedro": "1pe", "2 pedro": "2pe", "1 joao": "1jo", "1 joão": "1jo",
  "2 joao": "2jo", "2 joão": "2jo", "3 joao": "3jo", "3 joão": "3jo", "judas": "jd", "apocalipse": "ap",
};
export function parseBibleReference(text: string): { bookAbbrev: string; chapter: number; verseStart?: number; verseEnd?: number } | null {
  const m = text.trim().match(/^([\d]?\s?[A-Za-zÀ-ÿ ]+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!m) return null;
  const bookName = m[1].trim().toLowerCase();
  const abbrev = BOOK_NAME_TO_ABBREV[bookName];
  if (!abbrev) return null;
  const verseStart = m[3] ? Number(m[3]) : undefined;
  const verseEnd = m[4] ? Number(m[4]) : verseStart;
  return { bookAbbrev: abbrev, chapter: Number(m[2]), verseStart, verseEnd };
}
