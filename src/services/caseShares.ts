import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as sbDefault } from "@/lib/supabase/client";

export interface CaseShare {
  id: string;
  case_id: string | null;
  conversation_id: string | null;
  recipient_type: string;
  recipient_id: string | null;
  recipient_name: string;
  purpose_code: string;
  legal_basis_id: string;
  retention_class: string;
  shared_fields: string[];
  shared_files: string[];
  reason: string;
  status: "pending" | "approved" | "sent" | "rejected" | "cancelled";
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShareAudit {
  id: string;
  share_id: string;
  action: string;
  actor_id: string | null;
  details: any;
  created_at: string;
}

const sb = sbDefault as any;

export async function createCaseShare(
  payload: {
    case_id?: string | null;
    conversation_id?: string | null;
    recipient_type: string;
    recipient_name: string;
    recipient_id?: string | null;
    purpose_code: string;
    legal_basis_id: string;
    retention_class: string;
    shared_fields: string[];
    shared_files: string[];
    reason: string;
  },
  client: SupabaseClient = sb
): Promise<CaseShare> {
  // Validação client-side (defesa em profundidade, trigger também bloqueia)
  if (payload.shared_fields.includes("*") || payload.shared_files.includes("*")) {
    throw new Error("share_entire_case bloqueado: selecione campos/arquivos granularmente (JUR-02-TEC-04)");
  }
  if (payload.shared_fields.length === 0 && payload.shared_files.length === 0) {
    throw new Error("Selecione ao menos um campo ou arquivo (JUR-02-TEC-05/06)");
  }
  if (!payload.legal_basis_id) throw new Error("legal_basis_id obrigatório (JUR-02-TEC-08)");
  if (!payload.purpose_code) throw new Error("purpose_code obrigatório");
  if (!payload.recipient_type) throw new Error("recipient_type obrigatório");

  const c = client as any;
  const { data: { user } } = await c.auth.getUser();
  const { data, error } = await c
    .from("fam_case_shares")
    .insert({
      case_id: payload.case_id ?? null,
      conversation_id: payload.conversation_id ?? null,
      recipient_type: payload.recipient_type,
      recipient_name: payload.recipient_name,
      recipient_id: payload.recipient_id ?? null,
      purpose_code: payload.purpose_code,
      legal_basis_id: payload.legal_basis_id,
      retention_class: payload.retention_class,
      shared_fields: payload.shared_fields,
      shared_files: payload.shared_files,
      reason: payload.reason,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CaseShare;
}

export async function listCaseShares(
  caseId?: string | null,
  conversationId?: string | null,
  client: SupabaseClient = sb
): Promise<CaseShare[]> {
  const c = client as any;
  let q = c.from("fam_case_shares").select("*").order("created_at", { ascending: false });
  if (caseId) q = q.eq("case_id", caseId);
  if (conversationId) q = q.eq("conversation_id", conversationId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CaseShare[];
}

export async function updateShareStatus(
  shareId: string,
  status: CaseShare["status"],
  client: SupabaseClient = sb
): Promise<CaseShare> {
  const c = client as any;
  const patch: any = { status };
  const { data: { user } } = await c.auth.getUser();
  if (status === "approved") {
    patch.approved_by = user?.id;
    patch.approved_at = new Date().toISOString();
  }
  if (status === "sent") patch.sent_at = new Date().toISOString();
  const { data, error } = await c.from("fam_case_shares").update(patch).eq("id", shareId).select("*").single();
  if (error) throw error;
  return data as CaseShare;
}

export async function listShareAudit(shareId: string, client: SupabaseClient = sb): Promise<ShareAudit[]> {
  const c = client as any;
  const { data, error } = await c.from("fam_share_audit").select("*").eq("share_id", shareId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ShareAudit[];
}
