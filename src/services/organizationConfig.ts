import type { SupabaseClient } from "@supabase/supabase-js";

export type OrganizationType = "church" | "institute" | "association";
export type OrganizationSetupStatus =
  | "setup_required"
  | "setup_in_progress"
  | "ready_for_review"
  | "active"
  | "suspended"
  | "archived";

export interface OrganizationConfig {
  id: string;
  church_id: string;
  organization_type: OrganizationType;
  setup_status: OrganizationSetupStatus;
  official_name: string | null;
  display_name: string | null;
  short_name: string | null;
  document: string | null;
  address: Record<string, unknown>;
  contacts: Record<string, unknown>;
  social: Record<string, unknown>;
  features: Record<string, unknown>;
  navigation: Record<string, unknown>;
  is_public: boolean;
  approved_by: string | null;
  approved_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type OrganizationConfigInput = Partial<Omit<OrganizationConfig,
  "id" | "church_id" | "created_at" | "updated_at" | "approved_by" | "approved_at" | "updated_by"
>> & { church_id: string };

export async function getOrganizationConfig(
  sb: SupabaseClient,
  churchId: string,
): Promise<OrganizationConfig | null> {
  const { data, error } = await sb
    .from("organization_configs")
    .select("*")
    .eq("church_id", churchId)
    .maybeSingle();

  if (error) {
    console.warn("[organization-config] configuração indisponível", error.message);
    return null;
  }
  return (data as OrganizationConfig | null) ?? null;
}

export async function saveOrganizationConfig(
  sb: SupabaseClient,
  input: OrganizationConfigInput,
): Promise<OrganizationConfig> {
  const { church_id, ...payload } = input;
  const { data, error } = await sb
    .from("organization_configs")
    .upsert(
      { church_id, ...payload, updated_at: new Date().toISOString() },
      { onConflict: "church_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as OrganizationConfig;
}

export function organizationDisplayName(
  config: OrganizationConfig | null | undefined,
  fallback = "Organização",
): string {
  return config?.display_name?.trim()
    || config?.official_name?.trim()
    || fallback;
}

export function organizationIsOperational(
  config: OrganizationConfig | null | undefined,
): boolean {
  return config?.setup_status === "active";
}
