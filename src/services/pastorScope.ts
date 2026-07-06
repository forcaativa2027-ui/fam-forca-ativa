"use client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PastorScope {
  id: string;
  full_name: string;
  email: string | null;
  church_id: string | null;
}

export async function listPastors(sb: SupabaseClient): Promise<PastorScope[]> {
  const { data, error } = await sb
    .from("profiles")
    .select("id, full_name, email, church_id, role")
    .eq("role", "pastor")
    .order("full_name");
  if (error) return [];
  return (data ?? []) as PastorScope[];
}

export async function countPastorsWithoutScope(sb: SupabaseClient): Promise<number> {
  try {
    const { data, error } = await sb.rpc("pastors_without_scope_count");
    if (error) return 0;
    return (data as number) ?? 0;
  } catch { return 0; }
}

export async function setPastorScope(sb: SupabaseClient, profileId: string, churchId: string | null): Promise<void> {
  const { error } = await sb.from("profiles").update({ church_id: churchId }).eq("id", profileId);
  if (error) throw error;
}
