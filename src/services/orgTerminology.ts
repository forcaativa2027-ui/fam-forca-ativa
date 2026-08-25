"use client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Rótulos padrão (o que já era usado fixo em todo lugar) — usados
 * como fallback instantâneo antes da consulta carregar, e caso um
 * termo não esteja configurado no banco.
 */
export const ORG_TERM_DEFAULTS: Record<string, string> = {
  lg: "Life Group", setor: "Setor", area: "Área", distrito: "Distrito",
  nucleo: "Núcleo", sede: "Sede", nacional: "Nacional", igreja: "Igreja/Comunidade",
};

export type OrgTerminologyMap = Record<string, string>;

/** Busca a terminologia configurada (hoje global; por igreja quando o multi-tenant for retomado). */
export async function getOrgTerminology(sb: SupabaseClient, churchId?: string | null): Promise<OrgTerminologyMap> {
  const { data, error } = await sb.from("org_terminology").select("*").is("church_id", null);
  if (error) { console.error("[org-terminology]", error); return { ...ORG_TERM_DEFAULTS }; }
  const map = { ...ORG_TERM_DEFAULTS };
  for (const row of (data ?? []) as { concept_key: string; label: string }[]) map[row.concept_key] = row.label;
  if (churchId) {
    const { data: churchRows } = await sb.from("org_terminology").select("*").eq("church_id", churchId);
    for (const row of (churchRows ?? []) as { concept_key: string; label: string }[]) map[row.concept_key] = row.label;
  }
  return map;
}

export async function setOrgTerm(sb: SupabaseClient, conceptKey: string, label: string, updatedBy?: string, churchId: string | null = null): Promise<void> {
  const { error } = await sb.from("org_terminology").upsert(
    { church_id: churchId, concept_key: conceptKey, label, updated_by: updatedBy, updated_at: new Date().toISOString() },
    { onConflict: "church_id,concept_key" },
  );
  if (error) throw error;
}
