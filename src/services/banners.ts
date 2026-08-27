import type { SupabaseClient } from "@supabase/supabase-js";
import type { Banner, BannerWorkflowStatus } from "@/types/domain";

const FAM_TENANT_KEY = "FAM" as const;

/**
 * Lista somente banners FAM elegíveis.
 *
 * Falhas de schema, RLS ou rede são tratadas como falha fechada: a função
 * retorna uma lista vazia para que a UI use o hero institucional estático.
 * Nunca há uma segunda consulta sem escopo de tenant.
 */
export async function listActiveBanners(sb: SupabaseClient): Promise<Banner[]> {
  const { data, error } = await sb.from("banners").select("*")
    .eq("tenant_key", FAM_TENANT_KEY)
    .eq("is_active", true)
    .in("workflow_status", ["publicado", "agendado"])
    .order("priority", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) return [];
  return filterEligible((data ?? []) as Banner[]);
}

function filterEligible(banners: Banner[]): Banner[] {
  const now = Date.now();
  return banners.filter((b) => {
    // Ausência/null nunca é interpretada como banner FAM.
    if (b.tenant_key !== FAM_TENANT_KEY) return false;
    if (!b.is_active) return false;
    if (!b.workflow_status || !["publicado", "agendado"].includes(b.workflow_status)) return false;
    if (b.starts_at && new Date(b.starts_at).getTime() > now) return false;
    if (b.ends_at && new Date(b.ends_at).getTime() < now) return false;
    if (b.audience && b.audience !== "publico_geral") return false;
    return true;
  });
}

/**
 * Lista todos os banners FAM para a administração.
 * Em caso de erro, lança a falha em vez de retornar dados globais ou parciais.
 */
export async function listAllBanners(sb: SupabaseClient): Promise<Banner[]> {
  const { data, error } = await sb.from("banners").select("*")
    .eq("tenant_key", FAM_TENANT_KEY)
    .order("priority", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as Banner[]).filter((banner) => banner.tenant_key === FAM_TENANT_KEY);
}

export async function createBanner(sb: SupabaseClient, input: Partial<Banner>): Promise<Banner> {
  // O tenant é imposto pelo serviço; nunca aceitar esse campo do formulário.
  const { tenant_key: _ignoredTenant, ...safeInput } = input as Partial<Banner> & { tenant_key?: string };
  const payload = { ...safeInput, tenant_key: FAM_TENANT_KEY };
  const { data, error } = await sb.from("banners").insert(payload).select().single();
  if (error) throw error;
  return data as Banner;
}

export async function updateBanner(sb: SupabaseClient, id: string, patch: Partial<Banner>): Promise<void> {
  const { tenant_key: _ignoredTenant, ...safePatch } = patch as Partial<Banner> & { tenant_key?: string };
  const { error } = await sb.from("banners").update(safePatch)
    .eq("id", id)
    .eq("tenant_key", FAM_TENANT_KEY);
  if (error) throw error;
}

export async function deleteBanner(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("banners").delete()
    .eq("id", id)
    .eq("tenant_key", FAM_TENANT_KEY);
  if (error) throw error;
}

export async function swapBannerOrder(sb: SupabaseClient, a: Banner, b: Banner): Promise<void> {
  const { error: e1 } = await sb.from("banners").update({ sort_order: b.sort_order })
    .eq("id", a.id)
    .eq("tenant_key", FAM_TENANT_KEY);
  if (e1) throw e1;
  const { error: e2 } = await sb.from("banners").update({ sort_order: a.sort_order })
    .eq("id", b.id)
    .eq("tenant_key", FAM_TENANT_KEY);
  if (e2) throw e2;
}

export async function setBannerWorkflowStatus(sb: SupabaseClient, id: string, status: BannerWorkflowStatus): Promise<void> {
  const patch: Partial<Banner> = { workflow_status: status };
  if (status === "publicado") patch.published_at = new Date().toISOString();
  if (status === "pausado") patch.paused_at = new Date().toISOString();
  if (status === "arquivado") patch.archived_at = new Date().toISOString();
  await updateBanner(sb, id, patch);
}

export async function recordBannerEvent(
  sb: SupabaseClient,
  bannerId: string,
  eventType: "impressao" | "cta_click" | "avanço_manual" | "pausa" | "erro_imagem" | "erro_link",
  metadataMinimal: Record<string, string> = {},
): Promise<void> {
  const { error } = await sb.from("fam_banner_events").insert({
    tenant_key: FAM_TENANT_KEY,
    banner_id: bannerId,
    event_type: eventType,
    device_type: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop",
    metadata_minimal: { route: "/", source: "home_carousel", ...metadataMinimal },
  });
  if (error) throw error;
}

export type FamBannerWorkflowAction =
  | "enviar_revisao" | "aprovar" | "reprovar" | "agendar"
  | "publicar" | "pausar" | "arquivar";

export async function transitionFamBannerWorkflow(
  sb: SupabaseClient,
  bannerId: string,
  action: FamBannerWorkflowAction,
  note: string | null = null,
): Promise<void> {
  const { error } = await sb.rpc("transition_fam_banner_workflow", {
    p_banner_id: bannerId,
    p_action: action,
    p_note: note,
  });
  if (error) throw error;
}
