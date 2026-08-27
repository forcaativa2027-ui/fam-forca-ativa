export const FAM_RISK_ENGINE_VERSION = "FAM-RISK-1.0" as const;

import { evaluateFamRiskRules, FAM_RISK_RULES, FAM_RISK_RULES_VERSION } from "./famRiskRules";
import { normalizeFamRiskAnswer, type FamRiskAnswerInput, type FamRiskAnswerValue } from "./famRiskSemantics";

export type { FamRiskAnswerValue } from "./famRiskSemantics";
export type FamRiskAttention = "immediate" | "relevant" | "specialized" | "insufficient_information";

export interface FamRiskQuestion {
  key: string;
  text: string;
  source: string;
  purpose?: string;
  sensitivity?: "normal" | "alta";
  optional?: boolean;
  nextFlow?: string;
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
  rulesVersion: typeof FAM_RISK_RULES_VERSION;
  triggeredRules: string[];
  priorities: FamRiskAttention[];
  orientations: string[];
}

export function evaluateFamRisk(
  answers: Record<string, FamRiskAnswerInput>,
  rules = FAM_RISK_RULES,
): FamRiskEvaluation {
  const normalizedAnswers: Record<string, FamRiskAnswerValue> = Object.fromEntries(
    Object.entries(answers).map(([key, value]) => [key, normalizeFamRiskAnswer(value)]),
  );
  const triggeredIndicators = FAM_RISK_QUESTIONS
    .filter((question) => normalizedAnswers[question.key] === "YES")
    .map((question) => question.key);
  const matches = evaluateFamRiskRules(normalizedAnswers, rules);
  const emergency = matches.some((match) => match.priority === "immediate");
  const specialFlowFlags = matches
    .filter((match) => match.specialFlow)
    .map((match) => match.specialFlow as string)
    .filter((value, index, values) => values.indexOf(value) === index);
  const priorities = matches.map((match) => match.priority).filter((value, index, values) => values.indexOf(value) === index);
  const orientations = matches.map((match) => match.orientationCode).filter((value, index, values) => values.indexOf(value) === index);

  return {
    // Compatibilidade FAM 1.0: fluxo especial continua relevante; a prioridade especializada fica em `priorities`.
    attention: emergency ? "immediate" : specialFlowFlags.length > 0 || matches.length > 0 || triggeredIndicators.length > 0 ? "relevant" : "insufficient_information",
    emergency,
    specialFlowFlags,
    triggeredIndicators,
    triggeredRules: matches.map((match) => match.ruleCode),
    priorities,
    orientations,
    summary: emergency
      ? "Sinais de risco imediato identificados na triagem."
      : specialFlowFlags.length > 0
        ? "Sinais que podem exigir orientação especializada foram identificados."
        : matches.length > 0 || triggeredIndicators.length > 0
          ? "Sinais de risco relevantes; recomenda-se acompanhamento especializado."
          : "Não foi possível concluir uma situação a partir destas respostas. Isso não significa que esteja tudo bem ou que não exista risco.",
    engineVersion: FAM_RISK_ENGINE_VERSION,
    rulesVersion: FAM_RISK_RULES_VERSION,
  };
}
