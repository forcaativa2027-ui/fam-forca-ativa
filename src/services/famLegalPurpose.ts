export const FAM_LEGAL_PURPOSE_CATALOG_VERSION = "JUR-02-v1.0" as const;

export type FamPurposeCode =
  | "ORIENTACAO_INICIAL"
  | "PROTECAO_IMEDIATA"
  | "PROTECAO_CRIANCA_ADOLESCENTE"
  | "ATENDIMENTO_SAUDE"
  | "AUDITORIA_SEGURANCA";

export type FamDataCategory =
  | "respostas_triagem"
  | "sinais_urgencia"
  | "sinais_protecao_especial"
  | "sinais_saude"
  | "metadados_auditoria";

export type FamRecipientType =
  | "FAM_ATENDIMENTO"
  | "EMERGENCIA_COMPETENTE"
  | "REDE_PROTECAO"
  | "SERVICO_SAUDE"
  | "FAM_GOVERNANCA";

export type FamRetentionClass = "R1" | "R2" | "R3" | "R4" | "R5";

export interface FamLegalPurposeDefinition {
  purposeCode: FamPurposeCode;
  dataCategory: FamDataCategory;
  legalBasis: string;
  recipientType: FamRecipientType;
  retentionClass: FamRetentionClass;
  version: typeof FAM_LEGAL_PURPOSE_CATALOG_VERSION;
  enabled: boolean;
  requiresConfirmation: true;
}

/** Catálogo local espelhado do JUR-02; bases permanecem desabilitadas até aprovação formal. */
export const FAM_LEGAL_PURPOSES: readonly FamLegalPurposeDefinition[] = [
  {
    purposeCode: "ORIENTACAO_INICIAL",
    dataCategory: "respostas_triagem",
    legalBasis: "VALIDAR_JURIDICO",
    recipientType: "FAM_ATENDIMENTO",
    retentionClass: "R1",
    version: FAM_LEGAL_PURPOSE_CATALOG_VERSION,
    enabled: false,
    requiresConfirmation: true,
  },
  {
    purposeCode: "PROTECAO_IMEDIATA",
    dataCategory: "sinais_urgencia",
    legalBasis: "PROTECAO_VIDA_INTEGRIDADE",
    recipientType: "EMERGENCIA_COMPETENTE",
    retentionClass: "R3",
    version: FAM_LEGAL_PURPOSE_CATALOG_VERSION,
    enabled: false,
    requiresConfirmation: true,
  },
  {
    purposeCode: "PROTECAO_CRIANCA_ADOLESCENTE",
    dataCategory: "sinais_protecao_especial",
    legalBasis: "VALIDAR_JURIDICO",
    recipientType: "REDE_PROTECAO",
    retentionClass: "R3",
    version: FAM_LEGAL_PURPOSE_CATALOG_VERSION,
    enabled: false,
    requiresConfirmation: true,
  },
  {
    purposeCode: "ATENDIMENTO_SAUDE",
    dataCategory: "sinais_saude",
    legalBasis: "TUTELA_SAUDE_VALIDAR",
    recipientType: "SERVICO_SAUDE",
    retentionClass: "R3",
    version: FAM_LEGAL_PURPOSE_CATALOG_VERSION,
    enabled: false,
    requiresConfirmation: true,
  },
  {
    purposeCode: "AUDITORIA_SEGURANCA",
    dataCategory: "metadados_auditoria",
    legalBasis: "OBRIGACAO_LEGAL_VALIDAR",
    recipientType: "FAM_GOVERNANCA",
    retentionClass: "R4",
    version: FAM_LEGAL_PURPOSE_CATALOG_VERSION,
    enabled: false,
    requiresConfirmation: true,
  },
];

export function getFamPurpose(code: string): FamLegalPurposeDefinition | undefined {
  return FAM_LEGAL_PURPOSES.find((purpose) => purpose.purposeCode === code);
}

export function isFamPurposeShareable(code: string): boolean {
  return getFamPurpose(code)?.enabled === true;
}

export function isMinimalFamDataScope(scope: readonly string[]): boolean {
  return scope.length > 0 && scope.every((item) => !/conteúdo completo|caso completo|narrativa integral|senha|token/i.test(item));
}
