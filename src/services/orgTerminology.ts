"use client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fallback neutro da plataforma. Os rótulos específicos de cada organização
 * devem ser persistidos em `org_terminology` no escopo do tenant.
 *
 * As chaves técnicas permanecem estáveis; somente o texto apresentado muda.
 */
export const ORG_TERM_DEFAULTS: Record<string, string> = {
  lg: "Grupo", life_group: "Grupo", life_group_plural: "Grupos",
  setor: "Setor", area: "Área", distrito: "Distrito",
  nucleo: "Núcleo", sede: "Sede", nacional: "Nacional", igreja: "Organização",
  event: "Evento", events: "Eventos", meeting: "Reunião", meetings: "Reuniões",
  service: "Atividade", services: "Atividades", communion: "Evento especial",
  church: "Organização", community: "Comunicação", discipleship: "Acompanhamento",
  evangelism_group: "Grupo de Voluntários", member_id: "Membro ID",
  admin_role: "Apóstolo", more_brand: "CEC Mais", member_id_brand: "CEC ID",
  organization_name: "Organização", organization_short_name: "Organização",
  program_name: "Programa", academy_brand: "Academy", id_brand: "Membro ID",
  group_name: "Grupo", group_name_plural: "Grupos",
};

export type OrgTerminologyMap = Record<string, string>;

/** Busca defaults neutros globais e depois aplica a configuração específica do tenant. */
export async function getOrgTerminology(sb: SupabaseClient, churchId?: string | null): Promise<OrgTerminologyMap> {
  const { data, error } = await sb.from("org_terminology").select("*").is("church_id", null);
  if (error) {
    // A interface continua utilizável mesmo antes da migration FAM020.
    console.warn("[org-terminology] configuração indisponível; usando fallback neutro");
    return { ...ORG_TERM_DEFAULTS };
  }
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
