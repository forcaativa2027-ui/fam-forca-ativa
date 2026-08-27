import type { FamRiskAnswerValue, FamRiskQuestion } from "./famRiskEngine";

export const FAM_RISK_CATALOG_VERSION = "OC-04-v1.1" as const;

const ANSWER_OPTIONS: ReadonlyArray<{ value: FamRiskAnswerValue; label: string }> = [
  { value: "YES", label: "Sim" },
  { value: "NO", label: "Não" },
  { value: "PREFER_NOT_TO_ANSWER", label: "Prefiro não responder" },
];

/** Catálogo estável derivado de OC-04 v1.1; textos de interface não devem ser alterados isoladamente. */
export const FAM_RISK_QUESTIONS: readonly FamRiskQuestion[] = [
  { key: "danger_now", text: "Existe perigo ou ameaça acontecendo agora?", source: "OC-04-v1.1/AR-01", purpose: "identificar possível necessidade de orientação imediata de segurança", sensitivity: "alta", optional: true, nextFlow: "emergency", options: ANSWER_OPTIONS },
  { key: "injury", text: "Você precisa de atendimento médico ou está ferida?", source: "OC-04-v1.1/AR-02", purpose: "orientar sobre possível necessidade de atendimento de saúde", sensitivity: "alta", optional: true, nextFlow: "health", options: ANSWER_OPTIONS },
  { key: "weapon", text: "A pessoa envolvida tem acesso a uma arma ou você teme que possa usar uma?", source: "OC-04-v1.1/AR-03", purpose: "identificar informação relevante para orientação de segurança", sensitivity: "alta", optional: true, nextFlow: "safety", options: ANSWER_OPTIONS },
  { key: "sexual", text: "Houve situação de violência sexual, contato sexual sem consentimento ou coerção?", source: "OC-04-v1.1/AR-04", purpose: "orientar sobre possível necessidade de proteção e atendimento especializado", sensitivity: "alta", optional: true, nextFlow: "specialized_protection", options: ANSWER_OPTIONS },
  { key: "children", text: "Há alguma criança ou adolescente que possa estar em situação de risco?", source: "OC-04-v1.1/AR-05", purpose: "identificar possível necessidade de proteção especial", sensitivity: "alta", optional: true, nextFlow: "child_protection", options: ANSWER_OPTIONS },
];

export function isKnownFamRiskQuestion(key: string): boolean {
  return FAM_RISK_QUESTIONS.some((question) => question.key === key);
}
