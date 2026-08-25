"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CecNewsVideoAdmin, VisibleNewsVideo, NewsVideoScope, NewsVideoStatus } from "@/types/domain";

export async function listNewsVideosAdmin(sb: SupabaseClient): Promise<CecNewsVideoAdmin[]> {
  const { data, error } = await sb.rpc("list_cec_news_videos_admin");
  if (error) { console.error("[newsVideos] listNewsVideosAdmin", error); return []; }
  return (data ?? []) as CecNewsVideoAdmin[];
}

export async function listVisibleNewsVideos(sb: SupabaseClient, profileId: string | null): Promise<VisibleNewsVideo[]> {
  const { data, error } = await sb.rpc("list_visible_news_videos", { p_profile_id: profileId });
  if (error) { console.error("[newsVideos] listVisibleNewsVideos", error); return []; }
  return (data ?? []) as VisibleNewsVideo[];
}

export interface NewsVideoInput {
  title: string; description?: string | null; video_url: string; cover_image_url?: string | null;
  event_id?: string | null;
  scope: NewsVideoScope; scope_ref_id?: string | null;
  published_at?: string | null; display_start_at: string; display_end_at?: string | null;
  is_featured?: boolean; is_pinned?: boolean; allow_autoplay?: boolean;
  show_signup_button?: boolean; show_event_button?: boolean; show_share_button?: boolean;
  sort_order?: number; status: NewsVideoStatus; responsible_id?: string | null;
}

export async function createNewsVideo(sb: SupabaseClient, input: NewsVideoInput): Promise<string> {
  const { data, error } = await sb.from("cec_news_videos").insert(input).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function updateNewsVideo(sb: SupabaseClient, id: string, input: Partial<NewsVideoInput>): Promise<void> {
  const { error } = await sb.from("cec_news_videos").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteNewsVideo(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("cec_news_videos").delete().eq("id", id);
  if (error) throw error;
}
