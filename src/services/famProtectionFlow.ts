import type { FamRiskEvaluation } from "./famRiskEngine";

export type FamProtectionScenario = "EMERGENCY" | "RELEVANT_RISK" | "SPECIALIZED_PROTECTION" | "INSUFFICIENT_INFORMATION";
export type FamProtectionAction = "CONTACT_EMERGENCY_190" | "CONTACT_LIGUE_180" | "OPEN_FAM_ATTENDANT" | "REVIEW_SPECIAL_FLOW" | "OFFER_REFERRAL";

export interface FamProtectionDecision {
  scenario: FamProtectionScenario;
  title: string;
  guidance: string;
  disclaimer: string;
  actions: FamProtectionAction[];
  specialFlows: string[];
  referralAllowed: boolean;
  sharingRequiresConfirmation: true;
}

export interface FamProtectionInput {
  evaluation: FamRiskEvaluation;
  referralConfirmed?: boolean;
}

/**
 * Camada pura de proteção: não persiste, não envia dados e não substitui
 * atendimento profissional. Toda partilha continua dependente de confirmação.
 */
export function decideFamProtection({ evaluation, referralConfirmed = false }: FamProtectionInput): FamProtectionDecision {
  const specialFlows = [...evaluation.specialFlowFlags];
  if (evaluation.emergency) {
    return {
      scenario: "EMERGENCY",
      title: "Sinais que merecem atenção imediata",
      guidance: "Se houver perigo agora, procure um local seguro quando puder e acione a emergência pelo 190. Para orientação e encaminhamento sobre violência contra a mulher, ligue 180. Uma atendente especializada da FAM também pode acolher você quando houver disponibilidade.",
      disclaimer: "Este resultado é orientativo, baseado somente nas respostas fornecidas, e não confirma nem descarta crime, não produz laudo e não substitui serviços de emergência.",
      actions: ["CONTACT_EMERGENCY_190", "CONTACT_LIGUE_180", "OPEN_FAM_ATTENDANT", ...(specialFlows.length ? ["REVIEW_SPECIAL_FLOW" as const] : [])],
      specialFlows,
      referralAllowed: referralConfirmed,
      sharingRequiresConfirmation: true,
    };
  }
  if (specialFlows.includes("children")) {
    return {
      scenario: "SPECIALIZED_PROTECTION",
      title: "Vamos priorizar a proteção",
      guidance: "Você informou que pode haver uma criança ou adolescente em situação de risco. A FAM não realiza investigação nem confirma crimes. Se houver perigo imediato, procure um local seguro e acione o serviço de emergência adequado. Em situações de violência, a orientação poderá indicar a rede oficial de proteção, conforme o caso. Você não precisa fornecer detalhes desnecessários nem enviar arquivos para receber esta orientação inicial.",
      disclaimer: "Este resultado é orientativo, não substitui os órgãos da rede de proteção e não constitui diagnóstico, laudo, investigação ou decisão jurídica.",
      actions: ["OPEN_FAM_ATTENDANT", "CONTACT_EMERGENCY_190", "REVIEW_SPECIAL_FLOW", "OFFER_REFERRAL"],
      specialFlows,
      referralAllowed: referralConfirmed,
      sharingRequiresConfirmation: true,
    };
  }
  if (specialFlows.length) {
    return {
      scenario: "SPECIALIZED_PROTECTION",
      title: "Há um fluxo de proteção que merece atenção especializada",
      guidance: "Uma atendente especializada pode ajudar a avaliar com cuidado o próximo passo. Se houver perigo imediato, afaste-se quando puder e acione o 190.",
      disclaimer: "Este resultado é orientativo e não substitui atendimento profissional, serviços de emergência ou avaliação especializada.",
      actions: ["OPEN_FAM_ATTENDANT", "CONTACT_LIGUE_180", "REVIEW_SPECIAL_FLOW", "OFFER_REFERRAL"],
      specialFlows,
      referralAllowed: referralConfirmed,
      sharingRequiresConfirmation: true,
    };
  }
  if (evaluation.attention === "relevant") {
    return {
      scenario: "RELEVANT_RISK",
      title: "É importante conversar com uma atendente",
      guidance: "Foram identificados sinais que merecem acompanhamento especializado. Converse com uma atendente para avaliar com cuidado o próximo passo.",
      disclaimer: "Este resultado é orientativo e não confirma nem descarta crime, não produz laudo e não substitui atendimento profissional.",
      actions: ["OPEN_FAM_ATTENDANT", "CONTACT_LIGUE_180", "OFFER_REFERRAL"],
      specialFlows,
      referralAllowed: referralConfirmed,
      sharingRequiresConfirmation: true,
    };
  }
  return {
    scenario: "INSUFFICIENT_INFORMATION",
    title: "Converse com uma atendente especializada",
    guidance: "Não foi possível concluir uma situação a partir destas respostas. Isso não significa que esteja tudo bem ou que não exista risco. Converse com uma atendente especializada para avaliar com cuidado o próximo passo.",
    disclaimer: "Este resultado é orientativo e não substitui atendimento profissional ou serviços de emergência.",
    actions: ["OPEN_FAM_ATTENDANT", "CONTACT_LIGUE_180"],
    specialFlows,
    referralAllowed: referralConfirmed,
    sharingRequiresConfirmation: true,
  };
}
