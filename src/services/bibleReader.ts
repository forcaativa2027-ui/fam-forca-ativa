"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BibleBook, BibleChapter, BibleHighlight, BibleAnnotation } from "@/types/domain";

/**
 * CEC Academy — Bíblia Integrada. O texto bíblico vem de uma API
 * pública e gratuita (abibliadigital.com.br, mantida pela
 * comunidade, código aberto). Sem custo, sem chave obrigatória —
 * só tem limite de 20 requisições/hora sem cadastro. Se isso virar
 * um gargalo real de uso, dá pra criar uma conta gratuita lá e
 * configurar um token (NEXT_PUBLIC_BIBLE_API_TOKEN).
 */
const API_BASE = "https://www.abibliadigital.com.br/api";

function authHeaders(): HeadersInit {
  const token = process.env.NEXT_PUBLIC_BIBLE_API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listBooks(): Promise<BibleBook[]> {
  try {
    const res = await fetch(`${API_BASE}/books`, { headers: authHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function getChapter(version: string, bookAbbrev: string, chapter: number): Promise<BibleChapter | null> {
  try {
    const res = await fetch(`${API_BASE}/verses/${version}/${bookAbbrev}/${chapter}`, { headers: authHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export const BIBLE_VERSIONS = [
  { value: "nvi", label: "NVI — Nova Versão Internacional" },
  { value: "acf", label: "ACF — Almeida Corrigida Fiel" },
  { value: "ra", label: "RA — Almeida Revista e Atualizada" },
  { value: "kjv", label: "KJV — King James (inglês)" },
];

// ---------- Grifos ----------
export async function listHighlights(sb: SupabaseClient, profileId: string, bookAbbrev: string, chapter: number, version: string): Promise<BibleHighlight[]> {
  const { data, error } = await sb.from("bible_highlights").select("*")
    .eq("profile_id", profileId).eq("book_abbrev", bookAbbrev).eq("chapter", chapter).eq("version", version);
  if (error) return [];
  return (data ?? []) as BibleHighlight[];
}
export async function toggleHighlight(sb: SupabaseClient, input: { profile_id: string; version: string; book_abbrev: string; chapter: number; verse: number; color: string }): Promise<void> {
  const { data: existing } = await sb.from("bible_highlights").select("id")
    .eq("profile_id", input.profile_id).eq("version", input.version).eq("book_abbrev", input.book_abbrev)
    .eq("chapter", input.chapter).eq("verse", input.verse).maybeSingle();
  if (existing) {
    await sb.from("bible_highlights").delete().eq("id", existing.id);
  } else {
    await sb.from("bible_highlights").insert(input);
  }
}

// ---------- Anotações ----------
export async function listAnnotations(sb: SupabaseClient, profileId: string, bookAbbrev: string, chapter: number, version: string): Promise<BibleAnnotation[]> {
  const { data, error } = await sb.from("bible_annotations").select("*")
    .eq("profile_id", profileId).eq("book_abbrev", bookAbbrev).eq("chapter", chapter).eq("version", version);
  if (error) return [];
  return (data ?? []) as BibleAnnotation[];
}
export async function saveAnnotation(sb: SupabaseClient, input: { profile_id: string; version: string; book_abbrev: string; chapter: number; verse: number; note_text: string }): Promise<void> {
  const { error } = await sb.from("bible_annotations").insert({ ...input, updated_at: new Date().toISOString() });
  if (error) throw error;
}
export async function deleteAnnotation(sb: SupabaseClient, id: string): Promise<void> {
  await sb.from("bible_annotations").delete().eq("id", id);
}

// ---------- Progresso de leitura ----------
export async function saveReadingProgress(sb: SupabaseClient, profileId: string, version: string, bookAbbrev: string, chapter: number): Promise<void> {
  await sb.from("bible_reading_progress").upsert(
    { profile_id: profileId, version, book_abbrev: bookAbbrev, chapter, updated_at: new Date().toISOString() },
    { onConflict: "profile_id" },
  );
}
export async function getReadingProgress(sb: SupabaseClient, profileId: string) {
  const { data } = await sb.from("bible_reading_progress").select("*").eq("profile_id", profileId).maybeSingle();
  return data;
}

/** Tenta identificar livro/capítulo a partir de uma referência em texto livre (ex: "João 3:16" ou "Salmos 23"). */
const BOOK_NAME_TO_ABBREV: Record<string, string> = {
  "genesis": "gn", "gênesis": "gn", "exodo": "ex", "êxodo": "ex", "levitico": "lv", "levítico": "lv",
  "numeros": "nm", "números": "nm", "deuteronomio": "dt", "deuteronômio": "dt", "josue": "js", "josué": "js",
  "juizes": "jz", "juízes": "jz", "rute": "rt", "1 samuel": "1sm", "2 samuel": "2sm", "1 reis": "1rs", "2 reis": "2rs",
  "1 cronicas": "1cr", "1 crônicas": "1cr", "2 cronicas": "2cr", "2 crônicas": "2cr", "esdras": "ed", "neemias": "ne",
  "ester": "et", "jo": "jo", "joão": "jo", "salmos": "sl", "salmo": "sl", "proverbios": "pv", "provérbios": "pv",
  "eclesiastes": "ec", "cantico dos canticos": "ct", "cântico dos cânticos": "ct", "isaias": "is", "isaías": "is",
  "jeremias": "jr", "lamentacoes": "lm", "lamentações": "lm", "ezequiel": "ez", "daniel": "dn", "oseias": "os",
  "oséias": "os", "joel": "jl", "amos": "am", "amós": "am", "obadias": "ob", "jonas": "jn", "miqueias": "mq",
  "miquéias": "mq", "naum": "na", "habacuque": "hc", "sofonias": "sf", "ageu": "ag", "zacarias": "zc", "malaquias": "ml",
  "mateus": "mt", "marcos": "mc", "lucas": "lc", "atos": "at", "romanos": "rm", "1 corintios": "1co",
  "1 coríntios": "1co", "2 corintios": "2co", "2 coríntios": "2co", "galatas": "gl", "gálatas": "gl", "efesios": "ef",
  "efésios": "ef", "filipenses": "fp", "colossenses": "cl", "1 tessalonicenses": "1ts", "2 tessalonicenses": "2ts",
  "1 timoteo": "1tm", "1 timóteo": "1tm", "2 timoteo": "2tm", "2 timóteo": "2tm", "tito": "tt", "filemom": "fm",
  "hebreus": "hb", "tiago": "tg", "1 pedro": "1pe", "2 pedro": "2pe", "1 joao": "1jo", "1 joão": "1jo",
  "2 joao": "2jo", "2 joão": "2jo", "3 joao": "3jo", "3 joão": "3jo", "judas": "jd", "apocalipse": "ap",
};
export function parseBibleReference(text: string): { bookAbbrev: string; chapter: number; verse?: number } | null {
  const m = text.match(/^([\d]?\s?[A-Za-zÀ-ÿ ]+?)\s+(\d+)(?::(\d+))?/);
  if (!m) return null;
  const bookName = m[1].trim().toLowerCase();
  const abbrev = BOOK_NAME_TO_ABBREV[bookName];
  if (!abbrev) return null;
  return { bookAbbrev: abbrev, chapter: Number(m[2]), verse: m[3] ? Number(m[3]) : undefined };
}
