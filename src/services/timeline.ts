import type { SupabaseClient } from "@supabase/supabase-js";
import type { PastoralTimeline } from "@/types/domain";

/** Linha do tempo espiritual de um membro. */
export async function listMemberTimeline(sb: SupabaseClient, memberId: string | null): Promise<PastoralTimeline[]> {
  if (!memberId) return [];
  try {
    const { data, error } = await sb.from("pastoral_timeline")
      .select("*").eq("member_id", memberId).order("event_date", { ascending: false });
    if (error) return [];
    return (data ?? []) as PastoralTimeline[];
  } catch { return []; }
}
