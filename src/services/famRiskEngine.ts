export const FAM_RISK_ENGINE_VERSION = "FAM-RISK-1.0" as const;

export type FamRiskAnswerValue = "YES" | "NO" | "PREFER_NOT_TO_ANSWER";
export type FamRiskAttention = "immediate" | "relevant" | "specialized" | "insufficient_information";

export interface FamRiskQuestion {
  key: string;
  text: string;
  source: string;
  options: ReadonlyArray<{ value: FamRiskAnswerValue; label: string }>;
}

export { FAM_RISK_CATALOG_VERSION, FAM_RISK_QUESTIONS } from "./famRiskCatalog";
import { FAM_RISK_QUESTIONS } from "./famRiskCatalog";

export interface FamRiskEvaluation {
  attention: FamRiskAttention;
  emergency: boolean;
  specialFlowFlags: string[];
  triggeredIndicators: string[];
  summary: string;
  engineVersion: typeof FAM_RISK_ENGINE_VERSION;
}

export function evaluateFamRisk(answers: Record<string, FamRiskAnswerValue | undefined>): FamRiskEvaluation {
  const triggeredIndicators = FAM_RISK_QUESTIONS
    .filter((question) => answers[question.key] === "YES")
    .map((question) => question.key);
  const emergency = ["danger_now", "injury", "weapon"].some((key) => triggeredIndicators.includes(key));
  const specialFlowFlags = ["sexual", "children"].filter((key) => triggeredIndicators.includes(key));

  return {
    attention: emergency ? "immediate" : triggeredIndicators.length > 0 ? "relevant" : "insufficient_information",
    emergency,
    specialFlowFlags,
    triggeredIndicators,
    summary: emergency
      ? "Sinais de risco imediato identificados na triagem."
      : triggeredIndicators.length > 0
        ? "Sinais de risco relevantes; recomenda-se acompanhamento especializado."
        : "Não foi possível concluir uma situação a partir destas respostas. Isso não significa que esteja tudo bem ou que não exista risco.",
    engineVersion: FAM_RISK_ENGINE_VERSION,
  };
}
