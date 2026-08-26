import type { FamRiskEvaluation } from "@/services/famRiskEngine";

export const FAM_REFERRAL_CATALOG_VERSION = "FAM-REFERRAL-1.0" as const;

export type FamReferralRecipient = "CRAS" | "POLICIA_CIVIL" | "MINISTERIO_PUBLICO" | "SAUDE" | "OUTRO_ORGAO_COMPETENTE";
export type FamReferralPriority = "immediate" | "relevant" | "specialized";

export interface FamReferralOption {
  code: string;
  recipient: FamReferralRecipient;
  label: string;
  purpose: string;
  priority: FamReferralPriority;
  reason: string;
  dataScope: string[];
  requiresProfessionalConfirmation: boolean;
  disclaimer: string;
}

const BASE_DISCLAIMER = "O recebimento não significa atendimento, investigação ou adoção de providência. O encaminhamento não concede acesso ao banco de dados da FAM.";

export function resolveFamReferralOptions(evaluation: FamRiskEvaluation): FamReferralOption[] {
  const options: FamReferralOption[] = [];

  if (evaluation.emergency) {
    options.push({
      code: "REF-POLICE-SAFETY-001",
      recipient: "POLICIA_CIVIL",
      label: "Segurança pública e registro",
      purpose: "Orientar sobre segurança pública e eventual registro conforme a competência do serviço.",
      priority: "immediate",
      reason: "Sinal de possível urgência identificado na triagem.",
      dataScope: ["identificador do caso", "sinais de atenção", "data e hora", "arquivos escolhidos explicitamente"],
      requiresProfessionalConfirmation: true,
      disclaimer: BASE_DISCLAIMER,
    });
  }

  if (evaluation.specialFlowFlags.includes("children")) {
    options.push({
      code: "REF-CRAS-PROTECTION-001",
      recipient: "CRAS",
      label: "Proteção e acompanhamento socioassistencial",
      purpose: "Buscar proteção e acompanhamento socioassistencial para a família e pessoas em desenvolvimento.",
      priority: "specialized",
      reason: "Fluxo especial relacionado a criança ou adolescente.",
      dataScope: ["identificador do caso", "sinais de atenção pertinentes", "data e hora", "arquivos escolhidos explicitamente"],
      requiresProfessionalConfirmation: true,
      disclaimer: BASE_DISCLAIMER,
    });
  }

  if (evaluation.specialFlowFlags.includes("sexual") || evaluation.attention === "relevant") {
    options.push({
      code: "REF-HEALTH-SPECIALIZED-001",
      recipient: "SAUDE",
      label: "Atendimento e tutela da saúde",
      purpose: "Orientar sobre atendimento de saúde e proteção relacionada às necessidades apresentadas.",
      priority: "specialized",
      reason: evaluation.specialFlowFlags.includes("sexual")
        ? "Fluxo especial relacionado a violência sexual ou coerção."
        : "Sinais de atenção relevantes identificados na triagem.",
      dataScope: ["identificador do caso", "sinais de atenção pertinentes", "data e hora", "arquivos escolhidos explicitamente"],
      requiresProfessionalConfirmation: true,
      disclaimer: BASE_DISCLAIMER,
    });
  }

  return options;
}

export function referralRequiresExplicitConfirmation(option: FamReferralOption): boolean {
  return option.requiresProfessionalConfirmation;
}
