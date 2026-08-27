import { canTransition, transitionAssessment, type FamAssessmentState, type FamAssessmentTransition } from "./famAssessmentState";

export const FAM_RISK_STATE_MACHINE_VERSION = "FAM-STATE-1.0" as const;
export const FAM_RISK_AUDIT_EVENT_TYPES = [
  "ASSESSMENT_STARTED",
  "ANSWER_RECORDED",
  "RULE_TRIGGERED",
  "SPECIAL_FLOW_TRIGGERED",
  "RESULT_GENERATED",
  "EVIDENCE_ACCESSED",
  "RESULT_SHARED",
  "STATE_TRANSITIONED",
] as const;

export type FamRiskAuditEventType = (typeof FAM_RISK_AUDIT_EVENT_TYPES)[number];

export interface FamRiskAuditEvent {
  eventType: FamRiskAuditEventType;
  assessmentId: string;
  actorUserId: string | null;
  occurredAt: string;
  state?: FamAssessmentState;
  fromState?: FamAssessmentState;
  toState?: FamAssessmentState;
  questionCode?: string;
  ruleCode?: string;
  metadata: Record<string, string | number | boolean | null>;
  stateMachineVersion: typeof FAM_RISK_STATE_MACHINE_VERSION;
}

export interface FamRiskTransitionResult {
  transition: FamAssessmentTransition;
  auditEvent: FamRiskAuditEvent;
}

export function transitionRiskAssessment(input: {
  assessmentId: string;
  actorUserId?: string | null;
  from: FamAssessmentState;
  to: FamAssessmentState;
  reasonCode: string;
  ruleCode?: string;
  now?: string;
}): FamRiskTransitionResult {
  const transition = transitionAssessment(input.from, input.to, {
    reasonCode: input.reasonCode,
    ruleCode: input.ruleCode,
  });
  const occurredAt = input.now ?? new Date().toISOString();
  return {
    transition,
    auditEvent: {
      eventType: "STATE_TRANSITIONED",
      assessmentId: input.assessmentId,
      actorUserId: input.actorUserId ?? null,
      occurredAt,
      fromState: input.from,
      toState: input.to,
      ...(input.ruleCode ? { ruleCode: input.ruleCode } : {}),
      metadata: { reasonCode: input.reasonCode },
      stateMachineVersion: FAM_RISK_STATE_MACHINE_VERSION,
    },
  };
}

export function createRiskAuditEvent(input: {
  eventType: FamRiskAuditEventType;
  assessmentId: string;
  actorUserId?: string | null;
  now?: string;
  state?: FamAssessmentState;
  questionCode?: string;
  ruleCode?: string;
  metadata?: Record<string, string | number | boolean | null>;
}): FamRiskAuditEvent {
  return {
    eventType: input.eventType,
    assessmentId: input.assessmentId,
    actorUserId: input.actorUserId ?? null,
    occurredAt: input.now ?? new Date().toISOString(),
    state: input.state,
    questionCode: input.questionCode,
    ruleCode: input.ruleCode,
    metadata: input.metadata ?? {},
    stateMachineVersion: FAM_RISK_STATE_MACHINE_VERSION,
  };
}

export { canTransition };
