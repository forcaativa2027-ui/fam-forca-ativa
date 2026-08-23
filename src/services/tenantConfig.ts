import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_MENU_ITEMS,
  DEFAULT_PLATFORM_MODULES,
  DEFAULT_TENANT_LABELS,
  ORGANIZATION_TEMPLATES,
  PLATFORM_CONFIG,
  defaultBranding,
  moduleLabel,
  type MenuAudience,
  type PlatformModule,
  type TenantBranding,
  type TenantMenuItem,
  type TenantModuleConfig,
  type TenantRecord,
  type TenantSnapshot,
} from "@/config/modules";
import { resolveCommunity } from "@/services/community";
import { getOrgTerminology } from "@/services/orgTerminology";
import { logAudit } from "@/services/audit";

const TEMPLATE_MODULES: Record<string, string[]> = {
  CHURCH_DEFAULT: DEFAULT_PLATFORM_MODULES.map((item) => item.module_key),
  ASSOCIATION_DEFAULT: [
    "core.home", "core.profile", "core.notifications", "content.news", "content.videos",
    "content.events", "content.agenda", "support.talk_to_someone", "finance.giving",
    "admin.members", "admin.reports",
  ],
  INSTITUTE_DEFAULT: [
    "core.home", "core.profile", "core.notifications", "education.academy", "education.bible",
    "content.news", "content.videos", "content.events", "content.agenda", "support.talk_to_someone",
    "finance.giving", "admin.members", "admin.reports",
  ],
  SOCIAL_PROJECT_DEFAULT: [
    "core.home", "core.profile", "core.notifications", "content.news", "content.events",
    "content.agenda", "support.talk_to_someone", "finance.giving", "admin.members", "admin.reports",
  ],
};

const LEGACY_LABEL_ALIASES: Record<string, string> = {
  lg: "life_group",
  igreja: "church",
  igreja_comunidade: "church",
  nacional: "national",
};

export interface TenantCreateInput {
  name: string;
  legal_name?: string | null;
  display_name?: string | null;
  short_name?: string | null;
  slug: string;
  organization_type: string;
  template_key?: string;
  primary_color?: string | null;
  secondary_color?: string | null;
  logo_primary?: string | null;
  created_by?: string | null;
}

