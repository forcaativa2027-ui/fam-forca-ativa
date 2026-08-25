import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as sbDefault } from "@/lib/supabase/client";

const sb = sbDefault as any;

export type SourceStatus = "current" | "review_required" | "updated" | "archived";
export interface KnowledgeSource {
  id: string;
  title: string;
  organization: string;
  source_type: string;
  official_url: string | null;
  publication_date: string | null;
  last_verified_at: string;
  status: SourceStatus;
  version: string;
  notes: string | null;
}

export interface KnowledgeTopic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface KnowledgeContent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  level: "entenda_2min" | "aprenda" | "aprofunde" | "fonte_oficial" | "geral";
  topic_id: string | null;
  estimated_minutes: number | null;
  keywords: string[];
  status: string;
  published_at: string | null;
}

export interface KnowledgeTrack {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  estimated_total_minutes: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface KnowledgeTrackItem {
  id: string;
  track_id: string;
  content_id: string;
  position: number;
  is_required: boolean;
  content?: KnowledgeContent;
}

export async function listSources(client: SupabaseClient = sb): Promise<KnowledgeSource[]> {
  const { data, error } = await (client as any).from("knowledge_sources").select("*").order("title");
  if (error) throw error;
  return (data ?? []) as KnowledgeSource[];
}

export async function listTopics(client: SupabaseClient = sb): Promise<KnowledgeTopic[]> {
  const { data, error } = await (client as any).from("knowledge_topics").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as KnowledgeTopic[];
}

export async function listContents(params: { topicId?: string; level?: string; q?: string; limit?: number } = {}, client: SupabaseClient = sb): Promise<KnowledgeContent[]> {
  let q = (client as any).from("knowledge_contents").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (params.topicId) q = q.eq("topic_id", params.topicId);
  if (params.level) q = q.eq("level", params.level);
  if (params.q) {
    const term = `%${params.q}%`;
    q = q.or(`title.ilike.${term},summary.ilike.${term},content.ilike.${term}`);
  }
  if (params.limit) q = q.limit(params.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as KnowledgeContent[];
}

export async function getContentBySlug(slug: string, client: SupabaseClient = sb): Promise<KnowledgeContent | null> {
  const { data, error } = await (client as any).from("knowledge_contents").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as KnowledgeContent) ?? null;
}

export async function listTracks(client: SupabaseClient = sb): Promise<KnowledgeTrack[]> {
  const { data, error } = await (client as any).from("knowledge_tracks").select("*").eq("is_active", true).order("sort_order");
  if (error) throw error;
  return (data ?? []) as KnowledgeTrack[];
}

export async function getTrackWithItems(slug: string, client: SupabaseClient = sb): Promise<{ track: KnowledgeTrack; items: KnowledgeTrackItem[] } | null> {
  const { data: track, error: e1 } = await (client as any).from("knowledge_tracks").select("*").eq("slug", slug).maybeSingle();
  if (e1) throw e1;
  if (!track) return null;
  const { data: items, error: e2 } = await (client as any).from("knowledge_track_items").select("*, content:knowledge_contents(*)").eq("track_id", track.id).order("position");
  if (e2) throw e2;
  return { track: track as KnowledgeTrack, items: (items ?? []) as any };
}

export async function searchKnowledge(q: string, client: SupabaseClient = sb): Promise<KnowledgeContent[]> {
  return listContents({ q, limit: 20 }, client);
}

export async function upsertProgress(
  userId: string,
  patch: { track_id?: string | null; content_id?: string | null; status: "not_started" | "started" | "completed" | "saved"; progress_percent?: number },
  client: SupabaseClient = sb
) {
  const { data, error } = await (client as any)
    .from("knowledge_progress")
    .upsert({ user_id: userId, track_id: patch.track_id ?? null, content_id: patch.content_id ?? null, status: patch.status, progress_percent: patch.progress_percent ?? (patch.status === "completed" ? 100 : 0) }, { onConflict: "user_id, track_id, content_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
