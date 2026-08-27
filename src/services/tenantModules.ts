"use client";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Chaves técnicas estáveis; os labels continuam em org_terminology. */
export const TENANT_MODULE_DEFAULTS: Record<string, boolean> = {
  events: true,
  services: true,
  news: true,
  radio: true,
  videos: true,
  participate: true,
  contact: true,
  donations: true,
  discipleship: true,
  ministry: true,
  life_groups: true,
  evangelism_groups: true,
  academy: true,
  kids: true,
  cecmais: true,
  partners: true,
  risk_analysis: true,
};

export type TenantModuleMap = Record<string, boolean>;

/** Mapa único compartilhado pela navegação e pelo bloqueio de URL directa. */
export const TAB_TENANT_MODULE: Record<string, string> = {
  "kids-admin": "kids",
  "life-groups": "life_groups", weekly: "life_groups", monthly: "life_groups",
  "evangelism-groups": "evangelism_groups",
  ministerios: "ministry", "ministerial-reports": "ministry", intelligence: "ministry",
  mda: "ministry", "mda-health": "ministry", "relmda-supervisao": "ministry", "relmda-consolidacao": "ministry", "relmda-dashboard": "ministry", "relmda-prazos": "ministry", "relmda-area": "ministry",
  news: "news", banners: "news", "editorial-dashboard": "news", "content-library": "news", "categories-tags": "news",
  sermons: "videos", "news-videos": "videos", radio: "radio", live360: "videos",
  events: "events", "registration-events": "events", services: "services", word: "services",
  giving: "donations", "cecmais-ofertas": "cecmais",
  formacao: "academy", "conhecimento-biblico": "academy", "biblioteca-conhecimento": "academy", "biblia-referencias": "academy",
  discipleship: "discipleship", acolhimento: "contact", "prayer-requests": "contact", "visit-requests": "contact",
  communities: "partners", structure: "partners", genealogy: "partners", "expansion-map": "partners",
  "fam-credenciamento": "usuarios",
};

/** Defaults globais + overrides do tenant; falha de rede não esconde módulos. */
export async function getTenantModules(
  sb: SupabaseClient,
  churchId?: string | null,
): Promise<TenantModuleMap> {
  const modules = { ...TENANT_MODULE_DEFAULTS };
  if (!churchId) return modules;
  const { data, error } = await sb
    .from("tenant_modules")
    .select("module_key, enabled")
    .eq("church_id", churchId);
  if (error) {
    console.warn("[tenant-modules] configuração indisponível; usando defaults");
    return modules;
  }
  for (const row of (data ?? []) as { module_key: string; enabled: boolean }[]) {
    modules[row.module_key] = row.enabled;
  }
  return modules;
}

export function isTenantModuleEnabled(modules: TenantModuleMap, key: string): boolean {
  return modules[key] !== false;
}