export interface TenantAdminInput {
  tenant_id: string;
  profile_id?: string | null;
  email?: string | null;
  display_name?: string | null;
  status?: "invited" | "active" | "suspended" | "revoked";
  can_change_branding?: boolean;
  can_change_menu?: boolean;
  can_change_labels?: boolean;
  can_configure_modules?: boolean;
  can_create_admins?: boolean;
  created_by?: string | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isMissingTable(error: unknown): boolean {
  const item = asRecord(error);
  const code = String(item.code ?? "");
  const message = String(item.message ?? "").toLowerCase();
  return code === "42P01" || message.includes("does not exist") || message.includes("schema cache");
}

function normalizeTenant(row: Record<string, unknown> | null): TenantRecord | null {
  if (!row || typeof row.id !== "string") return null;
  return {
    ...row,
    id: row.id,
    name: String(row.name ?? row.display_name ?? "Organização"),
    type: typeof row.organization_type === "string" ? row.organization_type : (row.type as string | undefined),
    tenant_status: (row.tenant_status as string | undefined) ?? (row.is_active === false ? "inactive" : "active"),
  } as TenantRecord;
}

function defaultModulesForTenant(tenant: TenantRecord | null): Set<string> {
  if (!tenant) return new Set(TEMPLATE_MODULES.CHURCH_DEFAULT);
  const type = String(tenant.type ?? "church");
  const key = type === "association" ? "ASSOCIATION_DEFAULT"
    : type === "institute" ? "INSTITUTE_DEFAULT"
      : type === "social_project" ? "SOCIAL_PROJECT_DEFAULT" : "CHURCH_DEFAULT";
  return new Set(TEMPLATE_MODULES[key]);
}

function mergeModules(tenant: TenantRecord | null, rows: Record<string, unknown>[]): { modules: PlatformModule[]; tenantModules: TenantModuleConfig[] } {
  const configured = new Map(rows.map((row) => [String(row.module_key), row]));
  const defaultEnabled = defaultModulesForTenant(tenant);
  const tenantModules: TenantModuleConfig[] = [];
  const modules = DEFAULT_PLATFORM_MODULES.map((item, fallbackOrder) => {
    const row = configured.get(item.module_key);
    const config = asRecord(row?.config);
    const tenantModule: TenantModuleConfig = {
      tenant_id: tenant?.id ?? "",
      module_key: item.module_key,
      enabled: row ? row.enabled !== false : defaultEnabled.has(item.module_key),
      label_override: typeof row?.label_override === "string" ? row.label_override : null,
      icon_override: typeof row?.icon_override === "string" ? row.icon_override : null,
      route_override: typeof row?.route_override === "string" ? row.route_override : null,
      sort_order: typeof row?.sort_order === "number" ? row.sort_order : fallbackOrder,
      config,
    };
    tenantModules.push(tenantModule);
    return item;
  }).sort((a, b) => {
    const orderA = tenantModules.find((row) => row.module_key === a.module_key)?.sort_order ?? 0;
    const orderB = tenantModules.find((row) => row.module_key === b.module_key)?.sort_order ?? 0;
    return orderA - orderB;
  });
  return { modules, tenantModules };
}

function mergeLabels(legacy: Record<string, string>, rows: Record<string, unknown>[]): Record<string, string> {
  const labels = { ...DEFAULT_TENANT_LABELS, ...legacy };
  for (const row of rows) {
    const key = String(row.key ?? "");
    const value = String(row.value ?? "").trim();
    if (key && value) labels[key] = value;
  }
  for (const [from, to] of Object.entries(LEGACY_LABEL_ALIASES)) {
    if (legacy[from]) labels[to] = legacy[from];
  }
  return labels;
}

function mergeBranding(tenant: TenantRecord | null, row: Record<string, unknown> | null): TenantBranding {
  const fallback = defaultBranding(tenant);
  if (!row) return fallback;
  return {
    ...fallback,
    ...row,
    tenant_id: tenant?.id ?? String(row.tenant_id ?? ""),
    display_name: String(row.display_name ?? fallback.display_name ?? ""),
    theme_mode: row.theme_mode === "dark" || row.theme_mode === "system" ? row.theme_mode : "light",
    background_style: String(row.background_style ?? fallback.background_style),
  } as TenantBranding;
}

function defaultMenus(tenant: TenantRecord | null, modules: PlatformModule[], tenantModules: TenantModuleConfig[]): TenantMenuItem[] {
  const enabled = new Set(tenantModules.filter((item) => item.enabled).map((item) => item.module_key));
  return DEFAULT_MENU_ITEMS
    .filter((item) => enabled.has(item.module_key))
    .map((item) => ({ ...item, tenant_id: tenant?.id ?? "" }))
    .map((item) => {
      const mod = modules.find((candidate) => candidate.module_key === item.module_key);
      const config = tenantModules.find((candidate) => candidate.module_key === item.module_key);
      return {
        ...item,
        label_override: config?.label_override ?? null,
        route_override: config?.route_override ?? null,
        icon_override: config?.icon_override ?? null,
        position: config?.sort_order ?? item.position,
        section: mod?.category ?? item.section,
      };
    })
    .sort((a, b) => a.position - b.position);
}

export async function resolveTenant(sb: SupabaseClient): Promise<TenantRecord | null> {
  const community = await resolveCommunity(sb);
  return normalizeTenant(community as unknown as Record<string, unknown> | null);
}

export async function getTenantSnapshot(sb: SupabaseClient, tenantId?: string | null): Promise<TenantSnapshot> {
  let tenant: TenantRecord | null = null;
  if (tenantId) {
    const { data } = await sb.from("churches").select("*").eq("id", tenantId).maybeSingle();
    tenant = normalizeTenant((data as Record<string, unknown> | null) ?? null);
  } else {
    tenant = await resolveTenant(sb);
  }

  const fallbackModules = mergeModules(tenant, []);
  const fallbackLabels = { ...DEFAULT_TENANT_LABELS };
  const fallbackMenu = defaultMenus(tenant, fallbackModules.modules, fallbackModules.tenantModules);
  const empty: TenantSnapshot = {
    platform: { name: PLATFORM_CONFIG.name, shortName: PLATFORM_CONFIG.shortName },
    tenant,
    branding: defaultBranding(tenant),
    modules: fallbackModules.modules,
    tenantModules: fallbackModules.tenantModules,
    menus: fallbackMenu,
    labels: fallbackLabels,
    isPlatformAdmin: false,
    isTenantAdmin: false,
  };
  if (!tenant?.id) return empty;

  const [brandingResult, modulesResult, menusResult, labelsResult, legacyResult, platformAdminResult, tenantAdminResult] = await Promise.all([
    sb.from("tenant_branding").select("*").eq("tenant_id", tenant.id).maybeSingle(),
    sb.from("tenant_modules").select("*").eq("tenant_id", tenant.id).order("sort_order"),
    sb.from("tenant_menu_items").select("*").eq("tenant_id", tenant.id).order("position"),
    sb.from("tenant_labels").select("*").eq("tenant_id", tenant.id).eq("locale", "pt-BR"),
    getOrgTerminology(sb, tenant.id),
    sb.rpc("is_platform_admin"),
    sb.from("tenant_admins").select("id").eq("tenant_id", tenant.id).eq("profile_id", (await sb.auth.getUser()).data.user?.id ?? "").eq("status", "active").maybeSingle(),
  ]);

  const brandingRow = brandingResult.error && isMissingTable(brandingResult.error) ? null : brandingResult.data as Record<string, unknown> | null;
  const moduleRows = modulesResult.error && isMissingTable(modulesResult.error) ? [] : (modulesResult.data ?? []) as Record<string, unknown>[];
  const menuRows = menusResult.error && isMissingTable(menusResult.error) ? [] : (menusResult.data ?? []) as Record<string, unknown>[];
  const labelRows = labelsResult.error && isMissingTable(labelsResult.error) ? [] : (labelsResult.data ?? []) as Record<string, unknown>[];
  const legacyLabels = legacyResult ?? {};
  const merged = mergeModules(tenant, moduleRows);
  const menus = menuRows.length > 0 ? menuRows.map((row) => ({
    ...row,
    tenant_id: tenant.id,
    label_override: row.label_override as string | null,
    icon_override: row.icon_override as string | null,
    route_override: row.route_override as string | null,
    position: Number(row.position ?? 0),
    is_visible: row.is_visible !== false,
    audience: (row.audience ?? "public") as MenuAudience,
    parent_id: row.parent_id as string | null,
    section: row.section as string | null,
  })) as TenantMenuItem[] : defaultMenus(tenant, merged.modules, merged.tenantModules);

  return {
    ...empty,
    branding: mergeBranding(tenant, brandingRow),
    modules: merged.modules,
    tenantModules: merged.tenantModules,
    menus,
    labels: mergeLabels(legacyLabels, labelRows),
    isPlatformAdmin: platformAdminResult.error ? false : Boolean(platformAdminResult.data),
    isTenantAdmin: !tenantAdminResult.error && Boolean(tenantAdminResult.data),
  };
}

export function getTenantModule(snapshot: TenantSnapshot, moduleKey: string): PlatformModule | undefined {
  return snapshot.modules.find((item) => item.module_key === moduleKey);
}

export function isTenantModuleEnabled(snapshot: TenantSnapshot, moduleKey: string): boolean {
  return snapshot.tenantModules.some((item) => item.module_key === moduleKey && item.enabled);
}

export function getTenantLabel(snapshot: TenantSnapshot, key: string, fallback?: string): string {
  const moduleItem = getTenantModule(snapshot, key);
  const moduleConfig = snapshot.tenantModules.find((item) => item.module_key === key);
  if (moduleItem) return moduleLabel(moduleItem, snapshot.labels, moduleConfig?.label_override);
  return snapshot.labels[key] ?? fallback ?? key;
}

export function getTenantRoute(snapshot: TenantSnapshot, moduleKey: string, fallback: string): string {
  const moduleItem = getTenantModule(snapshot, moduleKey);
  const moduleConfig = snapshot.tenantModules.find((item) => item.module_key === moduleKey);
  return moduleConfig?.route_override?.trim() || moduleItem?.route || fallback;
}

export async function listTenants(sb: SupabaseClient): Promise<TenantRecord[]> {
  const { data, error } = await sb.from("churches").select("*").order("name");
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(normalizeTenant).filter(Boolean) as TenantRecord[];
}

export async function createTenant(sb: SupabaseClient, input: TenantCreateInput): Promise<TenantRecord> {
  const payload = {
    name: input.name.trim(),
    legal_name: input.legal_name?.trim() || input.name.trim(),
    display_name: input.display_name?.trim() || input.name.trim(),
    short_name: input.short_name?.trim() || null,
    slug: input.slug.trim().toLowerCase(),
    organization_type: input.organization_type,
    tenant_status: "active",
    is_active: true,
    logo_url: input.logo_primary || null,
    primary_color: input.primary_color || "#0E2A47",
    secondary_color: input.secondary_color || "#C9A227",
  };
  const { data, error } = await sb.from("churches").insert(payload).select("*").single();
  if (error) throw error;
  const tenant = normalizeTenant(data as Record<string, unknown>);
  if (!tenant) throw new Error("O banco não retornou o tenant criado.");

  const templateKey = input.template_key || "CHURCH_DEFAULT";
  await Promise.all([
    sb.from("tenant_branding").upsert({
      tenant_id: tenant.id,
      display_name: payload.display_name,
      short_name: payload.short_name,
      legal_name: payload.legal_name,
      logo_primary: payload.logo_url,
      primary_color: payload.primary_color,
      secondary_color: payload.secondary_color,
      accent_color: payload.secondary_color,
    }, { onConflict: "tenant_id" }),
    sb.from("tenant_settings").upsert({ tenant_id: tenant.id, template_key: templateKey }, { onConflict: "tenant_id" }),
    sb.from("tenant_templates").upsert({ tenant_id: tenant.id, template_key: templateKey, applied_by: input.created_by ?? null }, { onConflict: "tenant_id" }),
    sb.from("tenant_modules").upsert(
      (TEMPLATE_MODULES[templateKey] ?? TEMPLATE_MODULES.CHURCH_DEFAULT).map((module_key, sort_order) => ({ tenant_id: tenant.id, module_key, enabled: true, sort_order })),
      { onConflict: "tenant_id,module_key" },
    ),
  ]);
  await logAudit(sb, "insert", "tenant", tenant.id, { organization_type: input.organization_type, template_key: templateKey });
  return tenant;
}

export async function updateTenant(sb: SupabaseClient, tenantId: string, input: Partial<TenantCreateInput> & { is_active?: boolean; tenant_status?: string }): Promise<void> {
  const payload: Record<string, unknown> = {};
  for (const key of ["name", "legal_name", "display_name", "short_name", "slug", "organization_type", "is_active", "tenant_status"] as const) {
    if (input[key] !== undefined) payload[key] = typeof input[key] === "string" ? input[key]?.trim() : input[key];
  }
  if (Object.keys(payload).length === 0) return;
  const { error } = await sb.from("churches").update(payload).eq("id", tenantId);
  if (error) throw error;
  await logAudit(sb, "update", "tenant", tenantId, { after: payload });
}

export async function upsertTenantBranding(sb: SupabaseClient, tenantId: string, input: Partial<TenantBranding>): Promise<void> {
  const { error } = await sb.from("tenant_branding").upsert({ ...input, tenant_id: tenantId, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
  if (error) throw error;
  await logAudit(sb, "update", "tenant_branding", tenantId, { after: input as Record<string, unknown> });
}

export async function setTenantModule(sb: SupabaseClient, tenantId: string, moduleKey: string, enabled: boolean, patch: Partial<TenantModuleConfig> = {}): Promise<void> {
  const moduleItem = DEFAULT_PLATFORM_MODULES.find((item) => item.module_key === moduleKey);
  if (!moduleItem) throw new Error("Módulo técnico desconhecido.");
  if (!enabled && (!moduleItem.can_disable || moduleItem.is_required)) throw new Error("Este módulo é obrigatório para o funcionamento da plataforma.");
  const dependencies = moduleItem.depends_on ?? [];
  if (enabled && dependencies.length > 0) {
    const { data } = await sb.from("tenant_modules").select("module_key,enabled").eq("tenant_id", tenantId).in("module_key", dependencies);
    const enabledKeys = new Set((data ?? []).filter((row) => row.enabled).map((row) => row.module_key));
    const missing = dependencies.find((key) => !enabledKeys.has(key));
    if (missing) throw new Error(`Ative antes o módulo dependência: ${missing}.`);
  }
  const { error } = await sb.from("tenant_modules").upsert({
    tenant_id: tenantId,
    module_key: moduleKey,
    enabled,
    label_override: patch.label_override ?? null,
    icon_override: patch.icon_override ?? null,
    route_override: patch.route_override ?? null,
    sort_order: patch.sort_order ?? 0,
    config: patch.config ?? {},
    updated_at: new Date().toISOString(),
  }, { onConflict: "tenant_id,module_key" });
  if (error) throw error;
  await logAudit(sb, enabled ? "insert" : "update", "tenant_module", tenantId, { module_key: moduleKey, enabled });
}

export async function upsertTenantLabel(sb: SupabaseClient, tenantId: string, key: string, value: string, locale = "pt-BR"): Promise<void> {
  const cleanValue = value.trim();
  if (!cleanValue) throw new Error("O label não pode ficar vazio.");
  const { error } = await sb.from("tenant_labels").upsert({ tenant_id: tenantId, key: key.trim(), value: cleanValue, locale, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,key,locale" });
  if (error) throw error;
  await logAudit(sb, "update", "tenant_label", tenantId, { key, value: cleanValue, locale });
}

export async function upsertTenantAdmin(sb: SupabaseClient, input: TenantAdminInput): Promise<void> {
  const { error } = await sb.from("tenant_admins").upsert({ ...input, status: input.status ?? "invited", updated_at: new Date().toISOString() }, { onConflict: input.profile_id ? "tenant_id,profile_id" : "tenant_id,email" });
  if (error) throw error;
  await logAudit(sb, "insert", "tenant_admin", input.tenant_id, { email: input.email, profile_id: input.profile_id });
}

export async function listTenantAdmins(sb: SupabaseClient, tenantId: string) {
  const { data, error } = await sb.from("tenant_admins").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function templateForOrganization(type: string) {
  return ORGANIZATION_TEMPLATES.find((template) => template.type === type) ?? ORGANIZATION_TEMPLATES.find((template) => template.key === "CUSTOM");
}

export async function upsertTenantMenuItem(sb: SupabaseClient, tenantId: string, input: Partial<TenantMenuItem> & { module_key: string; audience?: MenuAudience }): Promise<void> {
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    tenant_id: tenantId,
    module_key: input.module_key,
    label_override: input.label_override?.trim() || null,
    icon_override: input.icon_override?.trim() || null,
    route_override: input.route_override?.trim() || null,
    position: input.position ?? 0,
    is_visible: input.is_visible ?? true,
    audience: input.audience ?? "public",
    parent_id: input.parent_id ?? null,
    section: input.section ?? null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from("tenant_menu_items").upsert(payload, { onConflict: "tenant_id,module_key,audience" });
  if (error) throw error;
  await logAudit(sb, "update", "tenant_menu_item", tenantId, { module_key: input.module_key, audience: payload.audience, is_visible: payload.is_visible, position: payload.position });
}
