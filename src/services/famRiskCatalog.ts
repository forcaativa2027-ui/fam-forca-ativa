import type { FamRiskAnswerValue, FamRiskQuestion } from "./famRiskEngine";

export const FAM_RISK_CATALOG_VERSION = "OC-04-v1.1" as const;

const ANSWER_OPTIONS: ReadonlyArray<{ value: FamRiskAnswerValue; label: string }> = [
  { value: "YES", label: "Sim" },
  { value: "NO", label: "Não" },
  { value: "PREFER_NOT_TO_ANSWER", label: "Prefiro não responder" },
];

/** Catálogo estável derivado de OC-04 v1.1; textos de interface não devem ser alterados isoladamente. */
export const FAM_RISK_QUESTIONS: readonly FamRiskQuestion[] = [
  { key: "danger_now", text: "Existe perigo ou ameaça acontecendo agora?", source: "OC-04-v1.1/AR-01", options: ANSWER_OPTIONS },
  { key: "injury", text: "Você precisa de atendimento médico ou está ferida?", source: "OC-04-v1.1/AR-02", options: ANSWER_OPTIONS },
  { key: "weapon", text: "A pessoa que ameaça você tem acesso a uma arma?", source: "OC-04-v1.1/AR-03", options: ANSWER_OPTIONS },
  { key: "sexual", text: "Houve violência sexual ou coerção?", source: "OC-04-v1.1/AR-04", options: ANSWER_OPTIONS },
  { key: "children", text: "Há crianças ou adolescentes em situação de risco?", source: "OC-04-v1.1/AR-05", options: ANSWER_OPTIONS },
];

export function isKnownFamRiskQuestion(key: string): boolean {
  return FAM_RISK_QUESTIONS.some((question) => question.key === key);
}
