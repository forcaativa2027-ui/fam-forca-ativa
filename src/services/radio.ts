import type { SupabaseClient } from "@supabase/supabase-js";
import type { RadioConfig, RadioProgram, RadioEpisode, Weekday, RadioPlaylist, RadioPlaylistItem } from "@/types/domain";
import { radioProgramSchema, type RadioProgramInput } from "@/schemas/radioProgramSchema";

export async function getRadioConfig(sb: SupabaseClient, churchId?: string | null): Promise<RadioConfig | null> {
  let q = sb.from("radio_config").select("*").eq("is_enabled", true);
  if (churchId) q = q.eq("church_id", churchId);
  else q = q.is("church_id", null);
  const { data, error } = await q.maybeSingle();
  if (error) return null;
  return data as RadioConfig | null;
}

export async function listRadioPrograms(sb: SupabaseClient, churchId?: string | null): Promise<RadioProgram[]> {
  let q = sb.from("radio_programs").select("*").eq("is_active", true).order("sort_order");
  if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as RadioProgram[];
}

export async function listRadioEpisodes(
  sb: SupabaseClient,
  churchId?: string | null,
  category?: string,
  limit = 20
): Promise<RadioEpisode[]> {
  let q = sb.from("radio_episodes")
    .select("*")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as RadioEpisode[];
}

export async function getAllPrograms(sb: SupabaseClient, churchId?: string | null, limit = 50): Promise<RadioProgram[]> {
  let q = sb.from("radio_programs").select("*").order("sort_order").limit(limit);
  if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as RadioProgram[];
}

export async function getProgramById(sb: SupabaseClient, programId: string): Promise<RadioProgram | null> {
  const { data, error } = await sb.from("radio_programs").select("*").eq("id", programId).maybeSingle();
  if (error) return null;
  return data as RadioProgram | null;
}

export async function createRadioProgram(
  sb: SupabaseClient,
  churchId: string,
  data: RadioProgramInput
): Promise<RadioProgram> {
  const validated = radioProgramSchema.safeParse(data);
  if (!validated.success) {
    const errors = validated.error.errors.map((e) => e.message).join(", ");
    throw new Error(`Dados inválidos: ${errors}`);
  }
  const { data: created, error } = await sb
    .from("radio_programs")
    .insert({ ...validated.data, church_id: churchId })
    .select()
    .single();
  if (error) throw error;
  return created as RadioProgram;
}

