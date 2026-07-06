import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditAction, AuditLog } from "@/types/domain";

export async function logAudit(
  sb: SupabaseClient, action: AuditAction, entity: string,
  entity_id?: string|null, details?: Record<string, unknown>|null
) {
  try {
    await sb.rpc("audit_log", {
      p_action: action, p_entity: entity,
      p_entity_id: entity_id ?? null, p_details: details ?? null,
    });
  } catch {
    // auditoria nunca pode quebrar o fluxo principal
  }
}

export async function listAuditLogs(sb: SupabaseClient, limit = 50): Promise<AuditLog[]> {
  const { data, error } = await sb.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) return [];
  return (data ?? []) as AuditLog[];
}
