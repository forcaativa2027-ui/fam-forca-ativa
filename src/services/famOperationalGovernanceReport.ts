import type { SupabaseClient } from "@supabase/supabase-js";

export const FAM_GOVERNANCE_REPORT_VERSION = "POL-ARQ-01-v1.1" as const;

export interface FamGovernanceEvent {
  id: string;
  attachment_id: string;
  actor_user_id: string | null;
  event_type: string;
  retention_class: string | null;
  purpose: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FamAccessAuditEvent {
  id: string;
  actor_user_id: string | null;
  profile_id: string | null;
  case_id: string | null;
  purpose: string | null;
  decision: string;
  reason: string | null;
  created_at: string;
}

export interface FamRetentionSummary {
  retention_class: string;
  label: string | null;
  default_retention_days: number | null;
  active: boolean;
  total_attachments: number;
  legal_hold_attachments: number;
  expired_attachments: number;
}

export interface FamOperationalGovernanceReport {
  generated_at: string;
  policy_version: string;
  retention: FamRetentionSummary[];
  governance_events: FamGovernanceEvent[];
  access_events: FamAccessAuditEvent[];
  totals: {
    attachments: number;
    legal_hold: number;
    expired: number;
    governance_events: number;
    access_events: number;
    denied_access: number;
    mfa_required: number;
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function isExpired(value: string | null, now: number): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed <= now;
}

/**
 * Relatório operacional sem conteúdo sensível. O Supabase/RLS continua sendo
 * a autoridade; a função não tenta consultar outra tabela quando uma consulta
 * protegida falha.
 */
export async function loadFamOperationalGovernanceReport(
  sb: SupabaseClient,
  now = Date.now(),
): Promise<FamOperationalGovernanceReport> {
  const [policiesResult, attachmentsResult, governanceResult, accessResult] = await Promise.all([
    sb.from("fam_retention_policies")
      .select("retention_class, label, default_retention_days, is_active, policy_version")
      .order("retention_class"),
    sb.from("fam_risk_attachments")
      .select("id, retention_class, legal_hold, retention_expires_at, deleted_at")
      .eq("tenant_key", "FAM"),
    sb.from("fam_file_governance_events")
      .select("id, attachment_id, actor_user_id, event_type, retention_class, purpose, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    sb.from("fam_access_audit_events")
      .select("id, actor_user_id, profile_id, case_id, purpose, decision, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const failed = [policiesResult, attachmentsResult, governanceResult, accessResult]
    .find((result) => result.error);
  if (failed?.error) throw failed.error;

  const policies = (policiesResult.data ?? []) as Array<{
    retention_class: string;
    label?: string | null;
    default_retention_days?: number | null;
    is_active?: boolean | null;
    policy_version?: string | null;
  }>;
  const attachments = (attachmentsResult.data ?? []) as Array<{
    retention_class: string | null;
    legal_hold: boolean | null;
    retention_expires_at: string | null;
    deleted_at: string | null;
  }>;
  const governanceEvents = (governanceResult.data ?? []) as Array<Record<string, unknown>>;
  const accessEvents = (accessResult.data ?? []) as Array<Record<string, unknown>>;

  const retention = policies.map((policy) => {
    const inClass = attachments.filter((file) => file.retention_class === policy.retention_class);
    return {
      retention_class: policy.retention_class,
      label: policy.label ?? null,
      default_retention_days: policy.default_retention_days ?? null,
      active: policy.is_active !== false,
      total_attachments: inClass.length,
      legal_hold_attachments: inClass.filter((file) => file.legal_hold === true).length,
      expired_attachments: inClass.filter((file) => !file.deleted_at && !file.legal_hold && isExpired(file.retention_expires_at, now)).length,
    } satisfies FamRetentionSummary;
  });

  const normalizedGovernanceEvents: FamGovernanceEvent[] = governanceEvents.map((event) => ({
    id: String(event.id),
    attachment_id: String(event.attachment_id),
    actor_user_id: event.actor_user_id ? String(event.actor_user_id) : null,
    event_type: String(event.event_type),
    retention_class: event.retention_class ? String(event.retention_class) : null,
    purpose: event.purpose ? String(event.purpose) : null,
    metadata: asRecord(event.metadata),
    created_at: String(event.created_at),
  }));
  const normalizedAccessEvents: FamAccessAuditEvent[] = accessEvents.map((event) => ({
    id: String(event.id),
    actor_user_id: event.actor_user_id ? String(event.actor_user_id) : null,
    profile_id: event.profile_id ? String(event.profile_id) : null,
    case_id: event.case_id ? String(event.case_id) : null,
    purpose: event.purpose ? String(event.purpose) : null,
    decision: String(event.decision),
    reason: event.reason ? String(event.reason) : null,
    created_at: String(event.created_at),
  }));

  return {
    generated_at: new Date(now).toISOString(),
    policy_version: policies.find((policy) => policy.policy_version)?.policy_version ?? FAM_GOVERNANCE_REPORT_VERSION,
    retention,
    governance_events: normalizedGovernanceEvents,
    access_events: normalizedAccessEvents,
    totals: {
      attachments: attachments.length,
      legal_hold: attachments.filter((file) => file.legal_hold === true).length,
      expired: attachments.filter((file) => !file.deleted_at && !file.legal_hold && isExpired(file.retention_expires_at, now)).length,
      governance_events: normalizedGovernanceEvents.length,
      access_events: normalizedAccessEvents.length,
      denied_access: normalizedAccessEvents.filter((event) => event.decision === "DENY").length,
      mfa_required: normalizedAccessEvents.filter((event) => event.decision === "REQUIRE_MFA").length,
    },
  };
}
