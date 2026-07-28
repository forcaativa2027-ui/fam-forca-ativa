import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentCategory, ContentTag, ContentTaxonomy } from "@/types/domain";

export async function listContentCategories(sb: SupabaseClient): Promise<ContentCategory[]> {
  const { data, error } = await sb.from("content_categories").select("*").order("order_index");
  if (error) return [];
  return (data ?? []) as ContentCategory[];
}

export async function listContentTags(sb: SupabaseClient): Promise<ContentTag[]> {
  const { data, error } = await sb.from("content_tags").select("*").order("name");
  if (error) return [];
  return (data ?? []) as ContentTag[];
}

export async function createContentCategory(sb: SupabaseClient, name: string, color: string | null, orderIndex: number): Promise<void> {
  const slug = name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const { error } = await sb.from("content_categories").insert({ name: name.trim(), slug, color, order_index: orderIndex });
  if (error) throw error;
}

export async function deleteContentCategory(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("content_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function createContentTag(sb: SupabaseClient, name: string): Promise<void> {
  const { error } = await sb.from("content_tags").insert({ name: name.trim() });
  if (error) throw error;
}

export async function deleteContentTag(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("content_tags").delete().eq("id", id);
  if (error) throw error;
}

export async function getContentTaxonomy(sb: SupabaseClient, entityType: string, entityId: string): Promise<ContentTaxonomy> {
  const { data, error } = await sb.rpc("get_content_taxonomy", { p_entity_type: entityType, p_entity_id: entityId }).maybeSingle();
  if (error || !data) return { categories: [], tags: [] };
  return data as unknown as ContentTaxonomy;
}

export async function setContentTaxonomy(
  sb: SupabaseClient, entityType: string, entityId: string, categoryIds: string[], tagIds: string[]
): Promise<void> {
  const { error } = await sb.rpc("set_content_taxonomy", {
    p_entity_type: entityType, p_entity_id: entityId, p_category_ids: categoryIds, p_tag_ids: tagIds,
  });
  if (error) throw error;
}
