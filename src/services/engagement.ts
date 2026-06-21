import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberAtRisk, LgBadge, LgMultiplicationProgress } from "@/types/domain";

/** Lista membros em risco de evasão (visão da view). */
export async function listMembersAtRisk(sb: SupabaseClient, opts?: { churchId?: string | null; lgId?: string | null }): Promise<MemberAtRisk[]> {
  let q = sb.from("members_at_risk_evasion").select("*");
  if (opts?.churchId) q = q.eq("church_id", opts.churchId);
  if (opts?.lgId)     q = q.eq("life_group_id", opts.lgId);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as MemberAtRisk[];
}

/** Badges atualmente atingidos por um LG. */
export async function getLgBadges(sb: SupabaseClient, lgId: string): Promise<LgBadge[]> {
  const { data, error } = await sb.rpc("get_lg_badges", { p_lg_id: lgId });
  if (error || !data) return [];
  return data as LgBadge[];
}

/** Progresso de multiplicação de um LG. */
export async function getLgMultiplicationProgress(sb: SupabaseClient, lgId: string): Promise<LgMultiplicationProgress | null> {
  try {
    const { data, error } = await sb.rpc("get_lg_multiplication_progress", { p_lg_id: lgId });
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return row as LgMultiplicationProgress;
  } catch { return null; }
}
