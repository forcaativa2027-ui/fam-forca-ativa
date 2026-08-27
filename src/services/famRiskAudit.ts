import type { SupabaseClient } from "@supabase/supabase-js";
import type { FamRiskAuditEvent } from "./famRiskStateMachine";

export async function recordFamRiskAuditEvent(
  sb: SupabaseClient,
  event: FamRiskAuditEvent,
): Promise<void> {
  const { error } = await sb.from("fam_risk_audit_events").insert({
    assessment_id: event.assessmentId,
    event_type: event.eventType,
    actor_user_id: event.actorUserId,
    occurred_at: event.occurredAt,
    from_state: event.fromState ?? null,
    to_state: event.toState ?? null,
    question_code: event.questionCode ?? null,
    rule_code: event.ruleCode ?? null,
    metadata: event.metadata,
    state_machine_version: event.stateMachineVersion,
  });
  if (error) throw error;
}

export async function recordFamRiskAuditEvents(
  sb: SupabaseClient,
  events: readonly FamRiskAuditEvent[],
): Promise<void> {
  if (events.length === 0) return;
  const { error } = await sb.from("fam_risk_audit_events").insert(events.map((event) => ({
    assessment_id: event.assessmentId,
    event_type: event.eventType,
    actor_user_id: event.actorUserId,
    occurred_at: event.occurredAt,
    from_state: event.fromState ?? null,
    to_state: event.toState ?? null,
    question_code: event.questionCode ?? null,
    rule_code: event.ruleCode ?? null,
    metadata: event.metadata,
    state_machine_version: event.stateMachineVersion,
  })));
  if (error) throw error;
}
