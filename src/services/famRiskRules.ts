import { normalizeFamRiskAnswer, type FamRiskAnswerInput, type FamRiskAnswerValue } from "./famRiskSemantics";

export const FAM_RISK_RULES_VERSION = "FAM-RULES-1.1" as const;

export type FamRiskRuleOperator = "equals" | "not_equals";
export type FamRiskRuleExpression =
  | { kind: "condition"; questionKey: string; operator: FamRiskRuleOperator; value: FamRiskAnswerValue }
  | { kind: "all"; conditions: readonly FamRiskRuleExpression[] }
  | { kind: "any"; conditions: readonly FamRiskRuleExpression[] }
  | { kind: "not"; condition: FamRiskRuleExpression };

export type FamRiskPriority = "immediate" | "relevant" | "specialized" | "insufficient_information";

export interface FamRiskRule {
  code: string;
  version: string;
  expression: FamRiskRuleExpression;
  signal: string;
  priority: FamRiskPriority;
  specialFlow?: string;
  orientationCode: string;
}

export interface FamRiskRuleMatch {
  ruleCode: string;
  ruleVersion: string;
  signal: string;
  priority: FamRiskPriority;
  specialFlow?: string;
  orientationCode: string;
}

export const FAM_RISK_RULES: readonly FamRiskRule[] = [
  { code: "RULE-EMERGENCY-001", version: FAM_RISK_RULES_VERSION, expression: { kind: "condition", questionKey: "danger_now", operator: "equals", value: "YES" }, signal: "danger_now", priority: "immediate", orientationCode: "ORIENT-EMERGENCY-001" },
  { code: "RULE-EMERGENCY-002", version: FAM_RISK_RULES_VERSION, expression: { kind: "all", conditions: [
    { kind: "condition", questionKey: "danger_now", operator: "equals", value: "YES" },
    { kind: "any", conditions: [
      { kind: "condition", questionKey: "injury", operator: "equals", value: "YES" },
      { kind: "condition", questionKey: "weapon", operator: "equals", value: "YES" },
    ] },
  ] }, signal: "immediate_danger_signal", priority: "immediate", orientationCode: "ORIENT-EMERGENCY-001" },
  { code: "RULE-WEAPON-001", version: FAM_RISK_RULES_VERSION, expression: { kind: "condition", questionKey: "weapon", operator: "equals", value: "YES" }, signal: "weapon", priority: "relevant", orientationCode: "ORIENT-SAFETY-001" },
  { code: "RULE-SPECIAL-SEXUAL-001", version: FAM_RISK_RULES_VERSION, expression: { kind: "condition", questionKey: "sexual", operator: "equals", value: "YES" }, signal: "sexual", priority: "specialized", specialFlow: "sexual", orientationCode: "ORIENT-SPECIALIZED-001" },
  { code: "RULE-SPECIAL-CHILDREN-001", version: FAM_RISK_RULES_VERSION, expression: { kind: "condition", questionKey: "children", operator: "equals", value: "YES" }, signal: "children", priority: "specialized", specialFlow: "children", orientationCode: "ORIENT-CHILD-PROTECTION-001" },
  { code: "RULE-COMBINED-001", version: FAM_RISK_RULES_VERSION, expression: { kind: "all", conditions: [
    { kind: "condition", questionKey: "danger_now", operator: "equals", value: "YES" },
    { kind: "condition", questionKey: "injury", operator: "equals", value: "YES" },
  ] }, signal: "danger_with_injury", priority: "immediate", orientationCode: "ORIENT-EMERGENCY-001" },
];

export function evaluateFamRiskExpression(expression: FamRiskRuleExpression, answers: Record<string, FamRiskAnswerInput>): boolean {
  switch (expression.kind) {
    case "condition": {
      const actual = normalizeFamRiskAnswer(answers[expression.questionKey]);
      return expression.operator === "equals" ? actual === expression.value : actual !== expression.value;
    }
    case "all": return expression.conditions.every((condition) => evaluateFamRiskExpression(condition, answers));
    case "any": return expression.conditions.some((condition) => evaluateFamRiskExpression(condition, answers));
    case "not": return !evaluateFamRiskExpression(expression.condition, answers);
  }
}

export function evaluateFamRiskRules(answers: Record<string, FamRiskAnswerInput>, rules: readonly FamRiskRule[] = FAM_RISK_RULES): FamRiskRuleMatch[] {
  return rules.filter((rule) => evaluateFamRiskExpression(rule.expression, answers)).map((rule) => ({
    ruleCode: rule.code,
    ruleVersion: rule.version,
    signal: rule.signal,
    priority: rule.priority,
    specialFlow: rule.specialFlow,
    orientationCode: rule.orientationCode,
  }));
}
