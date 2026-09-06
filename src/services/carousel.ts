import type { SupabaseClient } from "@supabase/supabase-js";
import type { CarouselItem } from "@/types/domain";

const FAM_TENANT = "FAM";

/** Lista itens publicos do carrossel (RPC com filtragem server-side). */
export async function listActiveCarouselItems(sb: SupabaseClient): Promise<CarouselItem[]> {
  const { data, error } = await sb.rpc("get_active_carousel_items", { p_tenant: FAM_TENANT });
  if (error) return [];
  return (data ?? []) as CarouselItem[];
}

/** Lista todos os itens do carrossel para a administracao. */
export async function listAllCarouselItems(sb: SupabaseClient): Promise<CarouselItem[]> {
  const { data, error } = await sb.from("content_carousel_items").select("*")
    .eq("tenant_key", FAM_TENANT)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CarouselItem[];
}

/** Cria um item no carrossel. */
export async function createCarouselItem(sb: SupabaseClient, input: Partial<CarouselItem>): Promise<CarouselItem> {
  const { id: _id, created_at: _ca, updated_at: _ua, ...safeInput } = input as Partial<CarouselItem> & { id?: string; created_at?: string; updated_at?: string };
  const payload = { ...safeInput, tenant_key: FAM_TENANT };
  const { data, error } = await sb.from("content_carousel_items").insert(payload).select().single();
  if (error) throw error;
  return data as CarouselItem;
}

/** Atualiza um item do carrossel. */
export async function updateCarouselItem(sb: SupabaseClient, id: string, input: Partial<CarouselItem>): Promise<CarouselItem> {
  const { id: _id, created_at: _ca, updated_at: _ua, tenant_key: _tk, ...safeInput } = input as Partial<CarouselItem> & { id?: string; created_at?: string; updated_at?: string; tenant_key?: string };
  const { data, error } = await sb.from("content_carousel_items").update(safeInput).eq("id", id).select().single();
  if (error) throw error;
  return data as CarouselItem;
}

/** Remove um item do carrossel. */
export async function deleteCarouselItem(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("content_carousel_items").delete().eq("id", id);
  if (error) throw error;
}

/** Registra evento de auditoria. */
export async function logCarouselAudit(sb: SupabaseClient, action: string, itemId: string | null, itemTitle: string | null, details?: Record<string, unknown>): Promise<void> {
  await sb.from("carousel_audit_events").insert({
    action, item_id: itemId, item_title: itemTitle, details: details ?? null,
  });
}
