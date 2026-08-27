import type { FamRiskEvaluation } from "@/services/famRiskEngine";

export const FAM_REFERRAL_CATALOG_VERSION = "FAM-REFERRAL-1.0" as const;

export type FamReferralRecipient = "CRAS" | "CONSELHO_TUTELAR" | "POLICIA_CIVIL" | "MINISTERIO_PUBLICO" | "SAUDE" | "OUTRO_ORGAO_COMPETENTE";
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
  purposeCode: string;
  legalBasis: string;
  retentionClass: "R1" | "R2" | "R3" | "R4" | "R5";
  legalBasisApproved: boolean;
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
      purposeCode: "PROTECAO_IMEDIATA",
      legalBasis: "PROTECAO_VIDA_INTEGRIDADE",
      retentionClass: "R3",
      legalBasisApproved: false,
    });
  }

  if (evaluation.specialFlowFlags.includes("children")) {
    options.push({
      code: "REF-CHILD-PROTECTION-001",
      recipient: "CONSELHO_TUTELAR",
      label: "Rede oficial de proteção de criança ou adolescente",
      purpose: "Conhecer caminhos de proteção junto ao Conselho Tutelar ou serviço competente, conforme a situação.",
      priority: "specialized",
      reason: "Foi identificado um sinal que pode exigir proteção especial.",
      dataScope: ["identificador do caso", "sinais de atenção pertinentes", "data e hora", "arquivos escolhidos explicitamente"],
      requiresProfessionalConfirmation: true,
      disclaimer: BASE_DISCLAIMER,
      purposeCode: "PROTECAO_CRIANCA_ADOLESCENTE",
      legalBasis: "VALIDAR_JURIDICO",
      retentionClass: "R3",
      legalBasisApproved: false,
    });
    options.push({
      code: "REF-POLICE-CHILD-PROTECTION-001",
      recipient: "POLICIA_CIVIL",
      label: "Autoridade policial competente",
      purpose: "Conhecer o canal oficial adequado quando houver necessidade de proteção ou comunicação à autoridade competente.",
      priority: "specialized",
      reason: "Fluxo especial de proteção de criança ou adolescente; a competência depende do caso.",
      dataScope: ["identificador do caso", "sinais de atenção pertinentes", "data e hora", "arquivos escolhidos explicitamente"],
      requiresProfessionalConfirmation: true,
      disclaimer: BASE_DISCLAIMER,
      purposeCode: "PROTECAO_CRIANCA_ADOLESCENTE",
      legalBasis: "VALIDAR_JURIDICO",
      retentionClass: "R3",
      legalBasisApproved: false,
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
      purposeCode: "ATENDIMENTO_SAUDE",
      legalBasis: "TUTELA_SAUDE_VALIDAR",
      retentionClass: "R3",
      legalBasisApproved: false,
    });
  }

  return options;
}

export function referralRequiresExplicitConfirmation(option: FamReferralOption): boolean {
  return option.requiresProfessionalConfirmation;
}

export function referralHasApprovedLegalPurpose(option: FamReferralOption): boolean {
  return option.legalBasisApproved === true && option.purposeCode.trim().length > 0 && option.legalBasis.trim().length > 0;
}
