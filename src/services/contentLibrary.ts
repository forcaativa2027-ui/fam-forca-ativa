import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentLibraryItem, ContentLibraryType } from "@/types/domain";

export async function listContentLibrary(sb: SupabaseClient): Promise<ContentLibraryItem[]> {
  const { data, error } = await sb.from("content_library").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ContentLibraryItem[];
}

export async function createContentLibraryItem(
  sb: SupabaseClient, item: { title: string; type: ContentLibraryType; url: string; tags: string[]; church_id: string | null }
): Promise<ContentLibraryItem> {
  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb.from("content_library").insert({ ...item, created_by: user?.id ?? null }).select().single();
  if (error) throw error;
  return data as ContentLibraryItem;
}

export async function deleteContentLibraryItem(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("content_library").delete().eq("id", id);
  if (error) throw error;
}
