export const FAM_ASSESSMENT_STATES = [
  "INITIAL",
  "INFORMED",
  "IN_PROGRESS",
  "EMERGENCY",
  "PROTECTION_SPECIAL",
  "ORIENTATION",
  "OPTIONAL_ATTACHMENT",
  "RESULT",
  "CLOSED",
] as const;

export type FamAssessmentState = (typeof FAM_ASSESSMENT_STATES)[number];

export interface FamAssessmentTransitionContext {
  reasonCode: string;
  ruleCode?: string;
}

export interface FamAssessmentTransition {
  from: FamAssessmentState;
  to: FamAssessmentState;
  reasonCode: string;
  ruleCode?: string;
}

const ALLOWED_TRANSITIONS: Readonly<Record<FamAssessmentState, readonly FamAssessmentState[]>> = {
  INITIAL: ["INFORMED", "CLOSED"],
  INFORMED: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["EMERGENCY", "PROTECTION_SPECIAL", "ORIENTATION", "CLOSED"],
  EMERGENCY: ["PROTECTION_SPECIAL", "ORIENTATION", "CLOSED"],
  PROTECTION_SPECIAL: ["ORIENTATION", "OPTIONAL_ATTACHMENT", "CLOSED"],
  ORIENTATION: ["OPTIONAL_ATTACHMENT", "RESULT", "CLOSED"],
  OPTIONAL_ATTACHMENT: ["RESULT", "CLOSED"],
  RESULT: ["CLOSED"],
  CLOSED: [],
};

export function canTransition(from: FamAssessmentState, to: FamAssessmentState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function transitionAssessment(
  from: FamAssessmentState,
  to: FamAssessmentState,
  context: FamAssessmentTransitionContext,
): FamAssessmentTransition {
  if (!canTransition(from, to)) {
    throw new Error(`Transição de avaliação não permitida: ${from} → ${to}`);
  }

  return { from, to, reasonCode: context.reasonCode, ruleCode: context.ruleCode };
}

export function stateForEvaluation(input: {
  emergency: boolean;
  specialFlowFlags: readonly string[];
}): { state: FamAssessmentState; reasonCode: string; ruleCode?: string } {
  if (input.emergency) {
    return { state: "EMERGENCY", reasonCode: "POSSIBLE_URGENCY", ruleCode: "RULE-EMERGENCY-001" };
  }

  if (input.specialFlowFlags.length > 0) {
    return { state: "PROTECTION_SPECIAL", reasonCode: "SPECIAL_FLOW_TRIGGERED", ruleCode: "RULE-SPECIAL-FLOW-001" };
  }

  return { state: "ORIENTATION", reasonCode: "ORIENTATION_READY", ruleCode: "RULE-ORIENTATION-001" };
}
