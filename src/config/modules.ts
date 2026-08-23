export type OrganizationType =
  | "church"
  | "community"
  | "institute"
  | "association"
  | "osc"
  | "oscip"
  | "foundation"
  | "social_project"
  | "other";

export type TenantStatus = "active" | "suspended" | "inactive";
export type MenuAudience = "public" | "member" | "admin" | "all";

export interface PlatformModule {
  module_key: string;
  default_label: string;
  category: string;
  route: string;
  admin_tab: string | null;
  icon_key: string | null;
  is_core: boolean;
  is_required: boolean;
  can_disable: boolean;
  supports_custom_label: boolean;
  supports_custom_icon: boolean;
  supports_custom_order: boolean;
  depends_on: string[];
  conflicts_with: string[];
}

export interface TenantModuleConfig {
  tenant_id: string;
  module_key: string;
  enabled: boolean;
  label_override: string | null;
  icon_override: string | null;
  route_override: string | null;
  sort_order: number;
  config: Record<string, unknown>;
}

export interface TenantMenuItem {
  id?: string;
  tenant_id: string;
  module_key: string;
  label_override: string | null;
  icon_override: string | null;
  route_override: string | null;
  position: number;
  is_visible: boolean;
  audience: MenuAudience;
  parent_id: string | null;
  section: string | null;
}

export interface TenantBranding {
  tenant_id: string;
  display_name: string | null;
  short_name: string | null;
  legal_name: string | null;
  logo_primary: string | null;
  logo_dark: string | null;
  logo_light: string | null;
  favicon: string | null;
  app_icon: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_style: string;
  login_image: string | null;
  welcome_image: string | null;
  theme_mode: "light" | "dark" | "system";
}

export interface TenantRecord {
  id: string;
  type?: string | null;
  legal_name?: string | null;
  display_name?: string | null;
  name: string;
  short_name?: string | null;
  slug?: string | null;
  is_active?: boolean;
  tenant_status?: TenantStatus | string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  favicon_url?: string | null;
  app_icon_url?: string | null;
  [key: string]: unknown;
}

export interface TenantSnapshot {
  platform: {
    name: string;
    shortName: string;
  };
  tenant: TenantRecord | null;
  branding: TenantBranding;
  modules: PlatformModule[];
  tenantModules: TenantModuleConfig[];
  menus: TenantMenuItem[];
  labels: Record<string, string>;
  isPlatformAdmin: boolean;
  isTenantAdmin: boolean;
}

export const PLATFORM_CONFIG = {
  name: "Servo360",
  shortName: "Servo360",
  description: "Plataforma configurável para igrejas, comunidades e organizações.",
  defaultTenantSlug: process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "manaus",
  tenantBaseDomain: process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ?? "cecfamily.com.br",
};

const module = (
  module_key: string,
  default_label: string,
  category: string,
  route: string,
  icon_key: string,
  options: Partial<PlatformModule> = {},
): PlatformModule => ({
  module_key,
  default_label,
  category,
  route,
  admin_tab: null,
  icon_key,
  is_core: false,
  is_required: false,
  can_disable: true,
  supports_custom_label: true,
  supports_custom_icon: false,
  supports_custom_order: true,
  depends_on: [],
  conflicts_with: [],
  ...options,
});

export const DEFAULT_PLATFORM_MODULES: PlatformModule[] = [
  module("core.home", "Início", "core", "/", "home", { is_core: true, is_required: true, can_disable: false, supports_custom_order: false }),
  module("core.profile", "Perfil", "core", "/painel", "user", { is_core: true, is_required: true, can_disable: false, supports_custom_order: false }),
  module("core.notifications", "Notificações", "core", "/painel", "bell", { is_core: true, is_required: true, can_disable: false, supports_custom_order: false }),
  module("core.wallet", "Carteira", "core", "/painel/carteira", "wallet", { is_core: true }),
  module("community.life_group", "Life Groups", "community", "/painel", "users", { admin_tab: "life-groups" }),
  module("community.discipleship", "Discipulado", "community", "/painel", "book-open", { admin_tab: "discipleship" }),
  module("community.prayer", "Oração", "community", "/?tab=contato", "heart", { admin_tab: "prayer-requests" }),
  module("community.ministry", "Ministérios", "community", "/painel", "mic", { admin_tab: "ministerios" }),
  module("community.churches", "Organizações", "community", "/?tab=igrejas", "building", { admin_tab: "communities" }),
  module("education.academy", "Academy", "education", "/painel/cecmais", "graduation-cap", { admin_tab: "formacao" }),
  module("education.bible", "Bíblia", "education", "/painel/cecmais", "book-open", { admin_tab: "conhecimento-biblico" }),
  module("education.kids", "Kids", "education", "/painel", "baby", { admin_tab: "kids-admin" }),
  module("content.news", "Notícias", "content", "/?tab=noticias", "newspaper", { admin_tab: "news" }),
  module("content.videos", "Vídeos", "content", "/?tab=videos", "video", { admin_tab: "news-videos" }),
  module("content.live", "Live-360", "content", "/live", "video", { admin_tab: "live360" }),
  module("content.events", "Eventos", "content", "/?tab=agenda", "calendar", { admin_tab: "registration-events" }),
  module("content.agenda", "Agenda", "content", "/?tab=agenda", "calendar-days", { admin_tab: "events" }),
  module("content.radio", "Rádio Web", "content", "/?tab=radio", "radio", { admin_tab: "radio", supports_custom_icon: true }),
  module("support.talk_to_someone", "Conversar", "support", "/?tab=contato", "message-circle", { admin_tab: "visit-requests" }),
  module("finance.giving", "Doação", "finance", "/?tab=ofertar", "hand-coins", { admin_tab: "giving" }),
  module("admin.members", "Membros", "admin", "/admin", "users", { admin_tab: "members" }),
  module("admin.structure", "Estrutura", "admin", "/admin", "git-branch", { admin_tab: "structure" }),
  module("admin.reports", "Relatórios", "admin", "/admin", "file-chart", { admin_tab: "ministerial-reports" }),
  module("admin.security", "Segurança", "admin", "/admin", "shield", { admin_tab: "permissions" }),
];

