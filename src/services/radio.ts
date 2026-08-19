import type { SupabaseClient } from "@supabase/supabase-js";
import type { RadioConfig, RadioProgram, RadioEpisode, Weekday, RadioPlaylist, RadioPlaylistItem, RadioStudioInvite, RadioInviteValidation, RadioRecording, RadioProgramGuest, RadioPlaySource, RadioEpisodePlayStats, RadioAnalyticsSummary, RadioWeeklySchedule, RadioScheduleItem } from "@/types/domain";
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
  is_podcast?: boolean;
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

function extForMime(mimeType: string | null | undefined): string {
  if (mimeType && mimeType.includes("mp4")) return "m4a";
  if (mimeType && mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export async function uploadRadioRecording(
  sb: SupabaseClient,
  blob: Blob,
  churchId: string | null,
  mimeType?: string | null
): Promise<{ path: string; publicUrl: string }> {
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extForMime(mimeType)}`;
  const path = `${churchId ?? "geral"}/${slug}`;
  const contentType = mimeType || blob.type || "audio/webm";
  const { error } = await sb.storage.from(RADIO_BUCKET).upload(path, blob, { contentType });
  if (error) throw error;
  const { data } = sb.storage.from(RADIO_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function uploadRadioCover(
  sb: SupabaseClient,
  file: File,
  churchId: string | null
): Promise<{ path: string; publicUrl: string }> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `covers/${churchId ?? "geral"}/${slug}`;
  const { error } = await sb.storage.from(RADIO_BUCKET).upload(path, file, { contentType: file.type || "image/png" });
  if (error) throw error;
  const { data } = sb.storage.from(RADIO_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteRadioStoragePath(sb: SupabaseClient, path: string): Promise<void> {
  const { error } = await sb.storage.from(RADIO_BUCKET).remove([path]);
  if (error) throw error;
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
  cover_url: string | null;
  cover_storage_path: string | null;
}>): Promise<RadioRecording> {
  const { data: updated, error } = await sb.from("radio_recordings").update(data).eq("id", id).select().single();
  if (error) throw error;
  return updated as RadioRecording;
}

// ── Ciclo 2: Podcasts ──

export async function listPodcastEpisodes(sb: SupabaseClient, churchId?: string | null, limit = 50): Promise<RadioEpisode[]> {
  let q = sb.from("radio_episodes")
    .select("*")
    .eq("status", "published")
    .eq("is_podcast", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);
  if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as RadioEpisode[];
}

// ── Ciclo 2: Analytics de audiência ──

export async function registerRadioPlay(sb: SupabaseClient, data: {
  church_id: string | null;
  profile_id?: string | null;
  episode_id?: string | null;
  recording_id?: string | null;
  program_id?: string | null;
  source: RadioPlaySource;
}): Promise<string | null> {
  const { data: id, error } = await sb.rpc("radio_register_play", {
    p_church_id: data.church_id,
    p_profile_id: data.profile_id ?? null,
    p_episode_id: data.episode_id ?? null,
    p_recording_id: data.recording_id ?? null,
    p_program_id: data.program_id ?? null,
    p_source: data.source,
  });
  if (error) return null;
  return id as string | null;
}

export async function updateListenedSeconds(sb: SupabaseClient, eventId: string, seconds: number): Promise<boolean> {
  const { data, error } = await sb.rpc("radio_update_listened_seconds", { p_event_id: eventId, p_seconds: seconds });
  if (error) return false;
  return !!data;
}

export async function listEpisodePlayStats(sb: SupabaseClient, churchId?: string | null): Promise<RadioEpisodePlayStats[]> {
  let q = sb.from("radio_episode_play_stats").select("*").order("total_plays", { ascending: false }).limit(100);
  if (churchId) q = q.eq("church_id", churchId);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as RadioEpisodePlayStats[];
}

export async function getRadioAnalytics(sb: SupabaseClient, churchId?: string | null): Promise<RadioAnalyticsSummary> {
  let q = sb.from("radio_play_events").select("id, source, listened_seconds, started_at, profile_id");
  if (churchId) q = q.eq("church_id", churchId);
  const { data, error } = await q;
  if (error || !data) {
    return { total_plays: 0, total_listened_seconds: 0, unique_listeners: 0, live_plays: 0, podcast_plays: 0, episode_plays: 0, last_7d_plays: 0 };
  }
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  let total_listened_seconds = 0;
  let live_plays = 0, podcast_plays = 0, episode_plays = 0, last_7d_plays = 0;
  const listeners = new Set<string | null>();
  for (const row of data) {
    total_listened_seconds += row.listened_seconds ?? 0;
    if (row.source === "live") live_plays++;
    if (row.source === "podcast") podcast_plays++;
    if (row.source === "episode" || row.source === "reprise") episode_plays++;
    if (row.profile_id) listeners.add(row.profile_id);
    if (new Date(row.started_at).getTime() >= sevenDaysAgo) last_7d_plays++;
  }
  return {
    total_plays: data.length,
    total_listened_seconds,
    unique_listeners: listeners.size,
    live_plays,
    podcast_plays,
    episode_plays,
    last_7d_plays,
  };
}

// ── Ciclo 2: Multi-convidados ──

export async function listProgramGuests(sb: SupabaseClient, programId: string): Promise<RadioProgramGuest[]> {
  const { data, error } = await sb.from("radio_program_guests").select("*").eq("program_id", programId).order("sort_order");
  if (error) return [];
  return (data ?? []) as RadioProgramGuest[];
}

export async function createProgramGuest(sb: SupabaseClient, data: {
  program_id: string;
  guest_name: string;
  guest_email?: string | null;
  guest_role?: RadioProgramGuest["guest_role"];
  sort_order?: number;
}): Promise<RadioProgramGuest> {
  const { data: created, error } = await sb
    .from("radio_program_guests")
    .insert({ ...data, guest_role: data.guest_role ?? "convidado", sort_order: data.sort_order ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return created as RadioProgramGuest;
}

export async function deleteProgramGuest(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("radio_program_guests").delete().eq("id", id);
  if (error) throw error;
}

// ── Ciclo 4: Grade semanal (agenda visual) ──

const WEEKDAY_LABEL: Record<Weekday, string> = {
  domingo: "Domingo", segunda: "Segunda", terca: "Terça",
  quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado",
};

const WEEKDAY_ORDER: Weekday[] = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

function scheduleMinutes(time: string | null | undefined): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(reference: Date): Date {
  const d = new Date(reference);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function toScheduleItem(p: RadioProgram, weekday: Weekday, date: string | null, isSpecial: boolean): RadioScheduleItem {
  return {
    program_id: p.id,
    title: p.title,
    description: p.description ?? null,
    host_name: p.host_name ?? null,
    cover_url: p.cover_url ?? null,
    mode: p.mode ?? null,
    weekday,
    start_time: p.start_time ?? null,
    end_time: p.end_time ?? null,
    is_recurring: p.is_recurring,
    is_special: isSpecial,
    date,
  };
}

export async function getRadioWeeklySchedule(
  sb: SupabaseClient,
  churchId?: string | null,
  reference?: Date
): Promise<RadioWeeklySchedule> {
  const ref = reference ?? new Date();
  let q = sb.from("radio_programs").select("*").eq("is_active", true).order("sort_order");
  if (churchId) q = q.or(`church_id.eq.${churchId},church_id.is.null`);
  const { data, error } = await q;
  if (error) return { days: [], today: WEEKDAY_ORDER[ref.getDay()], week_start: isoDate(ref), week_end: isoDate(ref) };

  const programs = (data ?? []) as RadioProgram[];
  const weekStart = startOfWeek(ref);
  const days = WEEKDAY_ORDER.map((weekday, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateKey = isoDate(date);
    const items = programs.flatMap((p): RadioScheduleItem[] => {
      if (p.is_special) {
        const start = p.special_start_date ?? null;
        const end = p.special_end_date ?? null;
        if (start && dateKey >= start && (!end || dateKey <= end)) {
          return [toScheduleItem(p, weekday, dateKey, true)];
        }
        return [];
      }
      if (p.weekday === weekday) {
        return [toScheduleItem(p, weekday, null, false)];
      }
      return [];
    }).sort((a, b) => scheduleMinutes(a.start_time) - scheduleMinutes(b.start_time));
    return { weekday, label: WEEKDAY_LABEL[weekday], items };
  });

  return {
    days,
    today: WEEKDAY_ORDER[ref.getDay()],
    week_start: isoDate(weekStart),
    week_end: isoDate(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)),
  };
}

// ── Ciclo 5: Ouvintes e Notificações ──

export interface RadioRegisterInput {
  church_id: string | null;
  name: string;
  email: string;
  program_ids?: string[];
}

export async function registerRadioListener(
  sb: SupabaseClient,
  input: RadioRegisterInput
): Promise<RadioRegisterResult> {
  const { data, error } = await sb.rpc("radio_register_listener", {
    p_church_id: input.church_id,
    p_name: input.name,
    p_email: input.email,
    p_program_ids: input.program_ids ?? null,
  });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) throw new Error("Não foi possível registrar o ouvinte.");
  return row as RadioRegisterResult;
}

export async function unsubscribeRadioListener(sb: SupabaseClient, token: string): Promise<boolean> {
  const { data, error } = await sb.rpc("radio_unsubscribe_listener", { p_token: token });
  if (error) throw error;
  return !!data;
}

export async function getRadioListenerByToken(
  sb: SupabaseClient,
  token: string
): Promise<RadioListenerWithPrograms | null> {
  const { data, error } = await sb.rpc("radio_listener_by_token", { p_token: token });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return null;
  return row as RadioListenerWithPrograms;
}

export async function listRadioListeners(
  sb: SupabaseClient,
  churchId?: string | null
): Promise<RadioListenerWithPrograms[]> {
  const { data, error } = await sb.rpc("radio_list_all_listeners", {
    p_church_id: churchId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as RadioListenerWithPrograms[];
}

export async function deleteRadioListener(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("radio_listeners").delete().eq("id", id);
  if (error) throw error;
}