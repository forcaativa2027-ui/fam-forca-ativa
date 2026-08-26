import type { SupabaseClient } from "@supabase/supabase-js";
import type { Banner, BannerWorkflowStatus } from "@/types/domain";

/** Lista somente banners FAM elegíveis; mantém fallback para schema legado durante a migração. */
export async function listActiveBanners(sb: SupabaseClient, churchId?: string | null): Promise<Banner[]> {
  try {
    const { data, error } = await sb.from("banners").select("*")
      .eq("tenant_key", "FAM")
      .eq("is_active", true)
      .in("workflow_status", ["publicado", "agendado"])
      .order("priority", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false });
    if (!error) return filterEligible((data ?? []) as Banner[]);
  } catch { /* fallback legado abaixo */ }

  try {
    let q = sb.from("banners").select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
    const { data, error } = await q;
    if (error) return [];
    return filterEligible((data ?? []) as Banner[]);
  } catch { return []; }
}

function filterEligible(banners: Banner[]): Banner[] {
  const now = Date.now();
  return banners.filter((b) => {
    if (b.tenant_key && b.tenant_key !== "FAM") return false;
    if (b.workflow_status && !["publicado", "agendado"].includes(b.workflow_status)) return false;
    if (!b.is_active) return false;
    if (b.starts_at && new Date(b.starts_at).getTime() > now) return false;
    if (b.ends_at && new Date(b.ends_at).getTime() < now) return false;
    if (b.audience && b.audience !== "publico_geral") return false;
    return true;
  });
}

/** Lista todos os banners para a administração, ordenados por prioridade e ordem manual. */
export async function listAllBanners(sb: SupabaseClient): Promise<Banner[]> {
  try {
    const { data, error } = await sb.from("banners").select("*")
      .eq("tenant_key", "FAM")
      .order("priority", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (!error) return (data ?? []) as Banner[];
  } catch { /* fallback legado abaixo */ }
  try {
    const { data, error } = await sb.from("banners").select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as Banner[];
  } catch { return []; }
}

export async function createBanner(sb: SupabaseClient, input: Partial<Banner>): Promise<Banner> {
  const payload = { tenant_key: "FAM", ...input };
  const { data, error } = await sb.from("banners").insert(payload).select().single();
  if (error) throw error;
  return data as Banner;
}

export async function updateBanner(sb: SupabaseClient, id: string, patch: Partial<Banner>): Promise<void> {
  const { error } = await sb.from("banners").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteBanner(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("banners").delete().eq("id", id);
  if (error) throw error;
}

export async function swapBannerOrder(sb: SupabaseClient, a: Banner, b: Banner): Promise<void> {
  const { error: e1 } = await sb.from("banners").update({ sort_order: b.sort_order }).eq("id", a.id);
  if (e1) throw e1;
  const { error: e2 } = await sb.from("banners").update({ sort_order: a.sort_order }).eq("id", b.id);
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
    tenant_key: "FAM",
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
