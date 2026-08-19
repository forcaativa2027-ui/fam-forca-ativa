import type { SupabaseClient } from "@supabase/supabase-js";
import type { RadioConfig, RadioProgram, RadioEpisode, Weekday, RadioPlaylist, RadioPlaylistItem, RadioStudioInvite, RadioInviteValidation, RadioRecording } from "@/types/domain";
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

// ── Studio remoto (gravação) ──

const RADIO_BUCKET = "radio-audio";

export async function uploadRadioRecording(sb: SupabaseClient, blob: Blob, churchId: string | null): Promise<{ path: string; publicUrl: string }> {
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webm`;
  const path = `${churchId ?? "geral"}/${slug}`;
  const { error } = await sb.storage.from(RADIO_BUCKET).upload(path, blob, { contentType: "audio/webm" });
  if (error) throw error;
  const { data } = sb.storage.from(RADIO_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

// ── Convites do apresentador (Studio) ──

export interface RadioStudioInviteInput {
  church_id: string | null;
  program_id: string | null;
  presenter_name: string | null;
  presenter_email: string | null;
  starts_at: string;
  ends_at: string;
  access_ends_at?: string | null;
}

export async function listStudioInvites(sb: SupabaseClient, churchId?: string | null): Promise<RadioStudioInvite[]> {
  let q = sb.from("radio_studio_invites").select("*").order("created_at", { ascending: false });
  if (churchId) q = q.eq("church_id", churchId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as RadioStudioInvite[];
}

export async function createStudioInvite(sb: SupabaseClient, data: RadioStudioInviteInput): Promise<RadioStudioInvite> {
  const token = crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36);
  const { data: created, error } = await sb
    .from("radio_studio_invites")
    .insert({ ...data, token })
    .select()
    .single();
  if (error) throw error;
  return created as RadioStudioInvite;
}

export async function revokeStudioInvite(sb: SupabaseClient, id: string, reason?: string): Promise<void> {
  const { error } = await sb
    .from("radio_studio_invites")
    .update({ status: "revogado", revoked_at: new Date().toISOString(), revoke_reason: reason ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function validateInviteToken(sb: SupabaseClient, token: string): Promise<RadioInviteValidation | null> {
  const { data, error } = await sb.rpc("radio_validate_invite", { p_token: token });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return row as RadioInviteValidation;
}

export async function useInviteToken(sb: SupabaseClient, token: string): Promise<boolean> {
  const { data, error } = await sb.rpc("radio_use_invite", { p_token: token });
  if (error) return false;
  return !!data;
}

// ── Gravações automáticas e reprise ──

export async function listRadioRecordings(sb: SupabaseClient, churchId?: string | null): Promise<RadioRecording[]> {
  let q = sb.from("radio_recordings").select("*").order("recorded_at", { ascending: false });
  if (churchId) q = q.eq("church_id", churchId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as RadioRecording[];
}

export async function createRadioRecording(sb: SupabaseClient, data: {
  church_id: string | null;
  program_id: string | null;
  presenter_name: string | null;
  title: string;
}): Promise<RadioRecording> {
  const { data: row, error } = await sb.rpc("radio_start_recording", {
    p_church_id: data.church_id,
    p_program_id: data.program_id,
    p_presenter_name: data.presenter_name,
    p_title: data.title,
  });
  if (error) throw error;
  const { data: created, error: e2 } = await sb.from("radio_recordings").select("*").eq("id", row as string).single();
  if (e2) throw e2;
  return created as RadioRecording;
}

export async function updateRadioRecording(sb: SupabaseClient, id: string, data: Partial<{
  status: RadioRecording["status"];
  audio_url: string | null;
  storage_path: string;
  duration_seconds: number | null;
  episode_id: string | null;
  is_reprise: boolean;
  review_notes: string | null;
}>): Promise<RadioRecording> {
  const { data: updated, error } = await sb.from("radio_recordings").update(data).eq("id", id).select().single();
  if (error) throw error;
  return updated as RadioRecording;
}