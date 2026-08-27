import type { SupabaseClient } from "@supabase/supabase-js";
import { getAssuranceLevel, listFactors, verifyLoginChallenge } from "./mfa";

export const FAM_CREDENTIAL_STATUSES = [
  "requested",
  "under_review",
  "active",
  "suspended",
  "revoked",
  "expired",
] as const;

export type FamCredentialStatus = (typeof FAM_CREDENTIAL_STATUSES)[number];
export type FamCredentialScope = "case" | "regional" | "all_fam";

export interface FamProfessionalCredential {
  id: string;
  tenant_key: "FAM";
  profile_id: string;
  profile_name?: string | null;
  profile_email?: string | null;
  professional_role: string;
  qualification: string;
  purpose: string;
  scope_type: FamCredentialScope;
  scope_id: string | null;
  allowed_purposes: string[];
  status: FamCredentialStatus;
  valid_from: string | null;
  valid_until: string | null;
  mfa_required: boolean;
  mfa_verified_at: string | null;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCredentialInput {
  profileId: string;
  professionalRole: string;
  qualification: string;
  purpose: string;
  scopeType: FamCredentialScope;
  scopeId?: string | null;
  allowedPurposes: string[];
  validFrom: string;
  validUntil?: string | null;
  mfaRequired?: boolean;
}

export async function listFamProfessionalCredentials(
  sb: SupabaseClient,
): Promise<FamProfessionalCredential[]> {
  const { data, error } = await sb
    .from("fam_professional_credentials")
    .select("*")
    .eq("tenant_key", "FAM")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FamProfessionalCredential[];
}

export async function requestFamProfessionalCredential(
  sb: SupabaseClient,
  input: CreateCredentialInput,
): Promise<FamProfessionalCredential> {
  if (!input.profileId || !input.professionalRole.trim() || !input.purpose.trim() || !input.validFrom) {
    throw new Error("Perfil, função, finalidade e início da validade são obrigatórios.");
  }
  const { data: userData } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("fam_professional_credentials")
    .insert({
      tenant_key: "FAM",
      profile_id: input.profileId,
      professional_role: input.professionalRole.trim(),
      qualification: input.qualification.trim(),
      purpose: input.purpose.trim(),
      scope_type: input.scopeType,
      scope_id: input.scopeId ?? null,
      allowed_purposes: input.allowedPurposes.map((item) => item.trim()).filter(Boolean),
      status: "requested",
      valid_from: input.validFrom,
      valid_until: input.validUntil ?? null,
      mfa_required: input.mfaRequired ?? true,
      requested_by: userData.user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as FamProfessionalCredential;
}

export async function reviewFamProfessionalCredential(
  sb: SupabaseClient,
  credentialId: string,
  decision: "active" | "under_review" | "suspended" | "revoked" | "expired",
  notes = "",
): Promise<FamProfessionalCredential> {
  if (!credentialId || !decision) throw new Error("Credencial e decisão são obrigatórias.");
  const { data: userData } = await sb.auth.getUser();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: decision,
    reviewed_at: now,
    review_notes: notes.trim() || null,
  };
  if (decision === "active") {
    patch.approved_by = userData.user?.id ?? null;
    patch.approved_at = now;
  }
  if (decision === "revoked") {
    patch.revoked_by = userData.user?.id ?? null;
    patch.revoked_at = now;
    patch.revoke_reason = notes.trim() || "Revogação administrativa";
  }
  const { data, error } = await sb
    .from("fam_professional_credentials")
    .update(patch)
    .eq("id", credentialId)
    .eq("tenant_key", "FAM")
    .select("*")
    .single();
  if (error) throw error;
  return data as FamProfessionalCredential;
}

export type FamSensitiveAccessResult =
  | { allowed: true }
  | { allowed: false; reason: "AUTHENTICATION_REQUIRED" | "MFA_REQUIRED" | "CREDENTIAL_REQUIRED" | "PURPOSE_OR_SCOPE_DENIED" };

async function hasVerifiedMfaSession(sb: SupabaseClient): Promise<boolean> {
  const [factors, assurance] = await Promise.all([listFactors(sb), getAssuranceLevel(sb)]);
  return factors.some((factor) => factor.status === "verified") && assurance.current === "aal2";
}

/**
 * Confirma o factor TOTP e só resolve quando a sessão passou para aal2.
 * A RPC do banco continua sendo a autoridade final da credencial e finalidade.
 */
export async function verifyMfaForSensitiveAccess(
  sb: SupabaseClient,
  factorId: string,
  code: string,
): Promise<boolean> {
  if (!factorId || !/^\d{6}$/.test(code.trim())) return false;
  await verifyLoginChallenge(sb, factorId, code.trim());
  return hasVerifiedMfaSession(sb);
}

/**
 * Acesso sensível sempre exige MFA da sessão antes de consultar a autorização da RPC.
 * O helper server-side confirma o instante de MFA da credencial ativa para manter AC-02/POL-ARQ-01 rastreável.
 */
export async function canAccessFamSensitiveContent(
  sb: SupabaseClient,
  profileId: string,
  caseId: string,
  purpose: string,
): Promise<FamSensitiveAccessResult> {
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user || userData.user.id !== profileId) return { allowed: false, reason: "AUTHENTICATION_REQUIRED" };

  let mfaReady = false;
  try { mfaReady = await hasVerifiedMfaSession(sb); } catch { return { allowed: false, reason: "MFA_REQUIRED" }; }
  if (!mfaReady) return { allowed: false, reason: "MFA_REQUIRED" };

  const { error: confirmError } = await sb.rpc("fam_confirm_credential_mfa");
  if (confirmError) return { allowed: false, reason: "CREDENTIAL_REQUIRED" };

  const { data, error } = await sb.rpc("fam_can_access_sensitive_content", {
    p_profile_id: profileId,
    p_case_id: caseId,
    p_purpose: purpose,
  });
  if (error || data !== true) return { allowed: false, reason: "PURPOSE_OR_SCOPE_DENIED" };
  return { allowed: true };
}

export function isFamCredentialCurrentlyValid(
  credential: Pick<FamProfessionalCredential, "status" | "valid_from" | "valid_until">,
  now = Date.now(),
): boolean {
  if (credential.status !== "active") return false;
  const from = credential.valid_from ? Date.parse(credential.valid_from) : NaN;
  const until = credential.valid_until ? Date.parse(credential.valid_until) : null;
  if (!Number.isFinite(from) || from > now) return false;
  if (until !== null && (!Number.isFinite(until) || until <= now)) return false;
  return true;
}
