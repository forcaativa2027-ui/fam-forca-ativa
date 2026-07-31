import type { SupabaseClient } from "@supabase/supabase-js";
import type { LgMeetingMomentKey, LgMeetingRoleInput, LgMeetingRoleWithMember } from "@/types/domain";

/**
 * CT-019 §4.2/§4.3 — os 7 momentos oficiais da reunião do Life Group,
 * na ordem exata confirmada pelo usuário (substitui a lista genérica
 * do caderno técnico original).
 */
export const MEETING_MOMENTS: { key: LgMeetingMomentKey; order: number; label: string; note?: string }[] = [
  { key: "oracao_inicial",  order: 1, label: "Oração Inicial" },
  { key: "louvor",          order: 2, label: "Louvor", note: "duas músicas" },
  { key: "dinamica",        order: 3, label: "Dinâmica" },
  { key: "palavra",         order: 4, label: "Palavra" },
  { key: "oferta",          order: 5, label: "Oferta (Generosidade)" },
  { key: "caixinha_oracao", order: 6, label: "Caixinha de Oração" },
  { key: "avisos_cec_news", order: 7, label: "Avisos: CEC News" },
];

/** Lista a escala de uma reunião específica (data exata), já com o nome do responsável. */
export async function listMeetingRoles(
  sb: SupabaseClient, lifeGroupId: string, meetingDate: string,
): Promise<LgMeetingRoleWithMember[]> {
  const { data, error } = await sb
    .from("lg_meeting_roles")
    .select("*, responsible:members!lg_meeting_roles_responsible_member_id_fkey(id, full_name)")
    .eq("life_group_id", lifeGroupId)
    .eq("meeting_date", meetingDate)
    .order("moment_order");
  if (error) throw error;
  return (data ?? []) as unknown as LgMeetingRoleWithMember[];
}

/** Cria ou atualiza o responsável/confirmação/observação de um momento. Exclusivo Líder/Colíder (RLS). */
export async function upsertMeetingRole(sb: SupabaseClient, input: LgMeetingRoleInput): Promise<void> {
  const { error } = await sb
    .from("lg_meeting_roles")
    .upsert(input, { onConflict: "life_group_id,meeting_date,moment_key" });
  if (error) throw error;
}

/** Confirmação de participação — o próprio responsável também pode confirmar (RLS libera update pra líder/colíder; membro confirma via ação dedicada no futuro). */
export async function setMeetingRoleConfirmed(sb: SupabaseClient, id: string, confirmed: boolean): Promise<void> {
  const { error } = await sb.from("lg_meeting_roles").update({ confirmed }).eq("id", id);
  if (error) throw error;
}

/**
 * Sugestão de rodízio automático (CT-019 §4.3): distribui os 7 momentos
 * entre os membros informados, evitando repetir o mesmo responsável
 * enquanto houver gente suficiente. Se faltar membro, repete de forma
 * excepcional (regra de negócio confirmada pelo usuário) em vez de
 * deixar o momento sem responsável.
 */
export function suggestRotation(memberIds: string[]): (string | null)[] {
  const total = MEETING_MOMENTS.length;
  if (memberIds.length === 0) return Array(total).fill(null);
  const shuffled = [...memberIds].sort(() => Math.random() - 0.5);
  return MEETING_MOMENTS.map((_, i) => shuffled[i % shuffled.length]);
}
