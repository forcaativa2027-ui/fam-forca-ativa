import type { SupabaseClient } from "@supabase/supabase-js";
import { referralRequiresExplicitConfirmation, type FamReferralOption } from "./famReferrals";

export type FamReferralRequestStatus = "requested" | "under_review" | "sent" | "received" | "cancelled";

export interface FamReferralRequest {
  id: string;
  case_id: string;
  requested_by: string;
  recipient: string;
  purpose: string;
  priority: string;
  reason_code: string;
  requested_data: string[];
  selected_attachment_ids: string[];
  status: FamReferralRequestStatus;
  explicit_confirmation_at: string;
  created_at: string;
  updated_at: string;
}

export async function createFamReferralRequest(
  sb: SupabaseClient,
  input: {
    caseId: string;
    userId: string;
    option: FamReferralOption;
    selectedAttachmentIds?: string[];
    confirmationAccepted: boolean;
  },
): Promise<FamReferralRequest> {
  if (!input.confirmationAccepted || !referralRequiresExplicitConfirmation(input.option)) {
    throw new Error("Confirmação explícita obrigatória antes de registrar o encaminhamento.");
  }
  const { data, error } = await sb
    .from("fam_referral_requests")
    .insert({
      case_id: input.caseId,
      requested_by: input.userId,
      recipient: input.option.recipient,
      purpose: input.option.purpose,
      priority: input.option.priority,
      reason_code: input.option.code,
      requested_data: input.option.dataScope,
      selected_attachment_ids: input.selectedAttachmentIds ?? [],
      explicit_confirmation_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as FamReferralRequest;
}