export async function updateRadioProgram(
  sb: SupabaseClient,
  id: string,
  data: RadioProgramInput
): Promise<RadioProgram> {
  const validated = radioProgramSchema.safeParse(data);
  if (!validated.success) {
    const errors = validated.error.errors.map((e) => e.message).join(", ");
    throw new Error(`Dados inválidos: ${errors}`);
  }
  const { data: updated, error } = await sb
    .from("radio_programs")
    .update(validated.data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated as RadioProgram;
}

export async function deleteRadioProgram(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("radio_programs").delete().eq("id", id);
  if (error) throw error;
}

export interface RadioEpisodeInput {
  church_id?: string | null;
  program_id?: string | null;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  audio_url: string;
  duration_seconds?: number | null;
  category?: RadioEpisode["category"];
  speaker?: string | null;
  published_at?: string | null;
  status?: RadioEpisode["status"];
  is_featured?: boolean;
  sort_order?: number;
}

export async function listAllRadioEpisodes(sb: SupabaseClient, churchId?: string | null, limit = 100): Promise<RadioEpisode[]> {
  let q = sb.from("radio_episodes").select("*").order("published_at", { ascending: false }).limit(limit);
  if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as RadioEpisode[];
}

export async function createRadioEpisode(sb: SupabaseClient, data: RadioEpisodeInput): Promise<RadioEpisode> {
  const { data: created, error } = await sb
    .from("radio_episodes")
    .insert({ ...data, status: data.status ?? "draft", published_at: data.published_at ?? new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return created as RadioEpisode;
}

export async function updateRadioEpisode(sb: SupabaseClient, id: string, data: Partial<RadioEpisodeInput>): Promise<RadioEpisode> {
  const { data: updated, error } = await sb
    .from("radio_episodes")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated as RadioEpisode;
}

export async function deleteRadioEpisode(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("radio_episodes").delete().eq("id", id);
  if (error) throw error;
}

export interface RadioConfigInput {
  church_id: string | null;
  is_enabled: boolean;
  display_name: string;
  short_name?: string | null;
  logo_url?: string | null;
  stream_url?: string | null;
  theme_color?: string | null;
  description?: string | null;
}

export async function getRadioConfigByChurch(sb: SupabaseClient, churchId: string | null): Promise<RadioConfig | null> {
  let q = sb.from("radio_config").select("*");
  if (churchId) q = q.eq("church_id", churchId);
  else q = q.is("church_id", null);
  const { data, error } = await q.maybeSingle();
  if (error) return null;
  return data as RadioConfig | null;
}

export async function upsertRadioConfig(sb: SupabaseClient, data: RadioConfigInput): Promise<RadioConfig> {
  const { data: saved, error } = await sb
    .from("radio_config")
    .upsert(data, { onConflict: "church_id" })
    .select()
    .single();
  if (error) throw error;
  return saved as RadioConfig;
}

// ── Broadcast Engine ──

export interface WhatsOnAir {
  program_id: string;
  title: string;
  description: string | null;
  host_name: string | null;
  mode: RadioProgram["mode"];
  start_time: string | null;
  end_time: string | null;
  weekday: Weekday | null;
  fallback_url: string | null;
  is_special: boolean;
  stream_url: string | null;
}

export async function whatsOnAir(sb: SupabaseClient, churchId: string): Promise<WhatsOnAir | null> {
  const { data, error } = await sb.rpc("radio_whats_on_air", { p_church_id: churchId });
  if (error) return null;
  if (!data || data.length === 0) return null;
  return data[0] as WhatsOnAir;
}

// ── Playlists ──

export interface RadioPlaylistInput {
  church_id: string | null;
  name: string;
  description?: string | null;
  mode?: "ordered" | "shuffle" | "thematic";
  is_active?: boolean;
  sort_order?: number;
}

export async function listRadioPlaylists(sb: SupabaseClient, churchId?: string | null): Promise<RadioPlaylist[]> {
  let q = sb.from("radio_playlists").select("*").order("sort_order");
  if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as RadioPlaylist[];
}

export async function createRadioPlaylist(sb: SupabaseClient, data: RadioPlaylistInput): Promise<RadioPlaylist> {
  const { data: created, error } = await sb.from("radio_playlists").insert(data).select().single();
  if (error) throw error;
  return created as RadioPlaylist;
}

export async function updateRadioPlaylist(sb: SupabaseClient, id: string, data: Partial<RadioPlaylistInput>): Promise<RadioPlaylist> {
  const { data: updated, error } = await sb.from("radio_playlists").update(data).eq("id", id).select().single();
  if (error) throw error;
  return updated as RadioPlaylist;
}

export async function deleteRadioPlaylist(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("radio_playlists").delete().eq("id", id);
  if (error) throw error;
}

export async function listPlaylistItems(sb: SupabaseClient, playlistId: string): Promise<RadioPlaylistItem[]> {
  const { data, error } = await sb.from("radio_playlist_items").select("*").eq("playlist_id", playlistId).order("sort_order");
  if (error) throw error;
  return (data ?? []) as RadioPlaylistItem[];
}

export async function addPlaylistItem(sb: SupabaseClient, playlistId: string, episodeId: string, sortOrder?: number): Promise<RadioPlaylistItem> {
  const { data: created, error } = await sb
    .from("radio_playlist_items")
    .insert({ playlist_id: playlistId, episode_id: episodeId, sort_order: sortOrder ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return created as RadioPlaylistItem;
}

export async function removePlaylistItem(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("radio_playlist_items").delete().eq("id", id);
  if (error) throw error;
}