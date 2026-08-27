import type { SupabaseClient } from "@supabase/supabase-js";
import type { FamRiskRule, FamRiskRuleExpression, FamRiskRuleMatch, FamRiskPriority } from "./famRiskRules";
import { evaluateFamRisk } from "./famRiskEngine";
import { FAM_RISK_RULES_VERSION } from "./famRiskRules";
import { normalizeFamRiskAnswer, type FamRiskAnswerInput, type FamRiskAnswerValue } from "./famRiskSemantics";

export const FAM_RISK_LEGACY_RULES_VERSION = "LEGACY-UNVERSIONED" as const;

export interface RemoteFamRiskRuleRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priority: number;
  condition: unknown;
  actions: unknown;
  signals: unknown[] | null;
  signal_priority: number | null;
  special_flows: string[] | null;
  is_active: boolean;
  rule_version?: string | null;
  source_document?: string | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function answerValue(value: unknown): FamRiskAnswerValue {
  if (value === "SEM_RESPOSTA") return "NO_ANSWER";
  if (value === "PREFIRO_NAO_RESPONDER") return "PREFER_NOT_TO_ANSWER";
  if (value === "YES" || value === "NO" || value === "PREFER_NOT_TO_ANSWER" || value === "NO_ANSWER") return value;
  return normalizeFamRiskAnswer(value as FamRiskAnswerInput);
}

export function adaptRemoteCondition(value: unknown): FamRiskRuleExpression {
  if (Array.isArray(value)) return { kind: "all", conditions: value.map(adaptRemoteCondition) };
  const record = asRecord(value);
  const kind = String(record.kind ?? "").toLowerCase();
  if (kind === "all" || Array.isArray(record.all) || Array.isArray(record.conditions) && kind === "all") {
    const conditions = (record.conditions ?? record.all) as unknown[];
    return { kind: "all", conditions: conditions.map(adaptRemoteCondition) };
  }
  if (kind === "any" || Array.isArray(record.any)) {
    const conditions = (record.conditions ?? record.any) as unknown[];
    return { kind: "any", conditions: conditions.map(adaptRemoteCondition) };
  }
  if (kind === "not" || record.not) return { kind: "not", condition: adaptRemoteCondition(record.condition ?? record.not) };
  const questionKey = String(record.questionKey ?? record.question_key ?? record.question ?? record.key ?? "");
  const operator = String(record.operator ?? record.op ?? "equals").toLowerCase() === "not_equals" ? "not_equals" : "equals";
  const valueToCompare = answerValue(record.value ?? record.expected ?? record.answer ?? "YES");
  return { kind: "condition", questionKey, operator, value: valueToCompare };
}

function priorityFromRemote(priority: number): FamRiskPriority {
  if (priority <= 10) return "immediate";
  if (priority <= 30) return "relevant";
  if (priority <= 80) return "specialized";
  return "insufficient_information";
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function orientationCode(actions: unknown): string {
  const record = asRecord(actions);
  const code = record.orientationCode ?? record.orientation_code ?? record.orientation ?? record.actionCode;
  return typeof code === "string" && code.length > 0 ? code : "ORIENT-GENERAL-001";
}

export function adaptRemoteRiskRule(row: RemoteFamRiskRuleRow): FamRiskRule {
  const version = row.rule_version ?? FAM_RISK_LEGACY_RULES_VERSION;
  return {
    code: row.code,
    version,
    expression: adaptRemoteCondition(row.condition),
    signal: stringList(row.signals)[0] ?? row.code,
    priority: priorityFromRemote(row.priority),
    specialFlow: row.special_flows?.[0],
    orientationCode: orientationCode(row.actions),
  };
}

export function adaptRemoteRiskRules(rows: readonly RemoteFamRiskRuleRow[]): FamRiskRule[] {
  return rows.filter((row) => row.is_active).map(adaptRemoteRiskRule);
}

export async function loadRemoteFamRiskRules(sb: SupabaseClient): Promise<FamRiskRule[]> {
  const extended = await sb.from("fam_risk_rules").select("id, code, name, description, priority, condition, actions, signals, signal_priority, special_flows, is_active, rule_version, source_document").eq("is_active", true).order("priority", { ascending: true });
  if (!extended.error) return adaptRemoteRiskRules((extended.data ?? []) as RemoteFamRiskRuleRow[]);

  const legacy = await sb.from("fam_risk_rules").select("id, code, name, description, priority, condition, actions, signals, signal_priority, special_flows, is_active").eq("is_active", true).order("priority", { ascending: true });
  if (legacy.error) throw legacy.error;
  return adaptRemoteRiskRules((legacy.data ?? []) as RemoteFamRiskRuleRow[]);
}

export async function evaluateFamRiskWithRemoteCatalog(
  sb: SupabaseClient,
  answers: Record<string, FamRiskAnswerInput>,
) {
  const rules = await loadRemoteFamRiskRules(sb);
  return evaluateFamRisk(answers, rules);
}

export { FAM_RISK_RULES_VERSION };
