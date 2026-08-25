import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as sbDefault } from "@/lib/supabase/client";

export type LegalHoldStatus = "active" | "review" | "released";
export interface LegalHold {
  id: string;
  scope_type: string;
  scope_id: string;
  reason: string;
  created_by: string | null;
  approved_by: string | null;
  status: LegalHoldStatus;
  created_at: string;
  expires_at: string | null;
  released_at: string | null;
  released_by: string | null;
  metadata: Record<string, unknown>;
}

export interface RetentionPolicy {
  retention_class: "R1" | "R2" | "R3" | "R4" | "R5";
  description: string;
  duration_days: number | null;
  review_interval_days: number;
  legal_hold_allowed: boolean;
  deletion_strategy: string;
  created_at: string;
  updated_at: string;
}

const sb = sbDefault as any;

export async function listRetentionPolicies(client: SupabaseClient = sb): Promise<RetentionPolicy[]> {
  const c = client as any;
  const { data, error } = await c.from("fam_retention_policies").select("*").order("retention_class");
  if (error) throw error;
  return (data ?? []) as RetentionPolicy[];
}

export async function listLegalHolds(client: SupabaseClient = sb, status?: LegalHoldStatus): Promise<LegalHold[]> {
  const c = client as any;
  let q = c.from("fam_legal_holds").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as LegalHold[];
}

export async function createLegalHold(
  scopeType: string,
  scopeId: string,
  reason: string,
  expiresAt?: string | null,
  client: SupabaseClient = sb
): Promise<string> {
  const c = client as any;
  const { data, error } = await c.rpc("fam_set_legal_hold", {
    p_scope_type: scopeType,
    p_scope_id: scopeId,
    p_reason: reason,
    p_expires_at: expiresAt ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function releaseLegalHold(holdId: string, client: SupabaseClient = sb): Promise<void> {
  const c = client as any;
  const { error } = await c.rpc("fam_release_legal_hold", { p_hold_id: holdId });
  if (error) throw error;
}

export async function listRetentionReview(client: SupabaseClient = sb): Promise<Array<{ scope_type: string; scope_id: string; retention_class: string; retention_due_at: string; legal_hold: boolean; created_at: string }>> {
  const c = client as any;
  const { data, error } = await c.from("fam_retention_review").select("*");
  if (error) throw error;
  return (data ?? []) as any;
}
