"use client";

import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  DEFAULT_MENU_ITEMS,
  DEFAULT_PLATFORM_MODULES,
  DEFAULT_TENANT_LABELS,
  PLATFORM_CONFIG,
  defaultBranding,
  type TenantSnapshot,
} from "@/config/modules";
import { getTenantLabel, getTenantRoute, isTenantModuleEnabled, getTenantSnapshot } from "@/services/tenantConfig";

export interface TenantContextValue extends TenantSnapshot {
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<unknown>;
  isModuleEnabled: (moduleKey: string) => boolean;
  label: (key: string, fallback?: string) => string;
  route: (moduleKey: string, fallback: string) => string;
}

const FALLBACK_SNAPSHOT: TenantSnapshot = {
  platform: { name: PLATFORM_CONFIG.name, shortName: PLATFORM_CONFIG.shortName },
  tenant: null,
  branding: defaultBranding(null),
  modules: DEFAULT_PLATFORM_MODULES,
  tenantModules: DEFAULT_PLATFORM_MODULES.map((item, sort_order) => ({
    tenant_id: "",
    module_key: item.module_key,
    enabled: item.is_core || ["content.news", "content.videos", "content.events", "content.agenda", "content.radio", "finance.giving", "community.life_group", "community.discipleship", "education.academy", "education.bible", "education.kids", "admin.members", "admin.structure", "admin.reports", "admin.security"].includes(item.module_key),
    label_override: null,
    icon_override: null,
    route_override: null,
    sort_order,
    config: {},
  })),
  menus: DEFAULT_MENU_ITEMS,
  labels: DEFAULT_TENANT_LABELS,
  isPlatformAdmin: false,
  isTenantAdmin: false,
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["tenant-config"],
    queryFn: () => getTenantSnapshot(supabase),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const snapshot = query.data ?? FALLBACK_SNAPSHOT;
  const value = useMemo<TenantContextValue>(() => ({
    ...snapshot,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["tenant-config"] }),
    isModuleEnabled: (moduleKey) => isTenantModuleEnabled(snapshot, moduleKey),
    label: (key, fallback) => getTenantLabel(snapshot, key, fallback),
    route: (moduleKey, fallback) => getTenantRoute(snapshot, moduleKey, fallback),
  }), [query.data, query.error, query.isLoading, queryClient, snapshot]);

  const themeStyle = {
    "--tenant-primary": snapshot.branding.primary_color ?? "#0E2A47",
    "--tenant-secondary": snapshot.branding.secondary_color ?? "#C9A227",
    "--tenant-accent": snapshot.branding.accent_color ?? snapshot.branding.secondary_color ?? "#C9A227",
  } as CSSProperties;

  return <TenantContext.Provider value={value}><div data-tenant-id={snapshot.tenant?.id ?? undefined} style={themeStyle}>{children}</div></TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenant deve ser usado dentro de TenantProvider");
  return context;
}
