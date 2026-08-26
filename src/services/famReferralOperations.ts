import type { SupabaseClient } from "@supabase/supabase-js";
import type { FamReferralRequest, FamReferralRequestStatus } from "@/services/famReferralRequests";

export async function listFamReferralRequests(
  sb: SupabaseClient,
): Promise<FamReferralRequest[]> {
  const { data, error } = await sb
    .from("fam_referral_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as FamReferralRequest[];
}

export async function updateFamReferralRequestStatus(
  sb: SupabaseClient,
  requestId: string,
  nextStatus: FamReferralRequestStatus,
): Promise<FamReferralRequest> {
  const { data, error } = await sb.rpc("fam_update_referral_status", {
    p_request_id: requestId,
    p_next_status: nextStatus,
  });
  if (error) throw error;
  return data as FamReferralRequest;
}
