import type { SupabaseClient } from "@supabase/supabase-js";
import type { Banner } from "@/types/domain";

/** Lista banners ativos e dentro do periodo (publico). */
export async function listActiveBanners(sb: SupabaseClient): Promise<Banner[]> {
  try {
    const { data, error } = await sb.rpc("get_active_banners");
    if (error || !data) return [];
    return data as Banner[];
  } catch { return []; }
}

/** Lista TODOS os banners (admin). */
export async function listAllBanners(sb: SupabaseClient): Promise<Banner[]> {
  try {
    const { data, error } = await sb.from("banners").select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as Banner[];
  } catch { return []; }
}

export async function createBanner(sb: SupabaseClient, input: Partial<Banner>): Promise<Banner> {
  const { data, error } = await sb.from("banners").insert(input).select().single();
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

/** Troca a ordem entre 2 banners. */
export async function swapBannerOrder(sb: SupabaseClient, a: Banner, b: Banner): Promise<void> {
  // Atualiza um por vez (sem transação, mas é ok pra essa operação)
  const { error: e1 } = await sb.from("banners").update({ sort_order: b.sort_order }).eq("id", a.id);
  if (e1) throw e1;
  const { error: e2 } = await sb.from("banners").update({ sort_order: a.sort_order }).eq("id", b.id);
  if (e2) throw e2;
}