export const DEFAULT_TENANT_LABELS: Record<string, string> = {
  platform: PLATFORM_CONFIG.name,
  tenant: "Organização",
  organization: "Organização",
  church: "Igreja/Comunidade",
  churches: "Organizações",
  member: "Membro",
  members: "Membros",
  life_group: "Life Group",
  life_groups: "Life Groups",
  discipleship: "Discipulado",
  ministry: "Ministério",
  ministries: "Ministérios",
  academy: "Academy",
  kids: "Kids",
  news: "Notícias",
  videos: "Vídeos",
  events: "Eventos",
  agenda: "Agenda",
  radio: "Rádio Web",
  live: "Live-360",
  giving: "Doação",
  finance: "Financeiro",
  reports: "Relatórios",
  profile: "Perfil",
  home: "Início",
  notifications: "Notificações",
  prayer: "Oração",
  talk_to_someone: "Conversar",
  community: "Comunidade",
  district: "Distrito",
  area: "Área",
  sector: "Setor",
  nucleo: "Núcleo",
  sede: "Sede",
  national: "Nacional",
};

export const DEFAULT_MENU_ITEMS: TenantMenuItem[] = [
  "core.home", "content.news", "content.radio", "content.videos", "content.agenda", "community.churches", "finance.giving", "core.profile",
].map((module_key, position) => ({
  tenant_id: "",
  module_key,
  label_override: null,
  icon_override: null,
  route_override: null,
  position,
  is_visible: true,
  audience: "public" as MenuAudience,
  parent_id: null,
  section: "public",
}));

export const ORGANIZATION_TEMPLATES = [
  { key: "CHURCH_DEFAULT", label: "Igreja", type: "church" },
  { key: "ASSOCIATION_DEFAULT", label: "Associação", type: "association" },
  { key: "INSTITUTE_DEFAULT", label: "Instituto", type: "institute" },
  { key: "SOCIAL_PROJECT_DEFAULT", label: "Projeto social", type: "social_project" },
  { key: "CUSTOM", label: "Personalizado", type: "other" },
] as const;

export function moduleForAdminTab(tab: string): PlatformModule | undefined {
  return DEFAULT_PLATFORM_MODULES.find((item) => item.admin_tab === tab);
}

export function moduleLabel(moduleItem: PlatformModule, labels: Record<string, string>, override?: string | null): string {
  return override?.trim() || labels[moduleItem.module_key] || labels[moduleItem.module_key.split(".").pop() ?? ""] || moduleItem.default_label;
}

export function defaultBranding(tenant: TenantRecord | null): TenantBranding {
  return {
    tenant_id: tenant?.id ?? "",
    display_name: tenant?.display_name ?? tenant?.name ?? null,
    short_name: tenant?.short_name ?? null,
    legal_name: tenant?.legal_name ?? tenant?.name ?? null,
    logo_primary: tenant?.logo_url ?? null,
    logo_dark: null,
    logo_light: null,
    favicon: tenant?.favicon_url ?? null,
    app_icon: tenant?.app_icon_url ?? null,
    primary_color: tenant?.primary_color ?? "#0E2A47",
    secondary_color: tenant?.secondary_color ?? "#C9A227",
    accent_color: "#C9A227",
    background_style: "solid",
    login_image: null,
    welcome_image: null,
    theme_mode: "light",
  };
}
