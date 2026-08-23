"use client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * UX-004 §6.1/§9.4 — Autenticação multifator (MFA), via TOTP nativo
 * do Supabase Auth (compatível com Google Authenticator, Authy,
 * 1Password, etc.). Não reinventamos criptografia — usamos a API
 * já testada do provedor.
 */

export interface MfaFactor {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: "verified" | "unverified";
}

export async function listFactors(sb: SupabaseClient): Promise<MfaFactor[]> {
  const { data, error } = await sb.auth.mfa.listFactors();
  if (error) throw error;
  return (data?.totp ?? []) as MfaFactor[];
}

/** Nível de segurança da sessão atual: aal1 (só senha) ou aal2 (senha + MFA confirmado). */
export async function getAssuranceLevel(sb: SupabaseClient): Promise<{ current: string | null; next: string | null }> {
  const { data, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return { current: data?.currentLevel ?? null, next: data?.nextLevel ?? null };
}

/** Inicia o cadastro de um novo fator TOTP — devolve o QR Code (SVG) e o segredo, pra digitação manual. */
export async function enrollTotp(sb: SupabaseClient): Promise<{ factorId: string; qrCodeSvg: string; secret: string }> {
  const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "Servo360" });
  if (error) throw error;
  return { factorId: data.id, qrCodeSvg: data.totp.qr_code, secret: data.totp.secret };
}

/** Confirma o cadastro com o código de 6 dígitos gerado pelo app autenticador. */
export async function confirmEnrollment(sb: SupabaseClient, factorId: string, code: string): Promise<void> {
  const { data: challenge, error: challErr } = await sb.auth.mfa.challenge({ factorId });
  if (challErr) throw challErr;
  const { error: verifyErr } = await sb.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (verifyErr) throw verifyErr;
}

/** Usado na tela de login/verificação — depois que a senha já foi validada. */
export async function verifyLoginChallenge(sb: SupabaseClient, factorId: string, code: string): Promise<void> {
  const { data: challenge, error: challErr } = await sb.auth.mfa.challenge({ factorId });
  if (challErr) throw challErr;
  const { error: verifyErr } = await sb.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (verifyErr) throw verifyErr;
}

export async function unenroll(sb: SupabaseClient, factorId: string): Promise<void> {
  const { error } = await sb.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}

// ── Configurações Globais de Segurança (só Apóstolo) ────────────
export async function getMfaEnforcement(sb: SupabaseClient): Promise<boolean> {
  const { data, error } = await sb.from("platform_security_settings").select("value").eq("key", "mfa_enforcement_enabled").maybeSingle();
  if (error || !data) return true;
  return data.value as boolean;
}

export async function setMfaEnforcement(sb: SupabaseClient, enabled: boolean, updatedBy: string): Promise<void> {
  const { error } = await sb.from("platform_security_settings")
    .update({ value: enabled, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq("key", "mfa_enforcement_enabled");
  if (error) throw error;
}
