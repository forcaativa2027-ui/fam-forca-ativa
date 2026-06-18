import type { SupabaseClient } from "@supabase/supabase-js";
import type { Member } from "@/types/domain";

export async function getMyMember(sb: SupabaseClient): Promise<Member | null> {
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  try {
    const { data, error } = await sb.from("members").select("*").eq("profile_id", u.user.id).maybeSingle();
    if (error) return null;
    return (data as Member) ?? null;
  } catch { return null; }
}

export async function listCellMembers(sb: SupabaseClient, cellId: string, excludeMemberId?: string): Promise<Member[]> {
  let q = sb.from("members").select("*").eq("life_group_id", cellId).eq("status", "ativo").order("full_name");
  if (excludeMemberId) q = q.neq("id", excludeMemberId);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as Member[];
}

export async function listAllMembers(sb: SupabaseClient): Promise<Member[]> {
  const { data, error } = await sb.from("members").select("*").order("full_name");
  if (error) return [];
  return (data ?? []) as Member[];
}

export async function createMember(sb: SupabaseClient, input: Partial<Member>): Promise<Member> {
  const { data, error } = await sb.from("members").insert(input).select().single();
  if (error) throw error;
  return data as Member;
}

export async function updateMember(sb: SupabaseClient, id: string, input: Partial<Member>): Promise<void> {
  const { error } = await sb.from("members").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteMember(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("members").delete().eq("id", id);
  if (error) throw error;
}
