export const FAM_RISK_ANSWER_VALUES = [
  "YES",
  "NO",
  "PREFER_NOT_TO_ANSWER",
  "NO_ANSWER",
] as const;

export type FamRiskAnswerValue = (typeof FAM_RISK_ANSWER_VALUES)[number];
export type FamRiskAnswerInput = FamRiskAnswerValue | null | undefined | "SEM_RESPOSTA" | "PREFIRO_NAO_RESPONDER";

export const FAM_RISK_ANSWER_LABELS: Record<FamRiskAnswerValue, string> = {
  YES: "Sim",
  NO: "Não",
  PREFER_NOT_TO_ANSWER: "Prefiro não responder",
  NO_ANSWER: "Sem resposta",
};

/** Normaliza entradas da UI e valores legados sem transformar ausência em resposta negativa. */
export function normalizeFamRiskAnswer(value: FamRiskAnswerInput): FamRiskAnswerValue {
  if (value === "SEM_RESPOSTA" || value == null) return "NO_ANSWER";
  if (value === "PREFIRO_NAO_RESPONDER") return "PREFER_NOT_TO_ANSWER";
  return value;
}

export function isAnsweredFamRiskValue(value: FamRiskAnswerValue): boolean {
  return value !== "NO_ANSWER";
}

export function isAffirmativeFamRiskValue(value: FamRiskAnswerValue): boolean {
  return value === "YES";
}

export function hasInsufficientFamRiskInformation(values: readonly FamRiskAnswerValue[]): boolean {
  return values.length === 0 || values.some((value) => value === "NO_ANSWER" || value === "PREFER_NOT_TO_ANSWER");
}
