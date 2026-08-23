// Conteúdo institucional vindo do Supabase (agenda e comunicação FAM).
// Fallback institucional: se a tabela ainda não existir ou vier vazia,
// a experiência FAM continua funcional sem recorrer a conteúdo religioso legado.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChurchInfo, ServiceTime, DailyWord, Church } from "@/types/domain";

/** Horários institucionais do tenant. Retorna [] se não houver configuração. */
export async function listServiceTimes(sb: SupabaseClient, churchId: string | null): Promise<ChurchInfo[]> {
  if (!churchId) return [];
  try {
    const { data, error } = await sb
      .from("church_info")
      .select("*")
      .eq("church_id", churchId)
      .eq("is_active", true)
      .order("sort_order");
    if (error) return [];
    return (data ?? []) as ChurchInfo[];
  } catch { return []; }
}

/** Lista todos os horários institucionais para administração. */
export async function listAllServiceTimes(sb: SupabaseClient): Promise<ChurchInfo[]> {
  try {
    const { data, error } = await sb.from("church_info").select("*").order("sort_order");
    if (error) return [];
    return (data ?? []) as ChurchInfo[];
  } catch { return []; }
}

/** Conteúdo institucional diário mais recente — escopado por unidade ou global. */
export async function getTodaysWord(sb: SupabaseClient, churchId?: string | null): Promise<DailyWord | null> {
  try {
    let q = sb.from("daily_words").select("*")
      .eq("is_active", true)
      .lte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: false })
      .limit(1);
    if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
    const { data, error } = await q.maybeSingle();
    if (error || !data) return null;
    return data as DailyWord;
  } catch { return null; }
}

/** Lista palavras (admin). */
export async function listDailyWords(sb: SupabaseClient, limit = 30): Promise<DailyWord[]> {
  try {
    const { data, error } = await sb.from("daily_words").select("*").order("date", { ascending: false }).limit(limit);
    if (error) return [];
    return (data ?? []) as DailyWord[];
  } catch { return []; }
}

// ---------- FALLBACKS INSTITUCIONAIS ----------

/** Atividades padrão da FAM quando ainda não há agenda configurada. */
export function defaultServiceTimes(church: Church | null): ServiceTime[] {
  if (!church || /cec\s*manaus/i.test(church.name ?? "") || /fam|força ativa/i.test(church.name ?? "")) {
    const cid = church?.id ?? "";
    return [
      { id:"fam1", church_id:cid, weekday:"segunda", time:"09:00", description:"Orientação e acolhimento", is_active:true, sort_order:1 },
      { id:"fam2", church_id:cid, weekday:"quarta", time:"14:00", description:"Atendimento da equipe FAM", is_active:true, sort_order:2 },
      { id:"fam3", church_id:cid, weekday:"sexta", time:"16:00", description:"Informações sobre projetos e participação", is_active:true, sort_order:3 },
    ];
  }
  return [];
}

export function defaultWord(): DailyWord {
  return {
    id: "default",
    date: new Date().toISOString().slice(0,10),
title: "Informação FAM",
        verse_ref: "FAM",
        verse_text: "Acolhimento, informação e participação social",
        reflection: "Acompanhe as ações, projetos e canais de atendimento do Instituto FAM.",
        prayer: "",

    is_active: true,
  };
}
