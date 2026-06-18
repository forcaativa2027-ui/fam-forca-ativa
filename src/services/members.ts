import type { SupabaseClient } from "@supabase/supabase-js";
import type { Member } from "@/types/domain";

/** Member ligado ao auth.uid() atual (via profiles.profile_id). */
export async function getMyMember(sb: SupabaseClient): Promise<Member | null> {
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  try {
    const { data, error } = await sb.from("members").select("*").eq("profile_id", u.user.id).maybeSingle();
    if (error) return null;
    return (data as Member) ?? null;
  } catch { return null; }
}

/** Outros membros da mesma celula (excluindo eu). */
export async function listCellMembers(sb: SupabaseClient, cellId: string, excludeMemberId?: string): Promise<Member[]> {
  let q = sb.from("members").select("*").eq("life_group_id", cellId).eq("status", "ativo").order("full_name");
  if (excludeMemberId) q = q.neq("id", excludeMemberId);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as Member[];
}
