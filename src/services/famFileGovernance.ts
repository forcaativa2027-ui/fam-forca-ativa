export const FAM_FILE_POLICY_VERSION = "POL-ARQ-01-v1.1" as const;

export type FamRetentionClass = "R1" | "R2" | "R3" | "R4" | "R5";
export type FamFileState = "UPLOADED" | "SCANNING" | "APPROVED" | "REJECTED" | "STORED" | "ACCESSED" | "SHARED" | "RETENTION_REVIEW" | "DELETED" | "LEGALLY_PRESERVED";

export interface FamFilePolicy {
  retentionClass: FamRetentionClass;
  label: string;
  defaultRetentionDays: number | null;
  requiresLegalHoldReview: boolean;
}

export const FAM_FILE_POLICIES: Record<FamRetentionClass, FamFilePolicy> = {
  R1: { retentionClass: "R1", label: "Respostas da ferramenta sem atendimento continuado", defaultRetentionDays: 30, requiresLegalHoldReview: true },
  R2: { retentionClass: "R2", label: "Arquivos enviados", defaultRetentionDays: null, requiresLegalHoldReview: true },
  R3: { retentionClass: "R3", label: "Atendimento e encaminhamento", defaultRetentionDays: null, requiresLegalHoldReview: true },
  R4: { retentionClass: "R4", label: "Segurança e auditoria", defaultRetentionDays: null, requiresLegalHoldReview: true },
  R5: { retentionClass: "R5", label: "Incidentes e violações", defaultRetentionDays: null, requiresLegalHoldReview: true },
};

export const FAM_FILE_LIMITS = {
  pdf: { maxBytes: 20 * 1024 * 1024, mimeTypes: ["application/pdf"] },
  image: { maxBytes: 15 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  audio: { maxBytes: 50 * 1024 * 1024, mimeTypes: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav"] },
  video: { maxBytes: 200 * 1024 * 1024, mimeTypes: ["video/mp4", "video/quicktime"] },
} as const;

export type FamFileValidation = { ok: true; category: keyof typeof FAM_FILE_LIMITS } | { ok: false; reason: "EXTENSION_NOT_ALLOWED" | "MIME_NOT_ALLOWED" | "FILE_TOO_LARGE" | "UNKNOWN_TYPE" };

const EXTENSIONS: Record<string, keyof typeof FAM_FILE_LIMITS> = {
  pdf: "pdf", jpg: "image", jpeg: "image", png: "image", webp: "image",
  mp3: "audio", m4a: "audio", wav: "audio", mp4: "video", mov: "video",
};

export function validateFamFile(name: string, mimeType: string, byteSize: number): FamFileValidation {
  const extension = name.trim().toLowerCase().split(".").pop() ?? "";
  const category = EXTENSIONS[extension];
  if (!category) return { ok: false, reason: "EXTENSION_NOT_ALLOWED" };
  const policy = FAM_FILE_LIMITS[category];
  if (!policy.mimeTypes.includes(mimeType as never)) return { ok: false, reason: "MIME_NOT_ALLOWED" };
  if (!Number.isFinite(byteSize) || byteSize < 1 || byteSize > policy.maxBytes) return { ok: false, reason: "FILE_TOO_LARGE" };
  return { ok: true, category };
}

export function canFamAttachmentBePurged(input: {
  deletedAt?: string | null;
  legalHold: boolean;
  retentionExpiresAt?: string | null;
  now?: number;
}): boolean {
  if (input.deletedAt || input.legalHold || !input.retentionExpiresAt) return false;
  const expiry = Date.parse(input.retentionExpiresAt);
  return Number.isFinite(expiry) && expiry <= (input.now ?? Date.now());
}

export function classifyFamAttachment(input: { hasContinuedSupport: boolean; isSecurityOrAudit: boolean; isIncident: boolean }): FamRetentionClass {
  if (input.isIncident) return "R5";
  if (input.isSecurityOrAudit) return "R4";
  if (input.hasContinuedSupport) return "R3";
  return "R2";
}
