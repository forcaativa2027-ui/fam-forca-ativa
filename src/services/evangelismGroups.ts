import type { SupabaseClient } from "@supabase/supabase-js";
import type { EvangelismGroup } from "@/types/domain";

/** Lista todos os Grupos de Evangelismo, já com os responsáveis resolvidos. */
export async function listEvangelismGroups(sb: SupabaseClient): Promise<EvangelismGroup[]> {
  const { data, error } = await sb
    .from("evangelism_groups")
    .select("*, evangelism_group_leaders(member_id, members(full_name))")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    leader_ids: (r.evangelism_group_leaders ?? []).map((l: any) => l.member_id),
    leader_names: (r.evangelism_group_leaders ?? []).map((l: any) => l.members?.full_name ?? "—"),
  })) as EvangelismGroup[];
}

/** Cria um grupo e já grava seus responsáveis. */
export async function createEvangelismGroup(
  sb: SupabaseClient,
  input: Partial<EvangelismGroup>,
  leaderIds: string[]
): Promise<EvangelismGroup> {
  const { data, error } = await sb.from("evangelism_groups").insert({
    cell_id: input.cell_id, name: input.name,
    address: input.address ?? null, neighborhood: input.neighborhood ?? null,
    city: input.city ?? null, state: input.state ?? null,
    meeting_weekday: input.meeting_weekday ?? null, meeting_time: input.meeting_time ?? null,
    is_active: input.is_active ?? true,
  }).select().single();
  if (error) throw error;
  await syncLeaders(sb, data.id, leaderIds);
  return data as EvangelismGroup;
}

export async function updateEvangelismGroup(
  sb: SupabaseClient,
  id: string,
  input: Partial<EvangelismGroup>,
  leaderIds: string[]
): Promise<void> {
  const { error } = await sb.from("evangelism_groups").update({
    cell_id: input.cell_id, name: input.name,
    address: input.address ?? null, neighborhood: input.neighborhood ?? null,
    city: input.city ?? null, state: input.state ?? null,
    meeting_weekday: input.meeting_weekday ?? null, meeting_time: input.meeting_time ?? null,
    is_active: input.is_active ?? true,
  }).eq("id", id);
  if (error) throw error;
  await syncLeaders(sb, id, leaderIds);
}

export async function deleteEvangelismGroup(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("evangelism_groups").delete().eq("id", id);
  if (error) throw error;
}

/** Substitui a lista de responsáveis do grupo (apaga tudo e regrava). */
async function syncLeaders(sb: SupabaseClient, groupId: string, leaderIds: string[]): Promise<void> {
  const { error: delErr } = await sb.from("evangelism_group_leaders").delete().eq("group_id", groupId);
  if (delErr) throw delErr;
  if (leaderIds.length === 0) return;
  const { error: insErr } = await sb.from("evangelism_group_leaders")
    .insert(leaderIds.map((member_id) => ({ group_id: groupId, member_id })));
  if (insErr) throw insErr;
}
