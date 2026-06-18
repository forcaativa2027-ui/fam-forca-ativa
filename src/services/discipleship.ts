import type { SupabaseClient } from "@supabase/supabase-js";
import type { Discipleship, Member } from "@/types/domain";

/** Discipulado ativo do membro logado (como discipulo). */
export async function getMyActiveDiscipleship(sb: SupabaseClient, myMemberId: string | null): Promise<{ disc: Discipleship; discipler: Member | null } | null> {
  if (!myMemberId) return null;
  try {
    const { data, error } = await sb.from("discipleship")
      .select("*").eq("disciple_id", myMemberId).eq("status", "ativo")
      .maybeSingle();
    if (error || !data) return null;
    const disc = data as Discipleship;
    const { data: d } = await sb.from("members").select("*").eq("id", disc.discipler_id).maybeSingle();
    return { disc, discipler: (d as Member) ?? null };
  } catch { return null; }
}

/** Discipulados onde sou DISCIPULADOR (lista quem estou discipulando). */
export async function listMyDisciples(sb: SupabaseClient, myMemberId: string | null): Promise<Discipleship[]> {
  if (!myMemberId) return [];
  try {
    const { data, error } = await sb.from("discipleship")
      .select("*").eq("discipler_id", myMemberId).eq("status", "ativo");
    if (error) return [];
    return (data ?? []) as Discipleship[];
  } catch { return []; }
}
